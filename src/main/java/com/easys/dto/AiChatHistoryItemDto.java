package com.easys.dto;

import java.time.LocalDateTime;

// 18단계: GET /api/ai/history 응답 한 건. role은 프론트(AiChatbot.jsx)가 이미 쓰고
// 있는 메시지 표현("user" / "ai")과 그대로 맞춰서 내려준다 - AiChatMessage에는
// "model"로 저장되어 있지만, 여기서 "ai"로 바꿔 내려줘서 프론트가 별도 매핑 없이
// setMessages()에 그대로 넣을 수 있게 한다.
public record AiChatHistoryItemDto(
        String role,
        String text,
        LocalDateTime createdAt
) {
}
