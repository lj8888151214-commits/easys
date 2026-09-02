package com.easys.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

// 모임 캘린더에 뜨는 일정.
//
// study가 설정되어 있으면 스터디룸 예약이 확정되면서 자동 생성된
// 일정이고(참여자는 study의 소유자 + 승인된 신청자 전원), study가 없고
// createdBy만 있으면 사용자가 캘린더에서 수동으로 등록한 일정이다.
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "study_groups")
public class StudyGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    // 모임 유형: STUDY / MENTORING / GENERAL (모임 캘린더 카드 색/아이콘 구분용)
    @Column(nullable = false, length = 20)
    private String type;

    // 스터디룸 예약이 확정되며 자동 생성된 일정이면 연결된 스터디
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_id")
    private Study study;

    // 사용자가 수동으로 등록한 일정이면 작성자
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_member_id")
    private Member createdBy;

    @Column(nullable = false)
    private LocalDateTime startAt;

    @Column(nullable = false)
    private LocalDateTime endAt;
}
