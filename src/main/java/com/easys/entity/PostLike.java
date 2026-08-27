package com.easys.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
@Table(
        name = "post_like",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_post_like_member_post",
                        columnNames = {
                                "member_id",
                                "community_post_id"
                        }
                )
        }
)
public class PostLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    // 좋아요를 누른 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "member_id",
            nullable = false
    )
    private Member member;


    // 좋아요가 눌린 게시글
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "community_post_id",
            nullable = false
    )
    private CommunityPost communityPost;


    // 좋아요 생성
    public PostLike(
            Member member,
            CommunityPost communityPost
    ) {

        this.member = member;

        this.communityPost = communityPost;
    }
}