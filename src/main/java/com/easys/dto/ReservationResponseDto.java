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
        );
    }
}