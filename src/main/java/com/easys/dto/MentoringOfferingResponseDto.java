package com.easys.dto;

import com.easys.entity.MentoringOffering;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class MentoringOfferingResponseDto {

    private final Long id;
    private final Long mentorId;
    private final String mentorName;
    private final String title;
    private final String skills;
    private final String consultationFields;
    private final String mentoringType;
    private final Integer price;
    private final String availableDays;
    private final String availableDates;
    private final String availableStart;
    private final String availableEnd;
    private final String availableSchedules;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public MentoringOfferingResponseDto(MentoringOffering offering) {
        this.id = offering.getId();
        this.mentorId = offering.getMentor().getId();
        this.mentorName = offering.getMentor().getMember().getNickname();
        this.title = offering.getTitle();
        this.skills = offering.getSkills();
        this.consultationFields = offering.getConsultationFields();
        this.mentoringType = offering.getMentoringType();
        this.price = offering.getPrice();
        this.availableDays = offering.getAvailableDays();
        this.availableDates = offering.getAvailableDates();
        this.availableStart = offering.getAvailableStart();
        this.availableEnd = offering.getAvailableEnd();
        this.availableSchedules = offering.getAvailableSchedules();
        this.createdAt = offering.getCreatedAt();
        this.updatedAt = offering.getUpdatedAt();
    }
}
