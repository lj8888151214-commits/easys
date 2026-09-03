package com.easys.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
@Table(
        name = "study_application",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {
                                "study_id",
                                "member_id"
                        }
                )
        }
)
public class StudyApplication {

    // =====================================================
    // 신청 번호
    // =====================================================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    // =====================================================
    // 어떤 스터디에 신청했는지
    // =====================================================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "study_id",
            nullable = false
    )
    private Study study;


    // =====================================================
    // 누가 신청했는지
    // =====================================================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "member_id",
            nullable = false
    )
    private Member member;


    // =====================================================
    // 신청 상태
    // =====================================================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StudyApplicationStatus status;


    // =====================================================
    // 신청 날짜
    // =====================================================

    @Column(nullable = false)
    private LocalDateTime createdAt;


    // =====================================================
    // 승인된 시각 (= 실제로 스터디에 들어간 시각)
    // =====================================================

    private LocalDateTime approvedAt;


    // =====================================================
    // 신청 생성
    // =====================================================

    public StudyApplication(
            Study study,
            Member member
    ) {

        this.study = study;

        this.member = member;

        this.status =
                StudyApplicationStatus.PENDING;

        this.createdAt =
                LocalDateTime.now();
    }


    // =====================================================
    // 승인
    // =====================================================

    public void approve() {

        this.status =
                StudyApplicationStatus.APPROVED;

        this.approvedAt =
                LocalDateTime.now();
    }


    // =====================================================
    // 거절
    // =====================================================

    public void reject() {

        this.status =
                StudyApplicationStatus.REJECTED;
    }
}