package com.easys.controller;

import com.easys.dto.PaymentConfirmRequestDto;
import com.easys.dto.PaymentResponseDto;
import com.easys.entity.Member;
import com.easys.entity.Payment;
import com.easys.entity.PaymentProductType;
import com.easys.repository.MemberRepository;
import com.easys.repository.PaymentRepository;
import com.easys.service.MentoringReservationService;
import com.easys.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// =====================================================
// 멘토링/스터디가 공통으로 사용하는 결제 API.
//
// 결제 승인 자체는 PaymentService(도메인 무관)가 처리하고,
// 승인 성공 이후 "무엇을 확정해야 하는지"는 이 컨트롤러가
// productType을 보고 해당 도메인 서비스에 위임한다.
// (PaymentService는 MentoringReservationService를 알지 못한다.)
// =====================================================

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final MemberRepository memberRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;
    private final MentoringReservationService mentoringReservationService;

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

    // =====================================================
    // 멘토링 예약에 연결된 결제 정보 조회
    // (결제 페이지가 상품명/금액을 표시하기 위해 사용)
    // GET /payments/mentoring/{reservationId}
    // =====================================================

    @GetMapping("/mentoring/{reservationId}")
    public ResponseEntity<?> getMentoringPayment(
            Authentication authentication,
            @PathVariable Long reservationId
    ) {
        try {
            Member member = getCurrentMember(authentication);

            Payment payment = paymentRepository
                    .findByProductTypeAndTargetId(PaymentProductType.MENTORING, reservationId)
                    .orElseThrow(() -> new IllegalArgumentException("결제 정보를 찾을 수 없습니다."));

            if (!payment.getMember().getId().equals(member.getId())) {
                throw new IllegalArgumentException("본인의 결제 정보만 조회할 수 있습니다.");
            }

            return ResponseEntity.ok(new PaymentResponseDto(payment));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // =====================================================
    // 토스 결제 승인 확정
    // POST /payments/confirm
    //
    // 성공하면 결제 status가 PAID로 바뀌고, 상품 종류에 따라
    // 해당 도메인의 "결제 확정 후 처리"(캘린더 등록 등)를 이어서 수행한다.
    // =====================================================

    @PostMapping("/confirm")
    public ResponseEntity<?> confirmPayment(
            Authentication authentication,
            @RequestBody PaymentConfirmRequestDto request
    ) {
        try {
            Member member = getCurrentMember(authentication);

            Payment payment = paymentService.confirmPayment(
                    request.getOrderId(),
                    request.getPaymentKey(),
                    request.getAmount(),
                    member
            );

            if (payment.getProductType() == PaymentProductType.MENTORING) {
                mentoringReservationService.onMentoringPaymentConfirmed(payment.getTargetId());
            }
            // STUDY는 아직 결제와 연결되어 있지 않으므로(추후 연동 예정) 처리하지 않는다.

            return ResponseEntity.ok(new PaymentResponseDto(payment));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
