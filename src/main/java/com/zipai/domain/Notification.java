package com.zipai.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id") public User user;
    @Column(nullable = false, length = 50) public String type;
    @Column(nullable = false, length = 100) public String title;
    @Column(nullable = false, length = 1000) public String message;
    @Column(name = "related_type", nullable = false, length = 50) public String relatedType = "";
    @Column(name = "related_id", nullable = false, length = 100) public String relatedId = "";
    @Column(name = "read_at") public LocalDateTime readAt;
    @Column(name = "created_at", nullable = false) public LocalDateTime createdAt;
    @PrePersist void timestamp() { if (createdAt == null) createdAt = LocalDateTime.now(); }
}
