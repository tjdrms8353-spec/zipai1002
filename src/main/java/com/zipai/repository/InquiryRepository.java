package com.zipai.repository;

import com.zipai.domain.Inquiry;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface InquiryRepository extends JpaRepository<Inquiry, Long> {
    List<Inquiry> findByUserIdOrderByIdDesc(Long userId);
    Optional<Inquiry> findByIdAndUserId(Long id, Long userId);
    List<Inquiry> findAllByOrderByIdDesc();
    long countByStatusNot(String status);
    long countByCreatedAtGreaterThanEqual(java.time.LocalDateTime since);
    Page<Inquiry> findByStatusAndTitleContainingIgnoreCase(String status, String query, Pageable pageable);
    Page<Inquiry> findByTitleContainingIgnoreCase(String query, Pageable pageable);
}
