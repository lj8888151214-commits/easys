package com.easys.service;

import com.easys.entity.Member;
import com.easys.entity.Payment;
import com.easys.entity.PaymentStatus;
import com.easys.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

// =====================================================
// 멘토링/스터디가 공통으로 사용하는 결제 서비스.
//
// 이 클래스는 MentoringReservation, StudyApplication 같은 도메인
// Entity를 전혀 알지 못한다 — Payment/토스 통신만 담당한다.
// 결제 승인 성공 후 "무엇을 더 해야 하는지"(캘린더 등록 등)는
// 각 도메인 서비스가 PaymentController를 통해 별도로 처리한다.
// =====================================================

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final TossPaymentClient tossPaymentClient;

    // =====================================================
    // 결제 승인
    //
    // - orderId로 서버에 미리 저장해둔 Payment를 조회해서, 프론트가 보낸
    //   금액이 아니라 서버에 저장된 실제 금액(payment.getAmount())을
    //   기준으로 토스에 승인을 요청한다 (금액 변조 방지).
    // - 이미 PAID 상태라면 토스 승인 API를 다시 호출하지 않고 그대로
    //   반환한다 (중복 결제/중복 호출 방지).
    // =====================================================

    public Payment confirmPayment(
            String orderId,
            String paymentKey,
            Integer clientAmount,
            Member member
    ) {
        if (orderId == null || orderId.isBlank() || paymentKey == null || paymentKey.isBlank()) {
            throw new IllegalArgumentException("결제 요청 정보가 올바르지 않습니다.");
        }

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("결제 정보를 찾을 수 없습니다."));

        if (!payment.getMember().getId().equals(member.getId())) {
            throw new IllegalArgumentException("본인이 신청한 결제만 진행할 수 있습니다.");
        }

        // 이미 결제가 완료된 주문이면(중복 승인 API 호출 등) 다시 토스에
        // 요청하지 않고 현재 상태를 그대로 반환한다.
        if (payment.getStatus() == PaymentStatus.PAID) {
            return payment;
        }

        if (clientAmount == null || !clientAmount.equals(payment.getAmount())) {
            throw new IllegalArgumentException("결제 금액이 일치하지 않습니다.");
        }

        Map<String, Object> tossResponse =
                tossPaymentClient.confirm(paymentKey, orderId, payment.getAmount());

        Object status = tossResponse.get("status");
        if (!"DONE".equals(status)) {
            payment.markFailed();
            throw new IllegalArgumentException("결제 승인에 실패했습니다. (상태: " + status + ")");
        }

        Object method = tossResponse.get("method");
        payment.markPaid(paymentKey, method == null ? null : method.toString());

        return payment;
    }
}
