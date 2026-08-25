package com.easys.service;

import com.easys.config.WebSocketConfig;
import com.easys.repository.EmailVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.easys.entity.EmailVerification;

import java.security.SecureRandom;
import java.time.LocalDateTime;


@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    private final EmailVerificationRepository
            emailVerificationRepository;


    @Transactional
    public void sendVerificationCode(String email) {

        email = email.trim();


        // ==========================================
        // 6자리 인증번호 생성
        // ==========================================

        SecureRandom random =
                new SecureRandom();

        String verificationCode =
                String.format(
                        "%06d",
                        random.nextInt(1_000_000)
                );


        // ==========================================
        // 5분 후 만료
        // ==========================================

        LocalDateTime expiresAt =
                LocalDateTime.now()
                        .plusMinutes(5);


        // ==========================================
        // 새로운 인증 기록 생성
        //
        // 중요!
        // 새 인증번호를 발급하면
        // verified = false부터 시작
        // ==========================================

        EmailVerification verification =
                new EmailVerification(
                        email,
                        verificationCode,
                        expiresAt
                );


        emailVerificationRepository.save(
                verification
        );


        // ==========================================
        // 이메일 전송
        // ==========================================

        SimpleMailMessage message =
                new SimpleMailMessage();


        message.setTo(email);

        message.setSubject(
                "[Easys] 이메일 인증번호"
        );

        message.setText(
                "Easys 회원가입 인증번호입니다.\n\n"
                        + "인증번호 : "
                        + verificationCode
                        + "\n\n"
                        + "인증번호는 5분 동안 유효합니다."
        );


        mailSender.send(message);
    }
}