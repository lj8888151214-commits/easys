package com.easys.repository;

import com.easys.entity.CommunityPost;
import com.easys.entity.PostLike;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
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

    // 19단계: AI 챗봇의 "커뮤니티 인기글" 질문에 실제 데이터로 답하기 위한 집계
    // 조회. 좋아요가 하나도 없는 게시글은(그룹 결과 자체가 없으므로) 나오지
    // 않는다 - 그 경우 호출부(AiChatService)가 "아직 좋아요가 눌린 글이 없다"고
    // 정직하게 답한다. 게시글을 전부 메모리로 가져와 계산하지 않도록 DB에서
    // GROUP BY + ORDER BY로 직접 정렬한다.
    @Query("SELECT pl.communityPost FROM PostLike pl GROUP BY pl.communityPost ORDER BY COUNT(pl) DESC")
    List<CommunityPost> findPostsOrderByLikeCountDesc(Pageable pageable);
}