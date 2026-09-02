package com.easys.service;

import com.easys.config.WebSocketConfig;
import com.easys.entity.Reservation;
import com.easys.repository.EmailVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.easys.entity.EmailVerification;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;


@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    private final EmailVerificationRepository
            emailVerificationRepository;

    // 발신 주소는 application.properties의 spring.mail.username(환경변수 GMAIL_USERNAME)과
    // 동일한 값을 그대로 사용한다. 소스 코드에 실제 이메일 주소를 직접 넣지 않기 위함이다.
    @Value("${spring.mail.username}")
    private String senderEmail;


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


        message.setFrom(
                senderEmail
        );

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

    // =====================================================
    // 스터디룸 예약 결제 완료 알림
    //
    // 관리자(들)와 해당 스터디룸 사장님에게 "누가 언제 어느 스터디룸을
    // 예약/결제했는지" 알리고, 관리자 페이지에서 승인이 필요함을 안내한다.
    // 메일 발송에 실패해도 결제 확정 자체가 실패하면 안 되므로,
    // 예외를 잡아서 로그만 남기고 호출부로 전파하지 않는다.
    // =====================================================

    public void sendStudyReservationPaidNotification(
            Reservation reservation,
            List<String> adminEmails,
            String ownerEmail
    ) {

        Set<String> recipients = new LinkedHashSet<>();

        if (adminEmails != null) {
            recipients.addAll(adminEmails);
        }

        if (ownerEmail != null && !ownerEmail.isBlank()) {
            recipients.add(ownerEmail.trim());
        }

        if (recipients.isEmpty()) {
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();

            message.setFrom(senderEmail);
            message.setTo(recipients.toArray(new String[0]));
            message.setSubject("[Easys] 스터디룸 예약 결제 완료 - 승인이 필요합니다");
            message.setText(
                    reservation.getMember().getNickname()
                            + "님이 스터디룸 예약 결제를 완료했습니다.\n\n"
                            + "스터디룸 : " + reservation.getStudyRoom().getName()
                            + " (" + reservation.getStudyRoom().getLocation() + ")\n"
                            + "예약 날짜 : " + reservation.getReservationDate() + "\n"
                            + "예약 시간 : " + reservation.getStartTime() + " ~ " + reservation.getEndTime() + "\n"
                            + "예약 인원 : " + reservation.getPeopleCount() + "명\n"
                            + "결제 금액 : " + reservation.getTotalPrice() + "원\n\n"
                            + "관리자 페이지 > 스터디룸 예약 관리에서 내용을 확인하고 승인해주세요."
            );

            mailSender.send(message);
        } catch (Exception e) {
            log.warn("스터디룸 예약 결제 완료 알림 메일 발송 실패 (reservationId={})", reservation.getId(), e);
        }
    }

    // =====================================================
    // 스터디룸 예약 승인 완료 알림
    //
    // 관리자가 예약을 승인(CONFIRMED)하면 예약자 본인에게
    // 최종 확정 사실을 알린다. 메일 발송 실패가 승인 처리 자체를
    // 실패시키면 안 되므로 예외를 잡아서 로그만 남긴다.
    // =====================================================

    public void sendStudyReservationApprovedNotification(Reservation reservation) {

        String memberEmail = reservation.getMember().getEmail();

        if (memberEmail == null || memberEmail.isBlank()) {
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();

            message.setFrom(senderEmail);
            message.setTo(memberEmail);
            message.setSubject("[Easys] 스터디룸 예약이 승인되었습니다");
            message.setText(
                    reservation.getMember().getNickname()
                            + "님, 스터디룸 예약이 승인되어 확정되었습니다.\n\n"
                            + "스터디룸 : " + reservation.getStudyRoom().getName()
                            + " (" + reservation.getStudyRoom().getLocation() + ")\n"
                            + "예약 날짜 : " + reservation.getReservationDate() + "\n"
                            + "예약 시간 : " + reservation.getStartTime() + " ~ " + reservation.getEndTime() + "\n"
                            + "예약 인원 : " + reservation.getPeopleCount() + "명\n\n"
                            + "예약해주셔서 감사합니다."
            );

            mailSender.send(message);
        } catch (Exception e) {
            log.warn("스터디룸 예약 승인 알림 메일 발송 실패 (reservationId={})", reservation.getId(), e);
        }
    }

    // =====================================================
    // 관리자에 의한 스터디룸 예약 거절/취소 알림
    //
    // wasConfirmed=false면 승인 전 "거절", true면 이미 확정됐던 예약이
    // 카페 사정으로 "취소"된 것이다. 예약자 본인에게 그 사실을 알린다.
    // 메일 발송 실패가 처리 자체를 실패시키면 안 되므로 예외를 잡아서
    // 로그만 남긴다.
    // =====================================================

    public void sendStudyReservationCancelledByAdminNotification(Reservation reservation, boolean wasConfirmed) {

        String memberEmail = reservation.getMember().getEmail();

        if (memberEmail == null || memberEmail.isBlank()) {
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();

            String verb = verbLabel(wasConfirmed);

            message.setFrom(senderEmail);
            message.setTo(memberEmail);
            message.setSubject("[Easys] 스터디룸 예약이 " + verb + "되었습니다");
            message.setText(
                    reservation.getMember().getNickname()
                            + "님, 아쉽게도 스터디룸 예약이 " + verb + "되었습니다.\n\n"
                            + "스터디룸 : " + reservation.getStudyRoom().getName()
                            + " (" + reservation.getStudyRoom().getLocation() + ")\n"
                            + "예약 날짜 : " + reservation.getReservationDate() + "\n"
                            + "예약 시간 : " + reservation.getStartTime() + " ~ " + reservation.getEndTime() + "\n\n"
                            + (wasConfirmed
                                    ? "카페 사정으로 부득이하게 예약이 취소되었습니다. 불편을 드려 죄송합니다.\n\n"
                                    : "")
                            + "결제 취소(환불) 절차는 고객센터에서 별도로 안내드리겠습니다. 문의사항은 고객센터로 연락해주세요."
            );

            mailSender.send(message);
        } catch (Exception e) {
            log.warn("스터디룸 예약 {} 알림 메일 발송 실패 (reservationId={})", verbLabel(wasConfirmed), reservation.getId(), e);
        }
    }

    private String verbLabel(boolean wasConfirmed) {
        return wasConfirmed ? "취소" : "거절";
    }
}