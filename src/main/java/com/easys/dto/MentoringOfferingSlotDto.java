package com.easys.dto;

import lombok.Getter;

// =====================================================
// MentoringOffering 하나에 등록된 여러 예약 가능 날짜/시간(슬롯) 중
// 하나의 상태를 표현한다.
//
// offering.availableSchedules(JSON)에 들어있는 날짜별 항목을
// 실제 예약 존재 여부와 대조해서 만들어지는 "조회 전용" 값으로,
// 별도의 테이블/엔티티로 저장하지 않는다.
// =====================================================

@Getter
public class MentoringOfferingSlotDto {

    private final String date;
    private final String startTime;
    private final String endTime;

    // 이 슬롯에 거절되지 않은 예약이 없으면 true(신청 가능)
    private final boolean available;

    // 예약된 슬롯일 때만 채워진다. (공개 목록에서는 항상 null)
    private final Long reservationId;
    private final String reservationStatus;
    private final String applicantNickname;

    // 예약에 연결된 결제 상태(READY/PAID/FAILED/CANCELLED). 예약이 없거나
    // 공개 목록 조회일 때는 null. 멘토 승인(APPROVED) 후에도 결제 전이면
    // "결제 대기중" 표시에 사용된다.
    private final String paymentStatus;

    public MentoringOfferingSlotDto(
            String date,
            String startTime,
            String endTime,
            boolean available,
            Long reservationId,
            String reservationStatus,
            String applicantNickname,
            String paymentStatus
    ) {
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.available = available;
        this.reservationId = reservationId;
        this.reservationStatus = reservationStatus;
        this.applicantNickname = applicantNickname;
        this.paymentStatus = paymentStatus;
    }
}
