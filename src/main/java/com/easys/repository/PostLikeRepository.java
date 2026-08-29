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

    // 게시글 삭제 시 좋아요를 함께 정리하기 위한 일괄 삭제
    void deleteByCommunityPostId(Long postId);
}