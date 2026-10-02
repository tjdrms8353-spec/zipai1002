package com.zipai.web;

import com.zipai.domain.*;
import com.zipai.repository.NotificationRepository;
import com.zipai.service.AuthService;
import jakarta.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController @RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationRepository notifications;private final AuthService auth;
    public NotificationController(NotificationRepository n,AuthService a){notifications=n;auth=a;}
    @GetMapping Map<String,Object> list(HttpSession s){User u=auth.required(s);
        return Map.of("items",notifications.findTop100ByUserIdOrderByIdDesc(u.id).stream().map(this::view).toList(),
            "unreadCount",notifications.countByUserIdAndReadAtIsNull(u.id));}
    @PatchMapping("/{id}/read")Map<String,Object> read(@PathVariable Long id,HttpSession s){User u=auth.required(s);
        Notification n=notifications.findByIdAndUserId(id,u.id).orElseThrow(()->new ResponseStatusException(NOT_FOUND,"알림을 찾을 수 없습니다."));
        if(n.readAt==null)n.readAt=LocalDateTime.now();notifications.save(n);return Map.of("success",true);}
    @PatchMapping("/read-all")Map<String,Object> all(HttpSession s){User u=auth.required(s);LocalDateTime now=LocalDateTime.now();
        List<Notification> items=notifications.findByUserIdAndReadAtIsNull(u.id);items.forEach(n->n.readAt=now);notifications.saveAll(items);return Map.of("success",true);}
    private Map<String,Object> view(Notification n){Map<String,Object>m=new LinkedHashMap<>();m.put("id",n.id);m.put("type",n.type);
        m.put("title",n.title);m.put("message",n.message);m.put("relatedType",n.relatedType);m.put("relatedId",n.relatedId);
        m.put("readAt",n.readAt);m.put("createdAt",n.createdAt);return m;}
}
