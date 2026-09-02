package com.easys.controller;

import com.easys.entity.Member;
import com.easys.repository.MemberRepository;
import com.easys.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// =====================================================
// 로그인한 회원의 사이트 내 알림 API.
// =====================================================

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final MemberRepository memberRepository;
    private final NotificationService notificationService;

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

    // 내 알림 목록
    @GetMapping("/me")
    public ResponseEntity<?> getMyNotifications(Authentication authentication) {
        try {
            Member member = getCurrentMember(authentication);
            return ResponseEntity.ok(notificationService.getMyNotifications(member));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // 읽지 않은 알림 개수 (헤더 뱃지용)
    @GetMapping("/me/unread-count")
    public ResponseEntity<?> getUnreadCount(Authentication authentication) {
        try {
            Member member = getCurrentMember(authentication);
            return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(member)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // 알림 하나 읽음 처리
    @PostMapping("/{notificationId}/read")
    public ResponseEntity<?> markAsRead(
            Authentication authentication,
            @PathVariable Long notificationId
    ) {
        try {
            Member member = getCurrentMember(authentication);
            notificationService.markAsRead(notificationId, member);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // 전체 읽음 처리
    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(Authentication authentication) {
        try {
            Member member = getCurrentMember(authentication);
            notificationService.markAllAsRead(member);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
