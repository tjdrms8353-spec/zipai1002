package com.zipai.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "community_comments")
public class CommunityComment extends AuditedEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "post_id") public CommunityPost post;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "author_id") public User author;
    @Column(nullable = false, length = 500) public String content;
}
