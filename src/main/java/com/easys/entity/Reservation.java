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

    // 생성일
    @Column(nullable = false)
    private LocalDateTime createdAt;

    // 수정일
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public Reservation(
            Member member,
            StudyRoom studyRoom,
            LocalDate reservationDate,
            LocalTime startTime,
            LocalTime endTime,
            int peopleCount,
            BigDecimal totalPrice
    ) {
        this.member = member;
        this.studyRoom = studyRoom;
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

    // 토스 결제 승인 완료 (관리자 승인 대기 상태로 전환)
    public void markPaid() {
        this.status = ReservationStatus.PAID;
        this.updatedAt = LocalDateTime.now();
    }

    // 관리자 승인 완료 후 예약 확정
    public void confirm(PersonalSchedule personalSchedule) {
        this.status = ReservationStatus.CONFIRMED;
        this.personalSchedule = personalSchedule;
        this.updatedAt = LocalDateTime.now();
    }

    // 예약 취소
    //
    // personalSchedule 참조도 함께 끊어야 한다 - FK로 걸려있는 캘린더
    // 일정을 삭제하려면 이 예약이 먼저 그 일정을 참조하지 않아야 한다.
    public void cancel() {
        this.status = ReservationStatus.CANCELLED;
        this.personalSchedule = null;
        this.updatedAt = LocalDateTime.now();
    }








}
