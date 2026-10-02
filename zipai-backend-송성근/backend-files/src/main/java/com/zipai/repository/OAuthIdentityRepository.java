package com.zipai.repository;

import com.zipai.domain.OAuthIdentity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OAuthIdentityRepository extends JpaRepository<OAuthIdentity, Long> {
    Optional<OAuthIdentity> findByProviderAndProviderSubject(String provider, String providerSubject);
}
