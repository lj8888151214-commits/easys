package com.easys.service;

import com.easys.dto.CommentCreateRequest;
import com.easys.dto.CommentResponse;
import com.easys.dto.CommentUpdateRequest;
import com.easys.entity.Comment;
import com.easys.entity.CommunityPost;
import com.easys.entity.Member;
import com.easys.entity.MemberRole;
import com.easys.repository.CommentRepository;
import com.easys.repository.CommunityPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {

    private final CommentRepository commentRepository;

    private final CommunityPostRepository communityPostRepository;


    // 댓글 작성
    public Long createComment(
            Long postId,
            CommentCreateRequest request,
            Member member
    ) {

        // 게시글 조회
        CommunityPost post =
                communityPostRepository
                        .findById(postId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "게시글을 찾을 수 없습니다."
                                )
                        );


        // 댓글 생성
        Comment comment =
                new Comment(
                        request.getContent(),
                        member,
                        post
                );


        // 댓글 저장
        commentRepository.save(comment);


        // 생성된 댓글 ID 반환
        return comment.getId();
    }


    // 특정 게시글의 댓글 조회
    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(
            Long postId
    ) {

        // 게시글 존재 여부 확인
        if (!communityPostRepository.existsById(postId)) {

            throw new IllegalArgumentException(
                    "게시글을 찾을 수 없습니다."
            );
        }


        return commentRepository
                .findAllByCommunityPost_IdOrderByCreatedAtAsc(postId)
                .stream()
                .map(CommentResponse::new)
                .toList();
    }


    // 댓글 수정
    public void updateComment(
            Long commentId,
            CommentUpdateRequest request,
            Member member
    ) {

        // 댓글 조회
        Comment comment =
                commentRepository
                        .findById(commentId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "댓글을 찾을 수 없습니다."
                                )
                        );


        // 댓글 작성자 확인
        if (!comment.getMember().getId().equals(member.getId())) {

            throw new IllegalArgumentException(
                    "댓글 작성자만 수정할 수 있습니다."
            );
        }


        // 댓글 수정
        comment.update(
                request.getContent()
        );
    }


    // 댓글 삭제
    public void deleteComment(
            Long commentId,
            Member member
    ) {

        // 댓글 조회
        Comment comment =
                commentRepository
                        .findById(commentId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "댓글을 찾을 수 없습니다."
                                )
                        );


        // 댓글 작성자 본인이거나 관리자만 삭제 가능
        boolean isOwner =
                comment.getMember().getId().equals(member.getId());

        if (!isOwner && member.getRole() != MemberRole.ADMIN) {

            throw new IllegalArgumentException(
                    "댓글 작성자만 삭제할 수 있습니다."
            );
        }


        // 댓글 삭제
        commentRepository.delete(comment);
    }
}