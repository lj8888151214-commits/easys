package com.easys.dto;

import com.easys.entity.Reservation;
import com.easys.entity.ReservationStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record ReservationResponseDto(

        Long id,

        Long studyRoomId,

        String studyRoomName,

        String location,

        LocalDate reservationDate,

        LocalTime startTime,

        LocalTime endTime,

        int peopleCount,

        BigDecimal totalPrice,

        ReservationStatus status,

        Long personalScheduleId,


        LocalDateTime createdAt

        // 스터디 예약이면 연결된 스터디 정보 (개인 예약이면 모두 null)
        Long studyId,

        String studyTitle,

        Long groupScheduleId,

        LocalDateTime createdAt,

        // 결제 관련 정보 (연결된 Payment가 없으면 모두 null)
        String orderId,

        String paymentStatus,

        Integer amount

) {

    public static ReservationResponseDto from(Reservation reservation) {

        return new ReservationResponseDto(
                reservation.getId(),
                reservation.getStudyRoom().getId(),
                reservation.getStudyRoom().getName(),
                reservation.getStudyRoom().getLocation(),
                reservation.getReservationDate(),
                reservation.getStartTime(),
                reservation.getEndTime(),
                reservation.getPeopleCount(),
                reservation.getTotalPrice(),
                reservation.getStatus(),
                reservation.getPersonalSchedule() != null
                        ? reservation.getPersonalSchedule().getId()
                        : null,

                reservation.getCreatedAt()

                reservation.getStudy() != null ? reservation.getStudy().getId() : null,
                reservation.getStudy() != null ? reservation.getStudy().getTitle() : null,
                reservation.getGroupSchedule() != null ? reservation.getGroupSchedule().getId() : null,
                reservation.getCreatedAt(),
                payment == null ? null : payment.getOrderId(),
                payment == null ? null : payment.getStatus().name(),
                payment == null ? null : payment.getAmount()

        );
    }
}