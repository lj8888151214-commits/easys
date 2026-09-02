package com.easys.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record ReservationCreateDto(

        // 예약할 스터디룸 ID
        Long studyRoomId,

        // 예약 날짜
        LocalDate reservationDate,

        // 시작 시간
        LocalTime startTime,

        // 종료 시간
        LocalTime endTime,

        // 예약 인원
        int peopleCount
) {
}