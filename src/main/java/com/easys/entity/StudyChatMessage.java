package com.easys.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 스터디 상세 페이지의 실시간 채팅 메시지.
//
// 기존에는 WebSocket(/signal)으로만 중계되고 DB에 저장되지 않아 새로고침하면
// 사라졌다 - 새로고침/재입장 후에도 대화 내용을 볼 수 있도록 메시지를 저장한다.
// 실시간 전달 자체는 여전히 WebSocketConfig의 /signal 채널이 담당하고,
// 이 엔티티는 그 메시지의 영구 저장/이력 조회를 담당한다.
@Entity
@Getter
@NoArgsConstructor
@Table(name = "study_chat_message")
public class StudyChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_id", nullable = false)
    private Study study;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false, length = 1000)
    private String content;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public StudyChatMessage(Study study, Member member, String content) {
        this.study = study;
        this.member = member;
        this.content = content;
        this.createdAt = LocalDateTime.now();
    }
}
