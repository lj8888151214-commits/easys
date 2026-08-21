package com.easys.controller;


import com.easys.dto.EmailSendDto;
import com.easys.dto.EmailVerifyDto;
import com.easys.entity.EmailVerification;
import com.easys.repository.EmailVerificationRepository;
import com.easys.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequiredArgsConstructor
@RequestMapping("/email")
public class EmailController {

    private final EmailService emailService;

    private final EmailVerificationRepository
            emailVerificationRepository;


    // ==========================================
    // 인증번호 보내기
    // ==========================================

    @PostMapping("/send")
    public ResponseEntity<String> sendEmail(
            @RequestBody EmailSendDto request
    ) {

        String email =
                request.getEmail().trim();


        if (email.isEmpty()) {

            return ResponseEntity
                    .badRequest()
                    .body("이메일을 입력해주세요.");
        }


        try {

            emailService.sendVerificationCode(
                    email
            );

            return ResponseEntity.ok(
                    "인증번호가 이메일로 전송되었습니다."
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body(
                            "이메일 전송 중 오류가 발생했습니다."
                    );
        }
    }


    // ==========================================
    // 인증번호 확인
    // ==========================================

    @PostMapping("/verify")
    public ResponseEntity<String> verifyEmail(
            @RequestBody EmailVerifyDto request
    ) {

        String email =
                request.getEmail().trim();

        String code =
                request.getVerificationCode().trim();


        // ==========================================
        // 인증번호 기록 찾기
        // ==========================================

        EmailVerification verification =
                emailVerificationRepository
                        .findTopByEmailOrderByCreatedAtDesc(
                                email
                        )
                        .orElse(null);


        if (verification == null) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "인증번호를 먼저 받아주세요."
                    );
        }


        // ==========================================
        // 이미 인증된 경우
        // ==========================================

        if (verification.isVerified()) {

            return ResponseEntity.ok(
                    "이미 이메일 인증이 완료되었습니다."
            );
        }


        // ==========================================
        // 인증번호 일치 확인
        // ==========================================

        if (!verification
                .getVerificationCode()
                .equals(code)) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "인증번호가 일치하지 않습니다."
                    );
        }


        // ==========================================
        // 인증번호 만료 확인
        // ==========================================

        if (verification.getExpiresAt()
                .isBefore(LocalDateTime.now())) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "인증번호가 만료되었습니다. 다시 받아주세요."
                    );
        }


        // ==========================================
        // 인증 완료
        // ==========================================

        verification.verify();

        emailVerificationRepository.save(
                verification
        );


        return ResponseEntity.ok(
                "이메일 인증이 완료되었습니다."
        );
    }
}