package com.easys.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 18단계: 로그아웃해도 사라지면 안 되는 "장기 기억"만 담는다(단기 대화 문맥은
// Redis/ChatSessionService가 그대로 담당한다). 예: 사용자가 명시적으로
// "0ho야 기억해"라고 요청한 선호 이름, "이거 기억해둬"라고 요청한 메모.
// memberId + memoryKey로 한 사용자의 같은 종류 기억은 하나만 유지한다
// (예: preferred_name은 항상 최신 값으로 덮어쓴다).
@Entity
@Getter
@NoArgsConstructor
@Table(
        name = "ai_user_memory",
        uniqueConstraints = @UniqueConstraint(columnNames = {"member_id", "memory_key"})
)
public class AiUserMemory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 예: "preferred_name", "note_1757400000000"
    @Column(name = "memory_key", nullable = false, length = 100)
    private String memoryKey;

    @Column(name = "memory_value", nullable = false, length = 1000)
    private String memoryValue;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public AiUserMemory(Member member, String memoryKey, String memoryValue) {
        this.member = member;
        this.memoryKey = memoryKey;
        this.memoryValue = memoryValue;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void updateValue(String memoryValue) {
        this.memoryValue = memoryValue;
        this.updatedAt = LocalDateTime.now();
    }
}
