package com.easys.dto;

import com.easys.entity.CommunityPost;
import lombok.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

public class CommunityPostDto {

    @Getter
    @Setter
    @NoArgsConstructor
    public static class Request {
        private String author;
        private String authorAvatar;
        private String category;
        private String title;
        private String content;
        private String tags;
        private String studySchedule;
        private String studyMembers;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private String author;
        private String authorAvatar;
        private String category;
        private String title;
        private String content;
        private String tags;
        private String studySchedule;
        private String studyMembers;
        private int likeCount;
        private int commentCount;
        private int viewCount;
        private String timeAgo;
        private LocalDateTime createdAt;

        public static Response fromEntity(CommunityPost post) {
            int count = (post.getComments() != null) ? post.getComments().size() : post.getCommentCount();
            return Response.builder()
                    .id(post.getId())
                    .author(post.getAuthor())
                    .authorAvatar(post.getAuthorAvatar() != null ? post.getAuthorAvatar() : (post.getAuthor() != null && !post.getAuthor().isEmpty() ? post.getAuthor().substring(0, 1) : "익"))
                    .category(post.getCategory())
                    .title(post.getTitle())
                    .content(post.getContent())
                    .tags(post.getTags())
                    .studySchedule(post.getStudySchedule())
                    .studyMembers(post.getStudyMembers())
                    .likeCount(post.getLikeCount())
                    .commentCount(count)
                    .viewCount(post.getViewCount())
                    .createdAt(post.getCreatedAt())
                    .timeAgo(formatTimeAgo(post.getCreatedAt()))
                    .build();
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommentRequest {
        private String author;
        private String content;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CommentResponse {
        private Long id;
        private String author;
        private String content;
        private String timeAgo;
        private LocalDateTime createdAt;

        public static CommentResponse fromEntity(CommunityPost.Comment comment) {
            return CommentResponse.builder()
                    .id(comment.getId())
                    .author(comment.getAuthor())
                    .content(comment.getContent())
                    .createdAt(comment.getCreatedAt())
                    .timeAgo(formatTimeAgo(comment.getCreatedAt()))
                    .build();
        }
    }

    private static String formatTimeAgo(LocalDateTime dateTime) {
        if (dateTime == null) return "방금 전";
        long minutes = ChronoUnit.MINUTES.between(dateTime, LocalDateTime.now());
        if (minutes < 1) return "방금 전";
        if (minutes < 60) return minutes + "분 전";
        long hours = ChronoUnit.HOURS.between(dateTime, LocalDateTime.now());
        if (hours < 24) return hours + "시간 전";
        long days = ChronoUnit.DAYS.between(dateTime, LocalDateTime.now());
        return days + "일 전";
    }
}