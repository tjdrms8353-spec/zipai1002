package com.zipai.domain;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.time.LocalDateTime;

@MappedSuperclass
public abstract class AuditedEntity {
    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @PrePersist
    void createTimestamps() {
        createdAt = updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void updateTimestamp() {
        updatedAt = LocalDateTime.now();
    }
}
