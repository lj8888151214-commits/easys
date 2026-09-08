package com.easys.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "personal_schedule")
public class PersonalSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private LocalDateTime startAt;

    @Column(nullable = false)
    private LocalDateTime endAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // 스트리밍 방(StreamingStudio.id)에서 등록/추가된 방송 관련 일정이면 그 방의 id.
    // 일반 개인 일정은 null이다.
    @Column(name = "streaming_room_id")
    private Long streamingRoomId;

    public PersonalSchedule(Member member, String title, String content,
                            LocalDateTime startAt, LocalDateTime endAt) {
        this.member = member;
        this.title = title;
        this.content = content;
        this.startAt = startAt;
        this.endAt = endAt;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public PersonalSchedule(Member member, String title, String content,
                            LocalDateTime startAt, LocalDateTime endAt, Long streamingRoomId) {
        this(member, title, content, startAt, endAt);
        this.streamingRoomId = streamingRoomId;
    }

    public void update(String title, String content,
                       LocalDateTime startAt, LocalDateTime endAt) {
        this.title = title;
        this.content = content;
        this.startAt = startAt;
        this.endAt = endAt;
        this.updatedAt = LocalDateTime.now();
    }
}