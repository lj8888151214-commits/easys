package com.easys.repository;

import com.easys.entity.CommunityPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommunityPostRepository
        extends JpaRepository<CommunityPost, Long> {

    // 최신 게시글 순으로 조회
    List<CommunityPost> findAllByOrderByCreatedAtDesc();


    // 제목 검색
    List<CommunityPost> findByTitleContainingIgnoreCase(
            String keyword
    );


    // 제목 또는 내용 검색
    List<CommunityPost> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(
            String titleKeyword,
            String contentKeyword
    );
}