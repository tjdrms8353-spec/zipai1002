package com.zipai.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "defense_reports")
public class DefenseReport extends AuditedEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    public User user;
    @Column(name = "report_type", nullable = false, length = 30)
    public String reportType;
    @Column(nullable = false, length = 255)
    public String title;
    @Lob @Column(name = "snapshot_json", nullable = false, columnDefinition = "LONGTEXT")
    public String snapshotJson;
    @Column(name = "original_file_name", length = 255)
    public String originalFileName;
    @Column(name = "original_content_type", length = 100)
    public String originalContentType;
    @Lob @Basic(fetch = FetchType.LAZY)
    @Column(name = "original_file", columnDefinition = "LONGBLOB")
    public byte[] originalFile;
    @Column(name = "share_token", unique = true, length = 64)
    public String shareToken;
}
