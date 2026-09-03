package com.easys.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "study_room_reservation")
public class Reservation {

    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;

    // 예약한 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 예약한 스터디룸
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_room_id", nullable = false)
    private StudyRoom studyRoom;

    // 이 예약이 어느 스터디를 위한 예약인지 (null이면 개인 예약)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_id")
    private Study study;

    // 예약 날짜
    @Column(nullable = false)
    private LocalDate reservationDate;

    // 시작 시간
    @Column(nullable = false)
    private LocalTime startTime;

    // 종료 시간
    @Column(nullable = false)
    private LocalTime endTime;

    // 예약 인원
    @Column(nullable = false)
    private int peopleCount;

    // 최종 예약 금액
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    // 예약 상태
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReservationStatus status;

    // 예약과 연결된 캘린더 일정
    //
    // 결제 완료 후 예약이 CONFIRMED가 되면
    // PersonalSchedule이 생성되고 여기에 연결한다.
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personal_schedule_id")
    private PersonalSchedule personalSchedule;

    // 스터디 예약이 확정되면 생성되는 모임 캘린더 일정
    //
    // study가 설정된(스터디) 예약이 CONFIRMED가 되면
    // StudyGroup이 생성되고 여기에 연결한다.
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_schedule_id")
    private StudyGroup groupSchedule;

    // 생성일
    @Column(nullable = false)
    private LocalDateTime createdAt;

    // 수정일
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public Reservation(
            Member member,
            StudyRoom studyRoom,
            Study study,
            LocalDate reservationDate,
            LocalTime startTime,
            LocalTime endTime,
            int peopleCount,
            BigDecimal totalPrice
    ) {
        this.member = member;
        this.studyRoom = studyRoom;
        this.study = study;
        this.reservationDate = reservationDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.peopleCount = peopleCount;
        this.totalPrice = totalPrice;
        // 처음 예약하면 결제 전 상태
        this.status = ReservationStatus.PENDING;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }


    // 결제 완료 후 예약 확정

    // 이 예약이 스터디를 위한 예약인지 (false면 개인 예약)
    public boolean isStudyReservation() {
        return this.study != null;
    }

    // 스터디 삭제 시 참조를 끊는다 (CANCELLED 예약만 대상 - 결제/이용 이력 자체는 보존).
    public void detachStudy() {
        this.study = null;
    }

    // 토스 결제 승인 완료
    public void markPaid() {
        this.status = ReservationStatus.PAID;
        this.updatedAt = LocalDateTime.now();
    }

    // 개인 예약 확정 (나의 캘린더 일정 연결)

    public void confirm(PersonalSchedule personalSchedule) {
        this.status = ReservationStatus.CONFIRMED;
        this.personalSchedule = personalSchedule;
        this.updatedAt = LocalDateTime.now();
    }

    // 스터디 예약 확정 (모임 캘린더 일정 연결)
    public void confirmGroup(StudyGroup groupSchedule) {
        this.status = ReservationStatus.CONFIRMED;
        this.groupSchedule = groupSchedule;
        this.updatedAt = LocalDateTime.now();
    }

    // 예약 취소

    public void cancel() {
        this.status = ReservationStatus.CANCELLED;

    //
    // personalSchedule/groupSchedule 참조도 함께 끊어야 한다 - FK로 걸려있는
    // 캘린더 일정을 삭제하려면 이 예약이 먼저 그 일정을 참조하지 않아야 한다.
    public void cancel() {
        this.status = ReservationStatus.CANCELLED;
        this.personalSchedule = null;
        this.groupSchedule = null;

        this.updatedAt = LocalDateTime.now();
    }








}
