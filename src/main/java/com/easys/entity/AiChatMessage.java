package com.easys.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 18단계: 로그인 사용자의 AI 채팅을 "영구적으로" 보관한다(로그아웃해도 지우지
// 않음 - 사용자가 AI를 메모장처럼 계속 이어서 쓸 수 있어야 한다는 요구사항).
// Redis(ChatSessionService)는 여전히 "지금 이 턴에 어떤 대화가 오갔는지"를
// Qwen에게 보내기 위한 단기 문맥 저장소로만 쓰고, 역할이 겹치지 않는다.
//
// memberId로만 소유자를 구분한다 - 다른 사용자의 채팅이 섞여 보이면 안 되므로
// 조회는 항상 member 기준으로 필터링한다(AiChatService/AiChatMessageRepository).
@Entity
@Getter
@NoArgsConstructor
@Table(name = "ai_chat_message")
public class AiChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // ChatSessionService.ROLE_USER / ROLE_MODEL과 같은 값("user" / "model")을 쓴다.
    @Column(nullable = false, length = 10)
    private String role;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public AiChatMessage(Member member, String role, String content) {
        this.member = member;
        this.role = role;
        this.content = content;
        this.createdAt = LocalDateTime.now();
    }
}
