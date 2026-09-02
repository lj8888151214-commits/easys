package com.easys.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@NoArgsConstructor
public class StudyCreateDto {
    private String title;
    private String content;
    private String category;
    private String topic;
    private LocalDate studyDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private int maxMembers;
}
