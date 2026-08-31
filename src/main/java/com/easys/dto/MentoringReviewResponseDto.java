package com.easys.dto;

import com.easys.entity.MentoringReview;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class MentoringReviewResponseDto {

    private final Long id;
    private final Long reservationId;
    private final Long authorId;
    private final String authorNickname;
    private final Integer rating;
    private final String content;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public MentoringReviewResponseDto(MentoringReview review) {
        this.id = review.getId();
        this.reservationId = review.getReservation().getId();
        this.authorId = review.getMember().getId();
        this.authorNickname = review.getMember().getNickname();
        this.rating = review.getRating();
        this.content = review.getContent();
        this.createdAt = review.getCreatedAt();
        this.updatedAt = review.getUpdatedAt();
    }
}
