package com.easys.controller;

import com.easys.dto.AiChatRequestDto;
import com.easys.service.AiChatService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// 일반적인 웹 개발/학습 질문은 비로그인 사용자도 사용할 수 있다(SecurityConfig에서
// /api/ai/**를 permitAll로 열어둠). 개인 데이터(캘린더/예약 등)를 다루는 기능이
// 추가되면, 그 기능을 실행하는 시점에 이 컨트롤러가 아니라 해당 기능 쪽에서
// 로그인 여부를 확인하도록 설계한다 (1단계 범위 밖).
@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    private final AiChatService aiChatService;

    public AiChatController(AiChatService aiChatService) {
        this.aiChatService = aiChatService;
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody AiChatRequestDto request) {
        try {
            String reply = aiChatService.ask(request.getMessage());
            return ResponseEntity.ok(Map.of("reply", reply));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", e.getMessage()));
        }
    }
}
