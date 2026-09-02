package com.easys.dto;

import com.easys.entity.StudyRoomReview;

import java.time.LocalDateTime;

public record StudyRoomReviewResponseDto(

        Long id,

        Long studyRoomId,

        Long memberId,

        String nickname,

        int rating,

        String content,

        LocalDateTime createdAt,

        LocalDateTime updatedAt
) {

    public static StudyRoomReviewResponseDto from(StudyRoomReview review) {

        return new StudyRoomReviewResponseDto(
                review.getId(),
                review.getStudyRoom().getId(),
                review.getMember().getId(),
                review.getMember().getNickname(),
                review.getRating(),
                review.getContent(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }
}
