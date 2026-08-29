package com.easys.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "payment")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentProductType productType;

    @Column(nullable = false)
    private Long targetId;

    // 토스페이먼츠 주문번호. 서버에서 생성하며 중복되지 않아야 한다.
    @Column(nullable = false, unique = true, length = 100)
    private String orderId;

    // 결제창에 표시할 상품명 (예: "홍길동 멘토링")
    @Column(nullable = false, length = 200)
    private String orderName;

    // 토스 결제 승인 성공 후에만 채워진다.
    @Column(length = 200)
    private String paymentKey;

    // 토스 결제 승인 응답의 결제수단 (카드/계좌이체 등). 승인 전에는 null.
    @Column(length = 50)
    private String paymentMethod;

    @Column(nullable = false)
    private Integer amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status;

    @Column
    private LocalDateTime paidAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Payment(
            Member member,
            PaymentProductType productType,
            Long targetId,
            Integer amount,
            String orderName
    ) {
        this.member = member;
        this.productType = productType;
        this.targetId = targetId;
        this.amount = amount;
        this.orderName = orderName;
        this.orderId = generateOrderId(productType, targetId);
        this.status = PaymentStatus.READY;
        this.createdAt = LocalDateTime.now();
    }

    // 서비스 종류 + 대상 id + 랜덤값을 조합해 사람이 봐도 어떤 결제인지
    // 짐작 가능하면서도 중복될 일이 없는 주문번호를 만든다.
    private String generateOrderId(PaymentProductType productType, Long targetId) {
        String random = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        return productType.name() + "-" + targetId + "-" + random;
    }

    // 실제 토스 결제 승인(status=DONE) 성공 후에만 호출되어야 한다.
    public void markPaid(String paymentKey, String paymentMethod) {
        this.paymentKey = paymentKey;
        this.paymentMethod = paymentMethod;
        this.status = PaymentStatus.PAID;
        this.paidAt = LocalDateTime.now();
    }

    // 토스 승인 API 호출이 실패했을 때(정상 응답이지만 status != DONE 등).
    public void markFailed() {
        this.status = PaymentStatus.FAILED;
    }

    public void cancel() {
        this.status = PaymentStatus.CANCELLED;
    }
}
