package com.zipai.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "oauth_identities", uniqueConstraints = {
    @UniqueConstraint(name = "uk_oauth_provider_subject", columnNames = {"provider", "provider_subject"})
})
public class OAuthIdentity extends AuditedEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    public User user;

    @Column(nullable = false, length = 20)
    public String provider;

    @Column(name = "provider_subject", nullable = false, length = 191)
    public String providerSubject;

    @Column(name = "provider_email", nullable = false, length = 254)
    public String providerEmail = "";
}
