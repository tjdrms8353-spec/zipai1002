package com.zipai.service;

import com.zipai.domain.Notification;
import com.zipai.domain.User;
import com.zipai.repository.NotificationRepository;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    private final NotificationRepository notifications;
    public NotificationService(NotificationRepository notifications) { this.notifications = notifications; }
    public void create(User user, String type, String title, String message, String relatedType, Object relatedId) {
        Notification n = new Notification();
        n.user = user; n.type = type; n.title = title; n.message = message;
        n.relatedType = relatedType; n.relatedId = String.valueOf(relatedId);
        notifications.save(n);
    }
}
