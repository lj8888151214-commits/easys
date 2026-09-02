package com.easys.service;

import com.easys.entity.EmailVerification;
import com.easys.repository.EmailVerificationRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final EmailVerificationRepository emailVerificationRepository;
    private final JavaMailSender mailSender;

    // application.properties의 발신자 계정 주입 (실제 값은 GMAIL_USERNAME 환경변수로 설정)
    @Value("${spring.mail.username}")
    private String fromEmail;

    /*
     * =====================================================
     * 인증번호 발송
     * =====================================================
     */
    @Transactional
    public void sendVerificationCode(String email) {

        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("이메일을 입력해주세요.");
        }

        email = email.trim();

        // 6자리 인증번호 생성
        String verificationCode = String.format("%06d", new Random().nextInt(1000000));

        // 인증번호 유효시간 5분
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(5);

        // DB에 인증정보 저장
        EmailVerification verification = new EmailVerification(
                email,
                verificationCode,
                expiresAt
        );

        emailVerificationRepository.save(verification);

        // 이메일 발송
        SimpleMailMessage message = new SimpleMailMessage();

        // ★ 핵심 해결: 발신자(From) 필수 지정
        message.setFrom(fromEmail.trim());
        message.setTo(email);
        message.setSubject("[EASYS] 이메일 인증번호");
        message.setText(
                "EASYS 회원가입 인증번호입니다.\n\n"
                        + "인증번호 : "
                        + verificationCode
                        + "\n\n"
                        + "인증번호는 5분 동안 유효합니다."
        );

        mailSender.send(message);
    }

    /*
     * =====================================================
     * 인증번호 확인
     * =====================================================
     */
    @Transactional
    public void verifyCode(String email, String verificationCode) {

        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("이메일을 입력해주세요.");
        }

        if (verificationCode == null || verificationCode.trim().isEmpty()) {
            throw new IllegalArgumentException("인증번호를 입력해주세요.");
        }

        email = email.trim();
        verificationCode = verificationCode.trim();

        // 가장 최근 인증번호 조회
        EmailVerification verification = emailVerificationRepository
                .findTopByEmailOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new IllegalArgumentException("인증번호를 먼저 요청해주세요."));

        // 이미 인증된 경우
        if (verification.isVerified()) {
            return;
        }

        // 인증번호 만료 확인
        if (LocalDateTime.now().isAfter(verification.getExpiresAt())) {
            throw new IllegalArgumentException("인증번호가 만료되었습니다. 다시 발송해주세요.");
        }

        // 인증번호 확인
        if (!verification.getVerificationCode().equals(verificationCode)) {
            throw new IllegalArgumentException("인증번호가 일치하지 않습니다.");
        }

        // 인증 완료
        verification.verify();

        // DB 반영
        emailVerificationRepository.save(verification);
    }
}