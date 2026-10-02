package com.zipai.repository;

import com.zipai.domain.DefenseReport;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DefenseReportRepository extends JpaRepository<DefenseReport, Long> {
    Page<DefenseReport> findByUserIdOrderByIdDesc(Long userId, Pageable pageable);
    Optional<DefenseReport> findByIdAndUserId(Long id, Long userId);
    Optional<DefenseReport> findByShareToken(String shareToken);
}
