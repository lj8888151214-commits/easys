package com.easys.controller;

import com.easys.service.EmailVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/email")
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;


    /*
     * =====================================================
     * 인증번호 발송
     *
     * POST /email/send
     * =====================================================
     */
    @PostMapping("/send")
    public ResponseEntity<String> sendCode(
            @RequestBody Map<String, String> request
    ) {

        String email = request.get("email");

        emailVerificationService
                .sendVerificationCode(email);

        return ResponseEntity.ok(
                "인증번호가 이메일로 발송되었습니다."
        );
    }


    /*
     * =====================================================
     * 인증번호 확인
     *
     * POST /email/verify
     * =====================================================
     */
    @PostMapping("/verify")
    public ResponseEntity<String> verifyCode(
            @RequestBody Map<String, String> request
    ) {

        String email = request.get("email");

        String verificationCode =
                request.get("verificationCode");

        emailVerificationService
                .verifyCode(
                        email,
                        verificationCode
                );

        return ResponseEntity.ok(
                "이메일 인증이 완료되었습니다."
        );
    }
}

