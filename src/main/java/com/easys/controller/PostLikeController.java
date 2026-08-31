package com.easys.controller;

import com.easys.dto.PostLikeResponse;
import com.easys.entity.Member;
import com.easys.repository.MemberRepository;
import com.easys.service.PostLikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/community/posts/{postId}/like")
@RequiredArgsConstructor
public class PostLikeController {

    private final PostLikeService postLikeService;

    private final MemberRepository memberRepository;


    // 현재 로그인한 회원 조회
    private Member getCurrentMember(
            Authentication authentication
    ) {

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new IllegalArgumentException(
                    "로그인이 필요합니다."
            );
        }


        String email =
                authentication.getName();


        return memberRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "회원 정보를 찾을 수 없습니다."
                        )
                );
    }


    // 좋아요 토글
    // POST /community/posts/{postId}/like
    @PostMapping
    public ResponseEntity<PostLikeResponse> toggleLike(
            @PathVariable Long postId,
            Authentication authentication
    ) {

        Member member =
                getCurrentMember(authentication);


        PostLikeResponse response =
                postLikeService.toggleLike(
                        postId,
                        member
                );


        return ResponseEntity.ok(response);
    }


    // 현재 좋아요 상태 조회
    // GET /community/posts/{postId}/like
    @GetMapping
    public ResponseEntity<PostLikeResponse> getLikeStatus(
            @PathVariable Long postId,
            Authentication authentication
    ) {

        Member member =
                getCurrentMember(authentication);


        PostLikeResponse response =
                postLikeService.getLikeStatus(
                        postId,
                        member
                );


        return ResponseEntity.ok(response);
    }
}