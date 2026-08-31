package com.easys.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MentoringReservationCreateDto {

    // 신청 대상 멘토링(등록 상품) id
    // 없으면 기존 방식대로 멘토 프로필 자체의 정보를 기준으로 처리한다.
    private Long offeringId;

    // 상담 분야
    private String consultationTypes;

    // 관련 기술
    private String skills;

    // 예약 날짜
    private String reservationDate;

    // 예약 시간
    private String reservationTime;

    // 현재 문제
    private String problem;

    // 첨부파일 이름
    private String fileName;

    // 첨부파일 저장 경로
    private String filePath;
}
