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

    // 게시글 삭제 시 댓글을 함께 정리하기 위한 일괄 삭제
    void deleteByCommunityPost_Id(
            Long postId
    );
}