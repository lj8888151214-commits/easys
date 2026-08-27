package com.easys.dto;

import com.easys.entity.MentoringReservation;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class MentoringReservationResponseDto {

    private final Long id;
    private final Long mentorId;
    private final String mentorName;
    private final Long offeringId;
    private final String offeringTitle;
    private final Long memberId;
    private final String memberNickname;
    private final String consultationTypes;
    private final String skills;
    private final String reservationDate;
    private final String reservationTime;
    private final String problem;
    private final String fileName;
    private final String status;
    private final String rejectReason;
    private final LocalDateTime createdAt;

    public MentoringReservationResponseDto(MentoringReservation reservation) {
        this.id = reservation.getId();
        this.mentorId = reservation.getMentor().getId();
        this.mentorName = reservation.getMentor().getMember().getNickname();
        this.offeringId = reservation.getOffering() == null ? null : reservation.getOffering().getId();
        this.offeringTitle = reservation.getOffering() == null ? null : reservation.getOffering().getTitle();
        this.memberId = reservation.getMember().getId();
        this.memberNickname = reservation.getMember().getNickname();
        this.consultationTypes = reservation.getConsultationTypes();
        this.skills = reservation.getSkills();
        this.reservationDate = reservation.getReservationDate();
        this.reservationTime = reservation.getReservationTime();
        this.problem = reservation.getProblem();
        this.fileName = reservation.getFileName();
        this.status = reservation.getStatus().name();
        this.rejectReason = reservation.getRejectReason();
        this.createdAt = reservation.getCreatedAt();
    }
}
