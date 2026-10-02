package com.zipai.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "community_posts")
public class CommunityPost extends AuditedEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "author_id") public User author;
    @Column(nullable = false, length = 20) public String category;
    @Column(nullable = false, length = 60) public String title;
    @Column(nullable = false, columnDefinition = "text") public String content;
    @Column(nullable = false, length = 30) public String area = "";
    @Column(nullable = false) public int rating;
    @Column(nullable = false) public long views;
    @Column(name = "deleted_at") public LocalDateTime deletedAt;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "deleted_by") public User deletedBy;
    @Column(name = "delete_reason", nullable = false, length = 500) public String deleteReason = "";
}
