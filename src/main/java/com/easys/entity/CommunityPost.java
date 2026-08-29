package com.easys.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Entity
@NoArgsConstructor
public class CommunityPost {

    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;

    // 게시글 제목
    @Column(nullable = false , length = 100)
    private String title;

    // 게시글 내용
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false, length = 30)
    private String category = "정보공유";

    // 조회수
    @Column(nullable = false)
    private int viewCount = 0 ;

    // 작성자
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private Member member;

    // 작성일
    @Column(nullable = false)
    private LocalDateTime createdAt;

    // 수정일
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // 이미지
    @OneToMany (mappedBy = "communityPost",
            cascade = CascadeType.ALL,
            orphanRemoval = true)
    private List<CommunityImage> images = new ArrayList<>();

    // 게시글 작성
    public CommunityPost(String title, String content, String category, Member member){
        this.title = title;
        this.content = content;
        this.category = category == null || category.isBlank() ? "정보공유" : category;
        this.member = member;

        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // 수정
    public void update(String title, String content){
        validateTitle(title);
        validateContent(content);

        this.title = title;
        this.content = content;
        this.updatedAt = LocalDateTime.now();
    }

    // 조회수 증가
    public void increaseViewCount(){
        this.viewCount++;
    }

    // 이미지 추가
    public void addImage(CommunityImage image) {
        this.images.add(image);
        image.setCommunityPost(this);
    }


    // 제목 검증
    private void validateTitle(String title) {

        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException(
                    "게시글 제목을 입력해주세요."
            );
        }

        if (title.length() > 100) {
            throw new IllegalArgumentException(
                    "게시글 제목은 100자 이하로 입력해주세요."
            );
        }
    }


    // 내용 검증
    private void validateContent(String content) {

        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException(
                    "게시글 내용을 입력해주세요."
            );
        }
    }
}

