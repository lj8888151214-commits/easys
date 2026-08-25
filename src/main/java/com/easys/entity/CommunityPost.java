package com.easys.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "community_posts")
public class CommunityPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String author; // 작성자 닉네임

    private String authorAvatar; // 아바타 이니셜

    @Column(nullable = false)
    private String category; // QUESTION, STUDY, RECRUIT, INFO, CAREER

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private String tags;

    // 스터디 모집용 추가 정보 (선택)
    private String studySchedule;
    private String studyMembers;

    @Builder.Default
    @Column(name = "like_count")
    private int likeCount = 0;

    @Builder.Default
    @Column(name = "comment_count")
    private int commentCount = 0; // 👈 DB에 comment_count 컬럼 자동 생성

    @Builder.Default
    @Column(name = "view_count")
    private int viewCount = 0;

    @CreationTimestamp
    private LocalDateTime createdAt;

    // 💡 댓글 테이블과 1:N 매핑 (게시글 저장 시 댓글 자동 등록/삭제)
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    // 연관관계 편의 메서드
    public void addComment(Comment comment) {
        if (this.comments == null) {
            this.comments = new ArrayList<>();
        }
        this.comments.add(comment);
        comment.setPost(this);
        this.commentCount = this.comments.size();
    }

    // =========================================================
    // 💡 JPA 엔티티 등록: community_comments 테이블 자동 생성
    // =========================================================
    @Entity
    @Table(name = "community_comments")
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Comment {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "post_id", nullable = false)
        @JsonIgnore
        private CommunityPost post;

        @Column(nullable = false)
        private String author;

        @Column(columnDefinition = "TEXT", nullable = false)
        private String content;

        @CreationTimestamp
        private LocalDateTime createdAt;
    }
}