package com.easys.repository;

import com.easys.entity.CommunityPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {

    List<CommunityPost> findByCategoryOrderByCreatedAtDesc(String category);

    // 전체 정렬 조회
    List<CommunityPost> findAllByOrderByCreatedAtDesc();
    List<CommunityPost> findAllByOrderByLikeCountDesc();
    List<CommunityPost> findAllByOrderByCommentCountDesc();


    List<CommunityPost> findTop4ByOrderByLikeCountDesc();


}

// 💡 같은 파일 내 최상위 레벨로 선언 (Spring Data JPA가 정상적으로 Bean 등록)
@Repository
interface CommunityCommentRepository extends JpaRepository<CommunityPost.Comment, Long> {
    List<CommunityPost.Comment> findByPostIdOrderByCreatedAtAsc(Long postId);
}