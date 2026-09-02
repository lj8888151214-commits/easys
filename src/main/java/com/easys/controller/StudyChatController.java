package com.easys.controller;

import com.easys.dto.StudyChatMessageCreateDto;
import com.easys.dto.StudyChatMessageResponseDto;
import com.easys.security.CustomUserDetails;
import com.easys.service.StudyChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// =====================================================
// 스터디 상세 페이지의 실시간 채팅 메시지 저장/조회 API.
//
// 실시간 전달 자체는 기존 WebSocketConfig(/signal)가 그대로 담당하고,
// 이 컨트롤러는 새로고침/재입장 후에도 대화 내용을 볼 수 있도록
// 메시지의 영구 저장과 이력 조회만 담당한다.
// =====================================================

@RestController
@RequestMapping("/study")
@RequiredArgsConstructor
public class StudyChatController {

    private final StudyChatService studyChatService;

    // 채팅 기록 조회 (스터디 참여자만) - GET /study/{id}/chat/messages
    @GetMapping("/{id}/chat/messages")
    public ResponseEntity<?> getMessages(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "로그인이 필요합니다."));
        }

        try {
            List<StudyChatMessageResponseDto> messages =
                    studyChatService.getMessages(id, userDetails.getMember().getEmail());

            return ResponseEntity.ok(messages);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // 메시지 전송 (스터디 참여자만) - POST /study/{id}/chat/messages
    @PostMapping("/{id}/chat/messages")
    public ResponseEntity<?> sendMessage(
            @PathVariable Long id,
            @RequestBody StudyChatMessageCreateDto request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "로그인이 필요합니다."));
        }

        try {
            StudyChatMessageResponseDto saved =
                    studyChatService.saveMessage(
                            id,
                            userDetails.getMember().getEmail(),
                            request.content()
                    );

            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
