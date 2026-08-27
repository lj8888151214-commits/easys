package com.easys.repository;

import com.easys.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository
        extends JpaRepository<Comment, Long> {

    // 특정 게시글의 댓글 목록
    List<Comment> findAllByCommunityPost_IdOrderByCreatedAtAsc(
            Long postId
    );

    // 특정 게시글의 댓글 개수
    long countByCommunityPost_Id(
            Long postId
    );
}