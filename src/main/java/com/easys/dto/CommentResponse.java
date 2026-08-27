package com.easys.dto;

import com.easys.entity.Comment;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class CommentResponse {

    private Long id;

    private String content;

    private String author;

    private Long authorId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;


    // Entity를 Response DTO로 변환
    public CommentResponse(Comment comment) {

        this.id = comment.getId();

        this.content = comment.getContent();

        this.author = comment.getMember().getNickname();

        this.authorId = comment.getMember().getId();

        this.createdAt = comment.getCreatedAt();

        this.updatedAt = comment.getUpdatedAt();
    }
}