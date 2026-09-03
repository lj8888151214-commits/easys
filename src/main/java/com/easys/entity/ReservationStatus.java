package com.easys.entity;

public enum ReservationStatus {
    // PENDING => 예약 생성 후 결제가 완료되기 전
    // CONFIRMED => 결제까지 완료되어 예약이 확정된 상태
    // CANCELLED => 사용자가 예약을 취소한 상태
    PENDING, CONFIRMED, CANCELLED
}
