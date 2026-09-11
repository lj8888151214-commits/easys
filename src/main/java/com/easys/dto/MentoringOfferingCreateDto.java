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

    // 아래 필드들은 MentorProfile의 동일한 이름의 필드와 같다 - 첫 "멘토
    // 등록하기" 제출 시 MentorProfile을 함께 만들 때 그대로 전달된다.
    // 이미 MentorProfile이 있는 멘토가 새 멘토링만 추가하는 경우에는
    // 무시된다(기존 프로필을 덮어쓰지 않음, MentoringOfferingService 참고).
    private String career;
    private String careerDetail;
    private String certificates;
    private String introduction;
    private String github;
    private String velog;
    private String portfolio;

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
