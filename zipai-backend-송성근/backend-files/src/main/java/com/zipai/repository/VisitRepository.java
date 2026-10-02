package com.zipai.repository;

import com.zipai.domain.VisitRequest;
import java.util.List;
import java.util.Optional;
import java.time.LocalDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface VisitRepository extends JpaRepository<VisitRequest, Long> {
    List<VisitRequest> findByRequesterIdOrderByIdDesc(Long requesterId);
    Optional<VisitRequest> findByIdAndRequesterId(Long id, Long requesterId);
    Page<VisitRequest> findByStatus(String status, Pageable pageable);
    Page<VisitRequest> findAll(Pageable pageable);
    long countByStatus(String status);
    boolean existsByRequesterIdAndRoomIdAndVisitDateAndVisitTimeAndStatusIn(Long requesterId, String roomId, LocalDate visitDate, java.time.LocalTime visitTime, List<String> statuses);
    boolean existsByRequesterIdAndRoomIdAndVisitDateAndVisitTimeAndStatusInAndIdNot(Long requesterId, String roomId, LocalDate visitDate, java.time.LocalTime visitTime, List<String> statuses, Long id);
    List<VisitRequest> findByStatusAndVisitDateBetween(String status, LocalDate from, LocalDate to);
}
