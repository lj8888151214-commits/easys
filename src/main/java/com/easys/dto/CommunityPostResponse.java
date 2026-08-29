package com.easys.dto;

import com.easys.entity.CommunityPost;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
public class CommunityPostResponse {

    private Long id;

    private String title;

    private String content;

    private String author;

    private Long authorId;

    private String category;

    private List<String> images;

    private int viewCount;

    private long likeCount;

    private long commentCount;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;


    // 게시글 목록용 DTO
    public CommunityPostResponse(CommunityPost post, long likeCount, long commentCount) {

        this.id = post.getId();

        this.title = post.getTitle();

        this.content = post.getContent();

        this.author = post.getMember().getNickname();

        this.authorId = post.getMember().getId();

        this.category = post.getCategory();

        this.images = post.getImages().stream()
                .map(image -> image.getImageUrl())
                .toList();

        this.viewCount = post.getViewCount();

        this.likeCount = likeCount;

        this.commentCount = commentCount;

        this.createdAt = post.getCreatedAt();

        this.updatedAt = post.getUpdatedAt();
    }
}
