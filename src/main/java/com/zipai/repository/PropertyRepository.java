package com.zipai.repository;

import com.zipai.domain.PropertyListing;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PropertyRepository extends JpaRepository<PropertyListing, Long> {
    List<PropertyListing> findByOwnerIdOrderByIdDesc(Long ownerId);
    List<PropertyListing> findByStatusOrderByIdDesc(String status);
    List<PropertyListing> findAllByOrderByIdDesc();
    long countByStatus(String status);
    Page<PropertyListing> findByStatus(String status, Pageable pageable);
}
