package com.zipai.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "admin_audit_logs")
public class AdminAuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "admin_id") public User admin;
    @Column(nullable = false, length = 80) public String action;
    @Column(name = "target_type", nullable = false, length = 50) public String targetType;
    @Column(name = "target_id", nullable = false, length = 100) public String targetId;
    @Column(nullable = false, length = 1000) public String detail = "";
    @Column(name = "created_at", nullable = false) public LocalDateTime createdAt = LocalDateTime.now();
}
