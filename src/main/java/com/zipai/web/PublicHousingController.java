package com.zipai.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class PublicHousingController {
    private static final String ENDPOINT =
        "https://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1";
    private static final DateTimeFormatter API_DATE = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    private final ObjectMapper json;
    private final HttpClient http = HttpClient.newHttpClient();
    private final String serviceKey;
    private volatile long cacheExpiresAt;
    private volatile List<Map<String, Object>> cachedItems = List.of();

    public PublicHousingController(
        ObjectMapper json,
        @Value("${PUBLIC_DATA_SERVICE_KEY:}") String serviceKey
    ) {
        this.json = json;
        this.serviceKey = serviceKey.trim();
    }

    @GetMapping("/api/public-housing")
    Map<String, Object> publicHousing() {
        if (serviceKey.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "PUBLIC_DATA_SERVICE_KEY가 설정되지 않았습니다."
            );
        }
        if (cacheExpiresAt > System.currentTimeMillis()) {
            return Map.of("source", "LH 공공데이터", "items", cachedItems, "cached", true);
        }

        synchronized (this) {
            if (cacheExpiresAt > System.currentTimeMillis()) {
                return Map.of("source", "LH 공공데이터", "items", cachedItems, "cached", true);
            }
            try {
                List<JsonNode> notices = new ArrayList<>();
                collectNotices(fetch("06"), notices);
                collectNotices(fetch("13"), notices);

                Set<String> seen = new LinkedHashSet<>();
                List<Map<String, Object>> items = notices.stream()
                    .filter(item -> seen.add(text(item, "DTL_URL", text(item, "PAN_NM", ""))))
                    .filter(this::isGyeonggi)
                    .map(this::view)
                    .toList();
                cachedItems = items;
                cacheExpiresAt = System.currentTimeMillis() + 10 * 60 * 1000L;
                return Map.of("source", "LH 공공데이터", "items", items, "cached", false);
            } catch (InterruptedException error) {
                Thread.currentThread().interrupt();
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "LH API 요청이 중단되었습니다.");
            } catch (Exception error) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "LH 공공임대 정보를 불러오지 못했습니다.",
                    error
                );
            }
        }
    }

    private JsonNode fetch(String typeCode) throws Exception {
        LocalDate today = LocalDate.now();
        Map<String, String> params = new LinkedHashMap<>();
        params.put("ServiceKey", serviceKey);
        params.put("PG_SZ", "100");
        params.put("PAGE", "1");
        params.put("UPP_AIS_TP_CD", typeCode);
        params.put("CNP_CD", "41");
        params.put("PAN_SS", "공고중");
        params.put("PAN_NT_ST_DT", today.minusDays(120).format(API_DATE));
        params.put("CLSG_DT", today.plusYears(1).format(API_DATE));

        String query = params.entrySet().stream()
            .map(entry -> encode(entry.getKey()) + "=" + encode(entry.getValue()))
            .reduce((left, right) -> left + "&" + right)
            .orElse("");
        HttpRequest request = HttpRequest.newBuilder(URI.create(ENDPOINT + "?" + query))
            .header("Accept", "application/json")
            .GET()
            .build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("LH API 응답 오류: " + response.statusCode());
        }
        return json.readTree(response.body());
    }

    private void collectNotices(JsonNode node, List<JsonNode> result) {
        if (node == null) return;
        if (node.isObject()) {
            if (node.hasNonNull("PAN_NM")) result.add(node);
            node.elements().forEachRemaining(child -> collectNotices(child, result));
        } else if (node.isArray()) {
            node.elements().forEachRemaining(child -> collectNotices(child, result));
        }
    }

    private boolean isGyeonggi(JsonNode item) {
        return text(item, "CNP_CD_NM", "경기").contains("경기")
            || text(item, "PAN_NM", "").contains("경기");
    }

    private Map<String, Object> view(JsonNode item) {
        Map<String, Object> result = new LinkedHashMap<>();
        String title = text(item, "PAN_NM", "LH 공공임대 모집공고");
        String detailUrl = text(item, "DTL_URL", "https://apply.lh.or.kr/");
        result.put("id", Integer.toUnsignedLong((detailUrl + title).hashCode()));
        result.put("title", title);
        result.put("type", text(item, "AIS_TP_CD_NM", text(item, "UPP_AIS_TP_NM", "공공임대")));
        result.put("region", text(item, "CNP_CD_NM", "경기도"));
        result.put("status", text(item, "PAN_SS", "공고중"));
        result.put("postedAt", text(item, "PAN_NT_ST_DT", ""));
        result.put("closeAt", text(item, "CLSG_DT", ""));
        result.put("detailUrl", detailUrl);
        result.put("fetchedAt", LocalDate.now().toString());
        return result;
    }

    private static String text(JsonNode node, String key, String fallback) {
        JsonNode value = node.get(key);
        return value == null || value.isNull() ? fallback : value.asText(fallback);
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
