package com.easys.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MentoringOfferingCreateDto {

    // 멘토링 이름 (예: "Java 멘토링")
    private String title;

    // 관련 기술
    private String skills;

    // 상담 가능 분야
    private String consultationFields;

    // 멘토링 방식
    private String mentoringType;

    // 1회 상담 가격
    private Integer price;

    // 기존 상담 가능 요일
    private String availableDays;

    // 실제 상담 가능 날짜
    private String availableDates;

    private String availableStart;
    private String availableEnd;

    // 날짜별 상세 일정 (JSON)
    private String availableSchedules;
}
