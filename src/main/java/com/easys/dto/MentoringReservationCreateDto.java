package com.easys.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MentoringReservationCreateDto {

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
