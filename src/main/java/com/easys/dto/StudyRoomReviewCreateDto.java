package com.easys.dto;

public record StudyRoomReviewCreateDto(

        // 평점 (1~5)
        int rating,

        // 리뷰 내용
        String content
) {
}
