package com.easys.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MentorProfileCreateDto {

    private String title;
    private String introduction;
    private String career;
    private String careerDetail;
    private String certificates;
    private String skills;
    private Integer price;
    private String mentoringType;
    private String consultationFields;
    private String github;
    private String velog;
    private String portfolio;

    // 기존 상담 가능 요일
    private String availableDays;

    // 실제 상담 가능 날짜
    // 예: 2026-09-03,2026-09-10,2026-09-17
    private String availableDates;

    private String availableStart;
    private String availableEnd;

    // 날짜별 상세 일정 (JSON)
    private String availableSchedules;
}
