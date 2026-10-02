package com.zipai.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User extends AuditedEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(nullable = false, unique = true, length = 20)
    public String username;
    @Column(nullable = false, unique = true, length = 254)
    public String email;
    @Column(nullable = false, length = 11)
    public String phone;
    @Column(name = "password_hash", nullable = false, length = 100)
    public String passwordHash;
    @Column(nullable = false, length = 20)
    public String role = "member";
    @Column(nullable = false, length = 20)
    public String status = "active";
    @Column(name = "failed_login_attempts", nullable = false)
    public int failedLoginAttempts;
    @Column(name = "locked_until")
    public LocalDateTime lockedUntil;
    @Column(name = "email_verified_at")
    public LocalDateTime emailVerifiedAt;
    @Column(name = "phone_verified_at")
    public LocalDateTime phoneVerifiedAt;
    @Column(name = "deleted_at")
    public LocalDateTime deletedAt;
}
