package com.easys.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "mentoring_reservation")
public class MentoringReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어떤 멘토에게 신청했는지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id", nullable = false)
    private MentorProfile mentor;

    // 누가 신청했는지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 상담 분야
    @Column(length = 1000)
    private String consultationTypes;

    // 관련 기술
    @Column(length = 1000)
    private String skills;

    // 예약 날짜
    @Column(nullable = false)
    private String reservationDate;

    // 예약 시간
    @Column(nullable = false)
    private String reservationTime;

    // 현재 문제
    @Column(nullable = false, length = 2000)
    private String problem;

    // 첨부파일 이름
    @Column(length = 500)
    private String fileName;

    // 첨부파일 저장 경로
    @Column(length = 1000)
    private String filePath;

    // 신청 상태
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MentoringReservationStatus status;

    // 신청 날짜
    @Column(nullable = false)
    private LocalDateTime createdAt;

    public MentoringReservation(
            MentorProfile mentor,
            Member member,
            String consultationTypes,
            String skills,
            String reservationDate,
            String reservationTime,
            String problem,
            String fileName,
            String filePath
    ) {
        this.mentor = mentor;
        this.member = member;
        this.consultationTypes = consultationTypes;
        this.skills = skills;
        this.reservationDate = reservationDate;
        this.reservationTime = reservationTime;
        this.problem = problem;
        this.fileName = fileName;
        this.filePath = filePath;
        this.status = MentoringReservationStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }

    // 승인
    public void approve() {
        this.status = MentoringReservationStatus.APPROVED;
    }

    // 거절
    public void reject() {
        this.status = MentoringReservationStatus.REJECTED;
    }
}