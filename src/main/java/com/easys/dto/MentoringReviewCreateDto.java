package com.easys.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MentoringReviewCreateDto {

    private Long reservationId;
    private Integer rating;
    private String content;
}
