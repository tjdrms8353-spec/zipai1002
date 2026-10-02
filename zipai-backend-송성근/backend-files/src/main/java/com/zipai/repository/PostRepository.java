package com.zipai.repository;

import com.zipai.domain.CommunityPost;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PostRepository extends JpaRepository<CommunityPost, Long> {
    List<CommunityPost> findAllByOrderByCreatedAtDesc();
    List<CommunityPost> findByDeletedAtIsNullOrderByCreatedAtDesc();
    java.util.Optional<CommunityPost> findByIdAndDeletedAtIsNull(Long id);
    List<CommunityPost> findAllByOrderByIdDesc();
    Page<CommunityPost> findByDeletedAtIsNullAndTitleContainingIgnoreCase(String query, Pageable pageable);
    Page<CommunityPost> findByDeletedAtIsNotNullAndTitleContainingIgnoreCase(String query, Pageable pageable);
}
