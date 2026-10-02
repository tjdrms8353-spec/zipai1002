package com.zipai.web;

import com.zipai.service.AuthService;
import com.zipai.service.DefenseReportService;
import jakarta.servlet.http.HttpSession;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/defense/reports")
public class DefenseReportController {
    private final DefenseReportService reports;
    private final AuthService auth;
    public DefenseReportController(DefenseReportService reports, AuthService auth){this.reports=reports;this.auth=auth;}
    @PostMapping @ResponseStatus(HttpStatus.CREATED) Map<String,Object> create(@RequestBody Map<String,Object>b,HttpSession s){return Map.of("report",reports.create(auth.required(s),b));}
    @GetMapping Map<String,Object> list(@RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="10")int size,HttpSession s){return reports.list(auth.required(s),page,size);}
    @GetMapping("/{id}") Map<String,Object> one(@PathVariable Long id,HttpSession s){return Map.of("report",reports.one(auth.required(s),id));}
    @GetMapping("/{id}/download/result") ResponseEntity<byte[]> result(@PathVariable Long id,HttpSession s){byte[] body=reports.resultBytes(auth.required(s),id);return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=zipai-report-"+id+".json").body(body);}
    @GetMapping("/{id}/download/original") ResponseEntity<byte[]> original(@PathVariable Long id,HttpSession s){var user=auth.required(s);var report=reports.owned(user,id);byte[] body=reports.originalBytes(user,id);String name=java.net.URLEncoder.encode(report.originalFileName,java.nio.charset.StandardCharsets.UTF_8).replace("+","%20");return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF).header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename*=UTF-8''"+name).body(body);}
    @PostMapping("/{id}/share") Map<String,Object> share(@PathVariable Long id,HttpSession s){return reports.share(auth.required(s),id);}
    @DeleteMapping("/{id}/share") Map<String,Object> unshare(@PathVariable Long id,HttpSession s){reports.unshare(auth.required(s),id);return Map.of("success",true);}
    @GetMapping("/shared/{token}") Map<String,Object> shared(@PathVariable String token){return Map.of("report",reports.shared(token));}
}
