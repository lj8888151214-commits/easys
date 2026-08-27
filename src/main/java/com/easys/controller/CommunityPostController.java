package com.easys.controller;

import com.easys.dto.CommunityPostCreateRequest;
import com.easys.dto.CommunityPostResponse;
import com.easys.entity.Member;
import com.easys.repository.MemberRepository;
import com.easys.service.CommunityPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.easys.dto.CommunityPostDetailResponse;
import com.easys.dto.CommunityPostUpdateRequest;

import java.util.List;

@RestController
@RequestMapping("/community/posts")
@RequiredArgsConstructor
public class CommunityPostController {

    private final CommunityPostService communityPostService;

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

        String email = authentication.getName();

        return memberRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "회원 정보를 찾을 수 없습니다."
                        )
                );
    }


    // 게시글 작성
    // POST /community/posts
    @PostMapping
    public ResponseEntity<Long> createPost(
            @ModelAttribute CommunityPostCreateRequest request,
            Authentication authentication
    ) {

        Member member =
                getCurrentMember(authentication);

        Long postId =
                communityPostService.createPost(
                        request,
                        member
                );

        return ResponseEntity.ok(postId);
    }


    // 게시글 목록 조회
    // GET /community/posts
    @GetMapping
    public ResponseEntity<List<CommunityPostResponse>> getPosts() {

        List<CommunityPostResponse> posts =
                communityPostService.getPosts();

        return ResponseEntity.ok(posts);
    }
    // 게시글 상세 조회
// GET /community/posts/{id}
    @GetMapping("/{id}")
    public ResponseEntity<CommunityPostDetailResponse> getPost(
            @PathVariable Long id
    ) {

        CommunityPostDetailResponse response =
                communityPostService.getPost(id);

        return ResponseEntity.ok(response);
    }

    // 게시글 수정
// PUT /community/posts/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Void> updatePost(
            @PathVariable Long id,
            @RequestBody CommunityPostUpdateRequest request,
            Authentication authentication
    ) {

        // 현재 로그인한 회원
        Member member =
                getCurrentMember(authentication);


        // 게시글 수정
        communityPostService.updatePost(
                id,
                request,
                member
        );


        return ResponseEntity.ok().build();
    }

    // 게시글 삭제
    // DELETE /community/posts/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long id,
            Authentication authentication
    ) {

        // 현재 로그인한 회원
        Member member =
                getCurrentMember(authentication);


        // 게시글 삭제
        communityPostService.deletePost(
                id,
                member
        );


        return ResponseEntity.ok().build();
    }
}