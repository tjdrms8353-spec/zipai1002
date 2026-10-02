package com.zipai.repository;

import com.zipai.domain.Notification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findTop100ByUserIdOrderByIdDesc(Long userId);
    long countByUserIdAndReadAtIsNull(Long userId);
    Optional<Notification> findByIdAndUserId(Long id, Long userId);
    List<Notification> findByUserIdAndReadAtIsNull(Long userId);
}
