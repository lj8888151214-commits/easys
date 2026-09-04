package com.easys.controller;

import com.easys.dto.MentoringChatMessageCreateDto;
import com.easys.dto.MentoringChatMessageResponseDto;
import com.easys.entity.Member;
import com.easys.repository.MemberRepository;
import com.easys.service.MentoringChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// =====================================================
// 멘토링 예약 1건당 멘토-신청자 사이의 1:1 채팅 메시지 저장/조회 API.
//
// 기존 /mentor/reservation API와 같은 베이스 경로를 사용해 하나의
// 예약(reservationId)에 종속된 하위 리소스임을 명확히 한다
// (StudyChatController가 /study/{id}/chat/messages를 쓰는 것과 동일한 방식).
//
// 메시지 전송(POST)은 이전과 동일하게 REST로만 처리한다 - 권한 검사와 DB 저장은
// 여전히 MentoringChatService 한 곳에서만 이루어진다. 다만 저장에 성공하면
// StompChatConfig가 등록한 "/topic/mentoring/{reservationId}"로도 즉시 전달해,
// 같은 예약을 구독 중인 상대방 화면에 새로고침 없이 바로 나타나게 한다.
// =====================================================

@RestController
@RequestMapping("/mentor/reservation")
@RequiredArgsConstructor
public class MentoringChatController {

    private final MemberRepository memberRepository;
    private final MentoringChatService mentoringChatService;
    private final SimpMessagingTemplate messagingTemplate;

    private Member getCurrentMember(Authentication authentication) {
        if (authentication == null ||
                !authentication.isAuthenticated() ||
                "anonymousUser".equals(authentication.getName())) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        String email = authentication.getName();

        return memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다."));
    }

    // 채팅 기록 조회 (해당 예약의 멘토/신청자만) - GET /mentor/reservation/{reservationId}/chat/messages
    @GetMapping("/{reservationId}/chat/messages")
    public ResponseEntity<?> getMessages(
            Authentication authentication,
            @PathVariable Long reservationId
    ) {
        try {
            Member member = getCurrentMember(authentication);

            List<MentoringChatMessageResponseDto> messages =
                    mentoringChatService.getMessages(reservationId, member.getEmail());

            return ResponseEntity.ok(messages);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // 메시지 전송 (해당 예약의 멘토/신청자만) - POST /mentor/reservation/{reservationId}/chat/messages
    @PostMapping("/{reservationId}/chat/messages")
    public ResponseEntity<?> sendMessage(
            Authentication authentication,
            @PathVariable Long reservationId,
            @RequestBody MentoringChatMessageCreateDto request
    ) {
        try {
            Member member = getCurrentMember(authentication);

            MentoringChatMessageResponseDto saved =
                    mentoringChatService.saveMessage(
                            reservationId,
                            member.getEmail(),
                            request.content()
                    );

            messagingTemplate.convertAndSend(
                    "/topic/mentoring/" + reservationId,
                    saved
            );

            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
