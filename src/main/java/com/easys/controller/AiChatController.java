package com.easys.controller;

import com.easys.dto.AiChatRequestDto;
import com.easys.dto.AiChatResponseDto;
import com.easys.security.CustomUserDetails;
import com.easys.service.AiChatService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// 일반적인 웹 개발/학습 질문은 비로그인 사용자도 사용할 수 있다(SecurityConfig에서
// /api/ai/**를 permitAll로 열어둠). 17단계: "내 일정" 같은 개인 데이터 질문은 이
// 컨트롤러에서 로그인 여부(CustomUserDetails, 없으면 null)만 확인해서 넘겨주고,
// 실제로 로그인이 필요한지/어떤 데이터를 보여줄지는 AiChatService가 판단한다
// (PersonalScheduleController 등 다른 컨트롤러와 동일한 @AuthenticationPrincipal
// 패턴 - permitAll이어도 로그인했으면 정상적으로 채워진다).
@Slf4j
@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    private final AiChatService aiChatService;

    public AiChatController(AiChatService aiChatService) {
        this.aiChatService = aiChatService;
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody AiChatRequestDto request,
                                   @AuthenticationPrincipal CustomUserDetails userDetails) {
        // 20단계: React -> EASYS Backend -> (Redis/Ollama) -> EASYS Backend -> React
        // 전체 구간 중 EASYS 백엔드 쪽 처리 시간만 실제로 측정해서 로그로 남긴다.
        // (Ollama 자체 생성 시간은 CustomLlmClient가 별도로 측정/로그한다.)
        long startedAt = System.currentTimeMillis();
        try {
            AiChatResponseDto response = aiChatService.ask(
                    request.getMessage(), request.getSessionId(), request.getGuestId(), userDetails);
            long elapsedMs = System.currentTimeMillis() - startedAt;
            log.info("AI 챗봇 요청 처리 시간: {}ms (loggedIn={}, messageLength={})",
                    elapsedMs, userDetails != null, request.getMessage() != null ? request.getMessage().length() : 0);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // 18단계: 로그인 사용자가 로그아웃 후 다시 로그인했을 때(또는 새로고침 시)
    // 이전 대화를 이어서 볼 수 있도록 영구 채팅 기록을 돌려준다. 비로그인이면
    // (userDetails=null) 빈 목록을 준다 - 익명 사용자의 대화는 애초에 Redis에만
    // 있고 DB에 저장되지 않으므로 여기서 조회할 대상이 없다.
    @GetMapping("/history")
    public ResponseEntity<?> history(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(aiChatService.getHistory(userDetails));
    }

    // 19단계: "지금까지 대화 다 지워줘" 확인(Action) 후, 프론트가 실제 삭제를
    // 실행할 때 호출하는 별도 API. 채팅 응답 안에 삭제 로직을 넣지 않고 명확한
    // 이름의 엔드포인트로 분리했다. 인증된 사용자만 사용할 수 있다 - 비로그인이면
    // 삭제할 영구 기록도 없으므로 401로 막는다. sessionId는 이 브라우저가 지금
    // 쓰고 있는 Redis 대화 세션도 함께 지우기 위해 선택적으로 받는다.
    @DeleteMapping("/history")
    public ResponseEntity<?> deleteHistory(@AuthenticationPrincipal CustomUserDetails userDetails,
                                            @RequestParam(required = false) String sessionId) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "로그인이 필요합니다."));
        }
        aiChatService.deleteHistory(userDetails, sessionId);
        return ResponseEntity.ok(Map.of("message", "대화 기록을 삭제했습니다."));
    }
}
