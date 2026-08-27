package com.easys.service;

import com.easys.dto.PostLikeResponse;
import com.easys.entity.CommunityPost;
import com.easys.entity.Member;
import com.easys.entity.PostLike;
import com.easys.repository.CommunityPostRepository;
import com.easys.repository.PostLikeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class PostLikeService {

    private final PostLikeRepository postLikeRepository;

    private final CommunityPostRepository communityPostRepository;


    // 좋아요 토글
    public PostLikeResponse toggleLike(Long postId, Member member) {

        // 게시글 조회
        CommunityPost post =
                communityPostRepository
                        .findById(postId)
                        .orElseThrow(() ->
                                new IllegalArgumentException("게시글을 찾을 수 없습니다."));


        // 이미 좋아요를 눌렀는지 확인
        var existingLike = postLikeRepository.findByMemberIdAndCommunityPostId(
                                member.getId(),
                                postId);


        boolean liked;


        if (existingLike.isPresent()) {
            // 이미 좋아요가 있다면 취소
            postLikeRepository.delete(existingLike.get());
            liked = false;
        } else {
            // 좋아요가 없다면 생성
            PostLike postLike = new PostLike(member, post);
            postLikeRepository.save(postLike);
            liked = true;
        }


        // 현재 좋아요 개수
        long likeCount = postLikeRepository.countByCommunityPostId(postId);


        return new PostLikeResponse(
                liked,
                likeCount
        );
    }


    // 현재 회원의 좋아요 여부 + 좋아요 개수
    @Transactional(readOnly = true)
    public PostLikeResponse getLikeStatus(
            Long postId,
            Member member
    ) {

        // 게시글 존재 여부 확인
        if (!communityPostRepository.existsById(postId)) {
            throw new IllegalArgumentException("게시글을 찾을 수 없습니다.");
        }


        boolean liked = postLikeRepository.findByMemberIdAndCommunityPostId(
                                member.getId(),
                                postId
                        )
                        .isPresent();


        long likeCount = postLikeRepository.countByCommunityPostId(postId);


        return new PostLikeResponse(
                liked,
                likeCount
        );
    }
}