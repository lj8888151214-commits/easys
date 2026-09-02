package com.easys.entity;

public enum ReservationStatus {
    // PENDING => 예약 생성 후 결제가 완료되기 전
    // PAID => 결제까지 완료됐지만 관리자 승인 전(승인 대기)
    // CONFIRMED => 관리자 승인까지 완료되어 예약이 확정된 상태
    // CANCELLED => 사용자가 예약을 취소한 상태
    PENDING, PAID, CONFIRMED, CANCELLED
}
