package com.easys.controller;

import com.easys.entity.Member;
import com.easys.repository.MemberRepository;
import com.easys.service.KakaoNotificationService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

// =====================================================
// 관리자가 예약 알림을 카카오톡으로도 받기 위해 자신의 카카오 계정을
// 연결/해제하는 API. "/admin/**"는 SecurityConfig에서 이미
// hasRole("ADMIN")으로 막혀 있어 이 컨트롤러의 모든 엔드포인트는
// 관리자만 호출할 수 있다.
// =====================================================

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/kakao-notify")
public class KakaoNotificationController {

    private final KakaoNotificationService kakaoNotificationService;
    private final MemberRepository memberRepository;

    // 카카오 콜백은 브라우저를 실제로 백엔드 주소로 이동시키므로,
    // 상대경로가 아닌 프론트엔드 절대 주소로 되돌려보내야 한다
    // (Google OAuth2 콜백과 동일한 이유).
    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    private Member getCurrentAdmin(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        return memberRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다."));
    }

    // 현재 관리자의 카카오톡 알림 연결 여부
    @GetMapping("/status")
    public ResponseEntity<?> status(Authentication authentication) {
        Member admin = getCurrentAdmin(authentication);
        return ResponseEntity.ok(Map.of("linked", admin.isKakaoNotificationLinked()));
    }

    // "카카오톡 알림 연결하기" 버튼이 이동하는 주소 (브라우저 전체 이동)
    @GetMapping("/authorize")
    public void authorize(HttpServletResponse response) throws IOException {
        response.sendRedirect(kakaoNotificationService.buildAuthorizeUrl());
    }

    // 카카오 인가 후 리다이렉트되는 콜백
    @GetMapping("/callback")
    public void callback(
            @RequestParam String code,
            Authentication authentication,
            HttpServletResponse response
    ) throws IOException {

        try {
            Member admin = getCurrentAdmin(authentication);
            kakaoNotificationService.linkAdminAccount(admin, code);
            response.sendRedirect(frontendBaseUrl + "/admin?kakaoLinked=1");
        } catch (Exception e) {
            log.error("카카오톡 알림 연동 실패", e);
            response.sendRedirect(frontendBaseUrl + "/admin?kakaoLinked=0");
        }
    }

    // 연결 해제
    @PostMapping("/unlink")
    public ResponseEntity<?> unlink(Authentication authentication) {
        Member admin = getCurrentAdmin(authentication);
        kakaoNotificationService.unlinkAdminAccount(admin);
        return ResponseEntity.ok(Map.of("message", "카카오톡 알림 연결을 해제했습니다."));
    }
}
