package com.easys.dto;

import com.easys.entity.Payment;
import com.easys.entity.Reservation;
import com.easys.entity.ReservationStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

// 관리자 페이지에서 "누가 몇 시에 어느 스터디룸을 예약했는지"를
// 한눈에 보여주기 위한 응답 DTO.
public record AdminReservationResponseDto(

        Long id,

        Long memberId,

        String memberNickname,

        String memberEmail,

        Long studyRoomId,

        String studyRoomName,

        String location,

        LocalDate reservationDate,

        LocalTime startTime,

        LocalTime endTime,

        int peopleCount,

        BigDecimal totalPrice,

        ReservationStatus status,

        String paymentStatus,

        // 스터디 예약이면 연결된 스터디 정보 (개인 예약이면 모두 null)
        Long studyId,

        String studyTitle,

        Long groupScheduleId,

        LocalDateTime createdAt
) {

    public static AdminReservationResponseDto from(Reservation reservation, Payment payment) {

        return new AdminReservationResponseDto(
                reservation.getId(),
                reservation.getMember().getId(),
                reservation.getMember().getNickname(),
                reservation.getMember().getEmail(),
                reservation.getStudyRoom().getId(),
                reservation.getStudyRoom().getName(),
                reservation.getStudyRoom().getLocation(),
                reservation.getReservationDate(),
                reservation.getStartTime(),
                reservation.getEndTime(),
                reservation.getPeopleCount(),
                reservation.getTotalPrice(),
                reservation.getStatus(),
                payment == null ? null : payment.getStatus().name(),
                reservation.getStudy() != null ? reservation.getStudy().getId() : null,
                reservation.getStudy() != null ? reservation.getStudy().getTitle() : null,
                reservation.getGroupSchedule() != null ? reservation.getGroupSchedule().getId() : null,
                reservation.getCreatedAt()
        );
    }
}
