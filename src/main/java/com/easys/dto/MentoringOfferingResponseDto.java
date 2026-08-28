package com.easys.dto;

import com.easys.entity.MentoringOffering;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

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

    // 날짜별 예약 가능/예약됨 상태 (공개 목록 = 신청 가능한 슬롯만,
    // 내가 등록한 멘토링 = 전체 슬롯 + 예약 정보)
    private final List<MentoringOfferingSlotDto> slots;

    public MentoringOfferingResponseDto(MentoringOffering offering, List<MentoringOfferingSlotDto> slots) {
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
        this.slots = slots;
    }
}
