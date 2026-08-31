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

    // 멘토가 등록한 여러 멘토링(Java/Spring/React 등) 중
    // 구체적으로 어떤 멘토링을 신청했는지.
    // offeringId 없이(과거 방식으로) 신청한 예약과의 호환을 위해 nullable로 둔다.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offering_id")
    private MentoringOffering offering;

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

    // 거절 사유 (멘토가 거절할 때 선택적으로 입력)
    @Column(length = 500)
    private String rejectReason;

    // 예약 승인 시 자동 생성되는 개인 캘린더(PersonalSchedule) 일정 id.
    // 멘토/신청자 각각의 캘린더에 하나씩 생성되므로 둘을 따로 저장한다.
    // (승인 전이거나 거절된 경우에는 null)
    @Column(name = "mentor_schedule_id")
    private Long mentorScheduleId;

    @Column(name = "applicant_schedule_id")
    private Long applicantScheduleId;

    // "나의 멘토링 기록"에서 각자 자신의 화면에서만 숨기기 위한 플래그.
    // 예약 데이터 자체(MentoringReservation row)는 삭제하지 않는다 —
    // 상대방 쪽 기록/후기/캘린더 등 다른 기능에서 계속 참조하기 때문이다.
    // 기존 행은 컬럼 추가 시 NULL이 되므로, 조회 시 null은 "숨기지 않음"으로 취급한다.
    @Column(name = "hidden_by_mentor")
    private Boolean hiddenByMentor;

    @Column(name = "hidden_by_applicant")
    private Boolean hiddenByApplicant;

    // 신청 날짜
    @Column(nullable = false)
    private LocalDateTime createdAt;

    public MentoringReservation(
            MentorProfile mentor,
            MentoringOffering offering,
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
        this.offering = offering;
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

    // 거절 (사유는 선택 입력)
    public void reject(String rejectReason) {
        this.status = MentoringReservationStatus.REJECTED;
        this.rejectReason = rejectReason;
    }

    // 수업 완료
    public void complete() {
        this.status = MentoringReservationStatus.COMPLETED;
    }

    // 승인 시 멘토/신청자 개인 캘린더에 만들어진 일정 id를 연결한다.
    public void linkSchedules(Long mentorScheduleId, Long applicantScheduleId) {
        this.mentorScheduleId = mentorScheduleId;
        this.applicantScheduleId = applicantScheduleId;
    }

    // 거절(승인 취소) 시 더 이상 유효하지 않은 캘린더 일정 연결을 해제한다.
    public void clearScheduleLinks() {
        this.mentorScheduleId = null;
        this.applicantScheduleId = null;
    }

    // 멘토링(offering)이 삭제될 때, 이미 끝난(완료/거절) 예약 기록은 삭제하지 않고
    // offering 연결만 끊어서 "나의 멘토링 기록"에 계속 남도록 한다.
    public void detachOffering() {
        this.offering = null;
    }

    // "나의 멘토링 기록"에서 삭제 — 본인 화면에서만 숨긴다(데이터는 유지).
    public void hideForMentor() {
        this.hiddenByMentor = Boolean.TRUE;
    }

    public void hideForApplicant() {
        this.hiddenByApplicant = Boolean.TRUE;
    }
}