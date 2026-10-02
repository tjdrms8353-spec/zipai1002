package com.zipai.domain;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "visit_requests")
public class VisitRequest extends AuditedEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "requester_id")
    public User requester;
    @Column(name = "room_id", nullable = false) public String roomId;
    @Column(name = "room_title", nullable = false) public String roomTitle;
    @Column(name = "visit_date", nullable = false) public LocalDate visitDate;
    @Column(name = "visit_time", nullable = false) public LocalTime visitTime;
    @Column(nullable = false) public String phone;
    @Column(nullable = false, length = 1000) public String question = "";
    @Column(nullable = false, length = 30) public String status = "pending";
    @Column(name = "decision_reason", nullable = false, length = 500) public String decisionReason = "";
    @Column(name = "admin_note", nullable = false, length = 1000) public String adminNote = "";
    @Column(name = "user_message", nullable = false, length = 1000) public String userMessage = "";
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "decided_by") public User decidedBy;
    @Column(name = "decided_at") public LocalDateTime decidedAt;
    @Column(name = "completed_at") public LocalDateTime completedAt;
    @Column(name = "day_reminder_sent_at") public LocalDateTime dayReminderSentAt;
    @Column(name = "hour_reminder_sent_at") public LocalDateTime hourReminderSentAt;
}
