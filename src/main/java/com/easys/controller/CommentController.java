package com.easys.controller;

import com.easys.dto.CommentCreateRequest;
import com.easys.dto.CommentResponse;
import com.easys.dto.CommentUpdateRequest;
import com.easys.entity.Member;
import com.easys.repository.MemberRepository;
import com.easys.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/community/posts/{postId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

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


    // 댓글 작성
    // POST /community/posts/{postId}/comments
    @PostMapping
    public ResponseEntity<Long> createComment(
            @PathVariable Long postId,
            @RequestBody CommentCreateRequest request,
            Authentication authentication
    ) {

        Member member =
                getCurrentMember(authentication);


        Long commentId =
                commentService.createComment(
                        postId,
                        request,
                        member
                );


        return ResponseEntity.ok(commentId);
    }


    // 댓글 목록 조회
    // GET /community/posts/{postId}/comments
    @GetMapping
    public ResponseEntity<List<CommentResponse>> getComments(
            @PathVariable Long postId
    ) {

        List<CommentResponse> comments =
                commentService.getComments(postId);


        return ResponseEntity.ok(comments);
    }


    // 댓글 수정
    // PUT /community/posts/{postId}/comments/{commentId}
    @PutMapping("/{commentId}")
    public ResponseEntity<Void> updateComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @RequestBody CommentUpdateRequest request,
            Authentication authentication
    ) {

        Member member =
                getCurrentMember(authentication);


        commentService.updateComment(
                commentId,
                request,
                member
        );


        return ResponseEntity.ok().build();
    }


    // 댓글 삭제
    // DELETE /community/posts/{postId}/comments/{commentId}
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            Authentication authentication
    ) {

        Member member =
                getCurrentMember(authentication);


        commentService.deleteComment(
                commentId,
                member
        );


        return ResponseEntity.ok().build();
    }
}