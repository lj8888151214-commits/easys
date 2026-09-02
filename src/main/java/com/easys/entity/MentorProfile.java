package com.easys.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@ToString
@Table(name = "mentor_profile")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MentorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 멘토와 회원 연결
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false, unique = true)
    private Member member;

    // 멘토링 제목
    @Column(nullable = false, length = 100)
    private String title;

    // 멘토 소개
    @Column(nullable = false, length = 1000)
    private String introduction;

    // 경력
    @Column(length = 1000)
    private String career;

    // 경력 상세
    @Column(length = 2000)
    private String careerDetail;

    // 자격증
    @Column(length = 1000)
    private String certificates;

    // 주요 기술
    @Column(length = 1000)
    private String skills;

    // 시간당 멘토링 가격
    @Column(nullable = false)
    private Integer price;

    // 멘토링 방식
    @Column(nullable = false, length = 30)
    private String mentoringType;

    // 주요 상담 분야
    @Column(length = 500)
    private String consultationFields;

    // GitHub
    @Column(length = 500)
    private String github;

    // Velog
    @Column(length = 500)
    private String velog;

    // 포트폴리오
    @Column(length = 500)
    private String portfolio;

    // 기존 상담 가능 요일
    @Column(length = 200)
    private String availableDays;

    // 실제 상담 가능 날짜
    // 예: 2026-09-03,2026-09-10,2026-09-17
    @Column(length = 2000)
    private String availableDates;

    // 상담 가능 시작 시간
    @Column(length = 10)
    private String availableStart;

    // 상담 가능 종료 시간
    @Column(length = 10)
    private String availableEnd;

    // 날짜별 상세 일정 (JSON 형식: [{"date":"2026-08-27","day":"목","startTime":"10:00","endTime":"12:00"}, ...])
    @Column(length = 3000)
    private String availableSchedules;

    // 멘토 등록 상태
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MentorStatus status;

    // 등록일
    @Column(nullable = false)
    private LocalDateTime createdAt;

    // 수정일
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public MentorProfile(
            Member member,
            String title,
            String introduction,
            String career,
            String careerDetail,
            String certificates,
            String skills,
            Integer price,
            String mentoringType,
            String consultationFields,
            String github,
            String velog,
            String portfolio,
            String availableDays,
            String availableDates,
            String availableStart,
            String availableEnd,
            String availableSchedules
    ) {
        this.member = member;
        this.title = title;
        this.introduction = introduction;
        this.career = career;
        this.careerDetail = careerDetail;
        this.certificates = certificates;
        this.skills = skills;
        this.price = price;
        this.mentoringType = mentoringType;
        this.consultationFields = consultationFields;
        this.github = github;
        this.velog = velog;
        this.portfolio = portfolio;
        this.availableDays = availableDays;
        this.availableDates = availableDates;
        this.availableStart = availableStart;
        this.availableEnd = availableEnd;
        this.availableSchedules = availableSchedules;

        // 관리자 승인 없이 바로 등록
        this.status = MentorStatus.APPROVED;

        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // 멘토 정보 수정
    public void update(
            String title,
            String introduction,
            String career,
            String careerDetail,
            String certificates,
            String skills,
            Integer price,
            String mentoringType,
            String consultationFields,
            String github,
            String velog,
            String portfolio,
            String availableDays,
            String availableDates,
            String availableStart,
            String availableEnd,
            String availableSchedules
    ) {
        this.title = title;
        this.introduction = introduction;
        this.career = career;
        this.careerDetail = careerDetail;
        this.certificates = certificates;
        this.skills = skills;
        this.price = price;
        this.mentoringType = mentoringType;
        this.consultationFields = consultationFields;
        this.github = github;
        this.velog = velog;
        this.portfolio = portfolio;
        this.availableDays = availableDays;
        this.availableDates = availableDates;
        this.availableStart = availableStart;
        this.availableEnd = availableEnd;
        this.availableSchedules = availableSchedules;

        this.updatedAt = LocalDateTime.now();
    }
}
