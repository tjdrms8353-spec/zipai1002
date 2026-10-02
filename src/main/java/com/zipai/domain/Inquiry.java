package com.zipai.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inquiries")
public class Inquiry extends AuditedEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id") public User user;
    @Column(nullable = false, length = 30) public String category;
    @Column(nullable = false, length = 60) public String title;
    @Column(nullable = false, length = 1000) public String content;
    @Column(name = "contact_email", nullable = false, length = 254) public String contactEmail;
    @Column(nullable = false, length = 20) public String status = "received";
    @Column(nullable = false, columnDefinition = "text") public String answer = "";
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "answered_by") public User answeredBy;
    @Column(name = "answered_at") public LocalDateTime answeredAt;
}
