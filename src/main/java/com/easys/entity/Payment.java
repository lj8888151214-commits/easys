package com.easys.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
            Integer amount
    ) {
        this.member = member;
        this.productType = productType;
        this.targetId = targetId;
        this.amount = amount;
        this.status = PaymentStatus.READY;
        this.createdAt = LocalDateTime.now();
    }

    public void markPaid() {
        this.status = PaymentStatus.PAID;
        this.paidAt = LocalDateTime.now();
    }

    public void cancel() {
        this.status = PaymentStatus.CANCELLED;
    }
}
