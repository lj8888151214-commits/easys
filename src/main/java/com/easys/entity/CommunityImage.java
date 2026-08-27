package com.easys.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
public class CommunityImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어떤 게시글의 이미지인지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "community_post_id", nullable = false)
    private CommunityPost communityPost;

    // 서버에 저장된 이미지 경로
    @Column(nullable = false, length = 500)
    private String imageUrl;


    // 사용자가 업로드한 원본 파일명
    @Column(nullable = false, length = 255)
    private String originalFileName;


    // 이미지 등록 시간
    @Column(nullable = false)
    private LocalDateTime createdAt;


    // 이미지 생성
    public CommunityImage(
            String imageUrl,
            String originalFileName
    ) {
        this.imageUrl = imageUrl;
        this.originalFileName = originalFileName;
        this.createdAt = LocalDateTime.now();
    }

    // 게시글 연결
    public void setCommunityPost(CommunityPost communityPost) {
        this.communityPost = communityPost;
    }
}
