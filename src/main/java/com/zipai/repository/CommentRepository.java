package com.zipai.repository;

import com.zipai.domain.CommunityComment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<CommunityComment, Long> {
    List<CommunityComment> findByPostIdOrderByCreatedAtAsc(Long postId);
    long countByPostId(Long postId);
}
