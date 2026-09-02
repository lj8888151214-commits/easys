package com.easys.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "notification")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 알림을 받는 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 500)
    private String content;

    // 알림 종류 (예: STUDY_RESERVATION_APPROVED, STUDY_RESERVATION_REJECTED)
    @Column(nullable = false, length = 50)
    private String type;

    // 알림과 연관된 대상 id (예: 예약 id). 프론트에서 클릭 시 이동 등에 사용할 수 있다.
    @Column
    private Long targetId;

    // MySQL 예약어(READ)와 충돌하지 않도록 DB 컬럼명은 is_read로 매핑한다.
    @Column(name = "is_read", nullable = false)
    private boolean read;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Notification(
            Member member,
            String title,
            String content,
            String type,
            Long targetId
    ) {
        this.member = member;
        this.title = title;
        this.content = content;
        this.type = type;
        this.targetId = targetId;
        this.read = false;
        this.createdAt = LocalDateTime.now();
    }

    public void markRead() {
        this.read = true;
    }
}
