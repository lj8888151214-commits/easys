package com.easys.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class StudyCreateDto {
    private String title;
    private String content;
    private String category;
    private int maxMembers;
}
