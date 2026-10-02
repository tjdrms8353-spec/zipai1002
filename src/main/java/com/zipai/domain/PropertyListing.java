package com.zipai.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "properties")
public class PropertyListing extends AuditedEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id")
    public User owner;
    @Column(name = "payload_json", nullable = false, columnDefinition = "json")
    public String payloadJson;
    @Column(nullable = false, length = 20)
    public String status = "pending";
}
