package com.easys.repository;

import com.easys.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostLikeRepository
        extends JpaRepository<PostLike, Long> {

    // 특정 회원이 특정 게시글에 좋아요를 눌렀는지 확인
    Optional<PostLike> findByMemberIdAndCommunityPostId(
            Long memberId,
            Long postId
    );

    // 특정 게시글의 좋아요 개수
    long countByCommunityPostId(Long postId);
}