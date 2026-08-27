package com.easys.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 댓글 내용
    @Column(nullable = false, length = 500)
    private String content;

    // 댓글 작성자
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 댓글이 달린 게시글
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "community_post_id", nullable = false)
    private CommunityPost communityPost;

    // 작성일
    @Column(nullable = false)
    private LocalDateTime createdAt;

    // 수정일
    @Column(nullable = false)
    private LocalDateTime updatedAt;


    // 댓글 생성
    public Comment(
            String content,
            Member member,
            CommunityPost communityPost
    ) {

        validateContent(content);

        this.content = content;
        this.member = member;
        this.communityPost = communityPost;

        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }


    // 댓글 수정
    public void update(String content) {

        validateContent(content);

        this.content = content;
        this.updatedAt = LocalDateTime.now();
    }


    // 댓글 내용 검증
    private void validateContent(String content) {

        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException(
                    "댓글 내용을 입력해주세요."
            );
        }

        if (content.length() > 500) {
            throw new IllegalArgumentException(
                    "댓글은 500자 이하로 입력해주세요."
            );
        }
    }
}