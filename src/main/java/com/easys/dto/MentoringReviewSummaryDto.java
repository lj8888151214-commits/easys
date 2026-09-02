package com.easys.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class MentoringReviewSummaryDto {

    private final double averageRating;
    private final long reviewCount;
    private final List<MentoringReviewResponseDto> reviews;

    public MentoringReviewSummaryDto(
            double averageRating,
            long reviewCount,
            List<MentoringReviewResponseDto> reviews
    ) {
        this.averageRating = averageRating;
        this.reviewCount = reviewCount;
        this.reviews = reviews;
    }
}
