package com.zipai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zipai.domain.DefenseReport;
import com.zipai.domain.User;
import com.zipai.repository.DefenseReportRepository;
import java.security.SecureRandom;
import java.security.MessageDigest;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import java.util.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@Service
public class DefenseReportService {
    private final DefenseReportRepository reports;
    private final ObjectMapper json;
    private final SecureRandom random = new SecureRandom();
    @Value("${zipai.report.file-key:change-this-report-file-key}") String fileKey;

    public DefenseReportService(DefenseReportRepository reports, ObjectMapper json) {
        this.reports = reports;
        this.json = json;
    }

    @Transactional
    public Map<String,Object> create(User user, Map<String,Object> body) {
        String type = text(body, "reportType");
        if (!Set.of("registry", "charter-rate", "checklist", "combined").contains(type))
            throw new ResponseStatusException(BAD_REQUEST, "지원하지 않는 진단 유형입니다.");
        Object snapshot = body.get("snapshot");
        if (!(snapshot instanceof Map<?,?>)) throw new ResponseStatusException(BAD_REQUEST, "진단 결과가 필요합니다.");
        DefenseReport report = new DefenseReport();
        report.user = user;
        report.reportType = type;
        report.title = limited(text(body, "title"), 255, "안전 진단 결과");
        try {
            report.snapshotJson = json.writeValueAsString(snapshot);
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(BAD_REQUEST, "진단 결과를 저장할 수 없습니다.");
        }
        if (report.snapshotJson.length() > 200_000) throw new ResponseStatusException(PAYLOAD_TOO_LARGE, "진단 결과가 너무 큽니다.");
        return view(reports.save(report), false);
    }

    @Transactional
    public Map<String,Object> createRegistry(User user, String fileName, String contentType, byte[] file, Map<String,Object> analysis) {
        if(file.length==0||file.length>10L*1024*1024)throw new ResponseStatusException(PAYLOAD_TOO_LARGE,"PDF 파일은 10MB 이하로 업로드해 주세요.");
        DefenseReport report=new DefenseReport();report.user=user;report.reportType="registry";report.title=limited("등기사항증명서 분석 · "+fileName,255,"등기사항증명서 분석");report.originalFileName=limited(fileName,255,"registry.pdf");report.originalContentType="application/pdf";report.originalFile=encrypt(file);
        try{report.snapshotJson=json.writeValueAsString(analysis);}catch(JsonProcessingException e){throw new ResponseStatusException(BAD_REQUEST,"진단 결과를 저장할 수 없습니다.");}
        return view(reports.save(report),false);
    }

    public Map<String,Object> list(User user, int page, int size) {
        var result = reports.findByUserIdOrderByIdDesc(user.id, PageRequest.of(Math.max(0,page), Math.min(50,Math.max(1,size))));
        return Map.of("items", result.getContent().stream().map(r -> view(r,false)).toList(), "page", result.getNumber(), "totalPages", result.getTotalPages(), "totalItems", result.getTotalElements());
    }

    public Map<String,Object> one(User user, Long id) {
        return view(reports.findByIdAndUserId(id,user.id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND,"진단 기록을 찾을 수 없습니다.")), true);
    }

    public DefenseReport owned(User user,Long id){return reports.findByIdAndUserId(id,user.id).orElseThrow(()->new ResponseStatusException(NOT_FOUND,"진단 기록을 찾을 수 없습니다."));}

    public byte[] resultBytes(User user,Long id){DefenseReport r=owned(user,id);return r.snapshotJson.getBytes(java.nio.charset.StandardCharsets.UTF_8);}

    public byte[] originalBytes(User user,Long id){DefenseReport r=owned(user,id);if(r.originalFile==null||r.originalFile.length==0)throw new ResponseStatusException(NOT_FOUND,"보관된 원본 파일이 없습니다.");return decrypt(r.originalFile);}

    @Transactional
    public Map<String,Object> share(User user, Long id) {
        DefenseReport report = reports.findByIdAndUserId(id,user.id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND,"진단 기록을 찾을 수 없습니다."));
        if (report.shareToken == null) report.shareToken = token();
        reports.save(report);
        return Map.of("shareToken", report.shareToken, "sharePath", "/api/defense/reports/shared/" + report.shareToken);
    }

    @Transactional
    public void unshare(User user, Long id) {
        DefenseReport report = reports.findByIdAndUserId(id,user.id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND,"진단 기록을 찾을 수 없습니다."));
        report.shareToken = null;
        reports.save(report);
    }

    public Map<String,Object> shared(String token) {
        if (!token.matches("^[A-Za-z0-9_-]{43}$")) throw new ResponseStatusException(NOT_FOUND,"공유 진단을 찾을 수 없습니다.");
        return view(reports.findByShareToken(token).orElseThrow(() -> new ResponseStatusException(NOT_FOUND,"공유 진단을 찾을 수 없습니다.")), true);
    }

    private Map<String,Object> view(DefenseReport r, boolean includeSnapshot) {
        Map<String,Object> result = new LinkedHashMap<>();
        result.put("id",r.id); result.put("reportType",r.reportType); result.put("title",r.title);
        result.put("createdAt",r.createdAt); result.put("shared",r.shareToken!=null);result.put("hasOriginalFile",r.originalFileName!=null);result.put("originalFileName",r.originalFileName==null?"":r.originalFileName);
        if (includeSnapshot) try { result.put("snapshot",json.readValue(r.snapshotJson,Object.class)); } catch (JsonProcessingException ignored) { result.put("snapshot",Map.of()); }
        return result;
    }
    private String token(){byte[] bytes=new byte[32];random.nextBytes(bytes);return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);}
    private byte[] encrypt(byte[] plain){try{byte[] nonce=new byte[12];random.nextBytes(nonce);Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,key(),new GCMParameterSpec(128,nonce));byte[] encrypted=cipher.doFinal(plain),result=new byte[4+nonce.length+encrypted.length];System.arraycopy(new byte[]{'Z','A','E','1'},0,result,0,4);System.arraycopy(nonce,0,result,4,nonce.length);System.arraycopy(encrypted,0,result,16,encrypted.length);return result;}catch(Exception e){throw new ResponseStatusException(INTERNAL_SERVER_ERROR,"원본 파일을 안전하게 저장하지 못했습니다.");}}
    private byte[] decrypt(byte[] stored){if(stored.length<16||stored[0]!='Z'||stored[1]!='A'||stored[2]!='E'||stored[3]!='1')return Arrays.copyOf(stored,stored.length);try{byte[] nonce=Arrays.copyOfRange(stored,4,16),encrypted=Arrays.copyOfRange(stored,16,stored.length);Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.DECRYPT_MODE,key(),new GCMParameterSpec(128,nonce));return cipher.doFinal(encrypted);}catch(Exception e){throw new ResponseStatusException(INTERNAL_SERVER_ERROR,"원본 파일을 복호화하지 못했습니다.");}}
    private SecretKeySpec key()throws Exception{return new SecretKeySpec(MessageDigest.getInstance("SHA-256").digest(fileKey.getBytes(java.nio.charset.StandardCharsets.UTF_8)),"AES");}
    private String text(Map<String,Object>b,String key){return String.valueOf(b.getOrDefault(key,"")).trim();}
    private String limited(String value,int max,String fallback){String v=value.isBlank()?fallback:value;return v.length()>max?v.substring(0,max):v;}
}
