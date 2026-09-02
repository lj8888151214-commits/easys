package com.easys.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "mentoring_offering")
public class MentoringOffering {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어떤 멘토가 등록한 멘토링인지
    // (멘토 한 명이 여러 개의 멘토링을 등록할 수 있다)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id", nullable = false)
    private MentorProfile mentor;

    // 멘토링 이름 (예: "Java 멘토링")
    @Column(nullable = false, length = 100)
    private String title;

    // 관련 기술
    @Column(length = 1000)
    private String skills;

    // 상담 가능 분야
    @Column(length = 500)
    private String consultationFields;

    // 멘토링 방식
    @Column(nullable = false, length = 30)
    private String mentoringType;

    // 1회 상담 가격
    @Column(nullable = false)
    private Integer price;

    // 기존 상담 가능 요일
    @Column(length = 200)
    private String availableDays;

    // 실제 상담 가능 날짜
    @Column(length = 2000)
    private String availableDates;

    @Column(length = 10)
    private String availableStart;

    @Column(length = 10)
    private String availableEnd;

    // 날짜별 상세 일정 (JSON)
    @Column(length = 3000)
    private String availableSchedules;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public MentoringOffering(
            MentorProfile mentor,
            String title,
            String skills,
            String consultationFields,
            String mentoringType,
            Integer price,
            String availableDays,
            String availableDates,
            String availableStart,
            String availableEnd,
            String availableSchedules
    ) {
        this.mentor = mentor;
        this.title = title;
        this.skills = skills;
        this.consultationFields = consultationFields;
        this.mentoringType = mentoringType;
        this.price = price;
        this.availableDays = availableDays;
        this.availableDates = availableDates;
        this.availableStart = availableStart;
        this.availableEnd = availableEnd;
        this.availableSchedules = availableSchedules;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    // 멘토링 수정 (기존 멘토링 하나만 수정, 다른 멘토링에는 영향 없음)
    public void update(
            String title,
            String skills,
            String consultationFields,
            String mentoringType,
            Integer price,
            String availableDays,
            String availableDates,
            String availableStart,
            String availableEnd,
            String availableSchedules
    ) {
        this.title = title;
        this.skills = skills;
        this.consultationFields = consultationFields;
        this.mentoringType = mentoringType;
        this.price = price;
        this.availableDays = availableDays;
        this.availableDates = availableDates;
        this.availableStart = availableStart;
        this.availableEnd = availableEnd;
        this.availableSchedules = availableSchedules;
        this.updatedAt = LocalDateTime.now();
    }
}
