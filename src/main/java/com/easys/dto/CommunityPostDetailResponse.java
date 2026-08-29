package com.easys.dto;

import com.easys.entity.CommunityImage;
import com.easys.entity.CommunityPost;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
public class CommunityPostDetailResponse {

    private Long id;

    private String title;

    private String content;

    private String author;

    private Long authorId;

    private String category;

    private int viewCount;

    private long likeCount;

    private long commentCount;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private List<String> images;


    // Entity를 상세 Response DTO로 변환
    public CommunityPostDetailResponse(
            CommunityPost post,
            long likeCount,
            long commentCount
    ) {

        this.id = post.getId();

        this.title = post.getTitle();

        this.content = post.getContent();

        this.author =
                post.getMember().getNickname();

        this.authorId = post.getMember().getId();

        this.category = post.getCategory();

        this.commentCount = commentCount;

        this.viewCount =
                post.getViewCount();

        this.likeCount =
                likeCount;

        this.createdAt =
                post.getCreatedAt();

        this.updatedAt =
                post.getUpdatedAt();

        // 이미지 URL만 가져오기
        this.images =
                post.getImages()
                        .stream()
                        .map(CommunityImage::getImageUrl)
                        .toList();
    }
}
