package com.zipai.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "verification_codes")
public class VerificationCode {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @Column(nullable = false, length = 20) public String purpose;
    @Column(nullable = false, length = 20) public String channel;
    @Column(nullable = false, length = 254) public String destination;
    @Column(name = "code_hash", nullable = false, length = 64) public String codeHash;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id") public User user;
    @Column(name = "expires_at", nullable = false) public LocalDateTime expiresAt;
    @Column(name = "verified_at") public LocalDateTime verifiedAt;
    @Column(name = "consumed_at") public LocalDateTime consumedAt;
    @Column(nullable = false) public int attempts;
    @Column(name = "created_at", nullable = false) public LocalDateTime createdAt = LocalDateTime.now();
}
