package com.zipai.web;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zipai.domain.*;
import com.zipai.repository.PropertyRepository;
import com.zipai.service.AuthService;
import jakarta.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
public class PropertyController {
    private final PropertyRepository properties;
    private final AuthService auth;
    private final ObjectMapper json;
    private final JdbcTemplate jdbc;
    public PropertyController(PropertyRepository properties, AuthService auth, ObjectMapper json, JdbcTemplate jdbc) {
        this.properties = properties; this.auth = auth; this.json = json; this.jdbc = jdbc;
    }

    @GetMapping("/api/properties/mine")
    Map<String, Object> mine(HttpSession session) {
        User user = auth.required(session);
        return Map.of("items", properties.findByOwnerIdOrderByIdDesc(user.id).stream().map(this::view).toList());
    }

    @GetMapping("/api/general-properties")
    Map<String, Object> generalProperties() {
        List<Map<String, Object>> items = properties.findByStatusOrderByIdDesc("approved")
            .stream().map(this::view).toList();
        return Map.of("source", "ZipAI MySQL", "items", items, "count", items.size());
    }

    @PostMapping("/api/properties")
    @ResponseStatus(HttpStatus.CREATED)
    Map<String, Object> create(@RequestBody Map<String, Object> body, HttpSession session) throws Exception {
        User user = auth.required(session);
        String title = text(body, "title"), address = text(body, "address");
        if (title.isBlank() || !address.startsWith("경기도 "))
            throw new ResponseStatusException(BAD_REQUEST, "경기도 매물 제목과 주소를 확인해 주세요.");
        PropertyListing item = new PropertyListing();
        item.owner = user; item.payloadJson = json.writeValueAsString(body);
        properties.save(item);
        return Map.of("item", view(item));
    }

    @GetMapping("/api/favorites")
    Map<String, Object> favorites(HttpSession session) {
        User user = auth.required(session);
        List<Long> ids = jdbc.query("SELECT property_id FROM favorites WHERE user_id=? ORDER BY created_at",
            (rs, row) -> Long.valueOf(rs.getString(1)), user.id);
        return Map.of("ids", ids);
    }

    @PutMapping("/api/favorites")
    @Transactional
    Map<String, Object> favorites(@RequestBody Map<String, Object> body, HttpSession session) {
        User user = auth.required(session);
        List<?> source = body.get("ids") instanceof List<?> list ? list : List.of();
        List<String> ids = source.stream().map(String::valueOf).distinct().limit(500).toList();
        jdbc.update("DELETE FROM favorites WHERE user_id=?", user.id);
        ids.forEach(id -> jdbc.update("INSERT INTO favorites(user_id,property_id,created_at) VALUES(?,?,?)",
            user.id, id, LocalDateTime.now()));
        return Map.of("ids", ids.stream().map(Long::valueOf).toList());
    }

    private Map<String, Object> view(PropertyListing item) {
        try {
            Map<String, Object> result = new LinkedHashMap<>(json.readValue(item.payloadJson, new TypeReference<>() {}));
            result.put("id", item.id); result.put("ownerId", item.owner.id); result.put("status", item.status);
            result.put("createdAt", item.createdAt);
            return result;
        } catch (Exception e) { throw new IllegalStateException(e); }
    }
    private static String text(Map<String, Object> map, String key) { return String.valueOf(map.getOrDefault(key, "")).trim(); }
}
