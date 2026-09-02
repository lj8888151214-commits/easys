package com.easys.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MentoringReviewUpdateDto {

    private Integer rating;
    private String content;
}
