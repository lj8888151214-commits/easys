package com.easys.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record ReservationCreateDto(

        // 예약할 스터디룸 ID
        Long studyRoomId,

        // 스터디 예약이면 해당 스터디 ID (개인 예약이면 null)
        // studyId가 있으면 서버는 아래 reservationDate/startTime/endTime을
        // 신뢰하지 않고 Study의 일정으로 덮어써서 처리한다.
        Long studyId,

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