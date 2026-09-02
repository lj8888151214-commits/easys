package com.easys.dto;

import com.easys.entity.MentoringReservation;
import lombok.Getter;

@Getter
public class MentoringReviewEligibleReservationDto {

    private final Long reservationId;
    private final Long mentorId;
    private final String mentorName;
    private final String reservationDate;
    private final String reservationTime;

    public MentoringReviewEligibleReservationDto(MentoringReservation reservation) {
        this.reservationId = reservation.getId();
        this.mentorId = reservation.getMentor().getId();
        this.mentorName = reservation.getMentor().getMember().getNickname();
        this.reservationDate = reservation.getReservationDate();
        this.reservationTime = reservation.getReservationTime();
    }
}
