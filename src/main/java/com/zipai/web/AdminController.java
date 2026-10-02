package com.zipai.web;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zipai.domain.*;
import com.zipai.repository.*;
import com.zipai.service.*;
import jakarta.servlet.http.HttpSession;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@RestController @RequestMapping("/api/admin")
public class AdminController {
    private final PropertyRepository properties;private final PostRepository posts;private final AuthService auth;
    private final NotificationService notices;private final ObjectMapper json;private final AdminStatisticsService statistics;private final AdminAuditService audit;private final AdminAuditLogRepository auditLogs;
    public AdminController(PropertyRepository p,PostRepository r,AuthService a,NotificationService n,ObjectMapper j,AdminStatisticsService st,AdminAuditService au,AdminAuditLogRepository al){properties=p;posts=r;auth=a;notices=n;json=j;statistics=st;audit=au;auditLogs=al;}
    @GetMapping("/dashboard")Map<String,Object> dashboard(HttpSession s){auth.admin(s);return Map.of("statistics",statistics.dashboard());}
    @GetMapping("/properties")Map<String,Object> properties(@RequestParam(defaultValue="")String status,@RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="20")int size,HttpSession s){auth.admin(s);Pageable pageable=PageRequest.of(Math.max(0,page),Math.min(100,Math.max(1,size)),Sort.by(Sort.Direction.DESC,"id"));Page<PropertyListing> result=status.isBlank()?properties.findAll(pageable):properties.findByStatus(status,pageable);return page(result,result.getContent().stream().map(this::property).toList());}
    @PatchMapping("/properties/{id}/status")
    Map<String,Object> property(@PathVariable Long id,@RequestBody Map<String,Object>b,HttpSession s){User admin=auth.admin(s);String status=String.valueOf(b.getOrDefault("status",""));
        if(!Set.of("approved","rejected","closed").contains(status))throw new ResponseStatusException(BAD_REQUEST,"매물 처리 상태를 확인해 주세요.");
        PropertyListing p=properties.findById(id).orElseThrow(()->new ResponseStatusException(NOT_FOUND,"매물을 찾을 수 없습니다."));
        p.status=status;properties.save(p);String title=String.valueOf(property(p).getOrDefault("title","매물 #"+p.id));
        String label=status.equals("approved")?"승인":status.equals("rejected")?"거절":"종료";
        notices.create(p.owner,"property_review","매물 검토 결과",title+" 매물이 "+label+" 처리되었습니다.","property",p.id);audit.record(admin,"PROPERTY_STATUS","property",p.id,status);
        return Map.of("success",true,"status",status);}
    @GetMapping("/community/posts")Map<String,Object> posts(@RequestParam(defaultValue="")String query,@RequestParam(defaultValue="false")boolean deleted,@RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="20")int size,HttpSession s){auth.admin(s);Pageable pageable=PageRequest.of(Math.max(0,page),Math.min(100,Math.max(1,size)),Sort.by(Sort.Direction.DESC,"id"));Page<CommunityPost> result=deleted?posts.findByDeletedAtIsNotNullAndTitleContainingIgnoreCase(query,pageable):posts.findByDeletedAtIsNullAndTitleContainingIgnoreCase(query,pageable);return page(result,result.getContent().stream().map(this::post).toList());}
    @DeleteMapping("/community/posts/{id}")Map<String,Object> delete(@PathVariable Long id,@RequestBody(required=false)Map<String,Object>b,HttpSession s){User admin=auth.admin(s);CommunityPost p=posts.findById(id).orElseThrow(()->new ResponseStatusException(NOT_FOUND,"게시글을 찾을 수 없습니다."));p.deletedAt=java.time.LocalDateTime.now();p.deletedBy=admin;p.deleteReason=b==null?"":String.valueOf(b.getOrDefault("reason",""));posts.save(p);audit.record(admin,"COMMUNITY_DELETE","community_post",id,p.deleteReason);return Map.of("success",true);}
    @PatchMapping("/community/posts/{id}/restore")Map<String,Object> restore(@PathVariable Long id,HttpSession s){User admin=auth.admin(s);CommunityPost p=posts.findById(id).orElseThrow(()->new ResponseStatusException(NOT_FOUND,"게시글을 찾을 수 없습니다."));p.deletedAt=null;p.deletedBy=null;p.deleteReason="";posts.save(p);audit.record(admin,"COMMUNITY_RESTORE","community_post",id,"");return Map.of("success",true);}
    @GetMapping("/audit-logs")Map<String,Object> logs(@RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="20")int size,HttpSession s){auth.admin(s);Page<AdminAuditLog> result=auditLogs.findAllByOrderByCreatedAtDesc(PageRequest.of(Math.max(0,page),Math.min(100,Math.max(1,size))));return page(result,result.getContent().stream().map(this::auditLog).toList());}
    private Map<String,Object> post(CommunityPost p){Map<String,Object>m=new LinkedHashMap<>();m.put("id",p.id);m.put("title",p.title);m.put("category",p.category);m.put("content",p.content);m.put("username",p.author.username);m.put("created_at",p.createdAt);m.put("deletedAt",p.deletedAt);m.put("deleteReason",p.deleteReason);return m;}
    private Map<String,Object> auditLog(AdminAuditLog log){Map<String,Object>m=new LinkedHashMap<>();m.put("id",log.id);m.put("admin",log.admin==null?"":Objects.toString(log.admin.username,""));m.put("action",Objects.toString(log.action,""));m.put("targetType",Objects.toString(log.targetType,""));m.put("targetId",Objects.toString(log.targetId,""));m.put("detail",Objects.toString(log.detail,""));m.put("createdAt",log.createdAt);return m;}
    private Map<String,Object> page(Page<?> p,List<?> items){return Map.of("items",items,"page",p.getNumber(),"size",p.getSize(),"totalItems",p.getTotalElements(),"totalPages",p.getTotalPages());}
    private Map<String,Object> property(PropertyListing p){try{Map<String,Object>m=new LinkedHashMap<>(json.readValue(p.payloadJson,new TypeReference<>(){}));
        m.put("id",p.id);m.put("ownerId",p.owner.id);m.put("owner",p.owner.username);m.put("status",p.status);m.put("createdAt",p.createdAt);return m;
        }catch(Exception e){throw new IllegalStateException(e);}}
}
