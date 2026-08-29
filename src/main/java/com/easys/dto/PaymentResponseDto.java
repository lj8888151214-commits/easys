package com.easys.dto;

import com.easys.entity.Payment;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class PaymentResponseDto {

    private final Long id;
    private final String productType;
    private final Long targetId;
    private final String orderId;
    private final String orderName;
    private final Integer amount;
    private final String status;
    private final String paymentMethod;
    private final LocalDateTime paidAt;

    public PaymentResponseDto(Payment payment) {
        this.id = payment.getId();
        this.productType = payment.getProductType().name();
        this.targetId = payment.getTargetId();
        this.orderId = payment.getOrderId();
        this.orderName = payment.getOrderName();
        this.amount = payment.getAmount();
        this.status = payment.getStatus().name();
        this.paymentMethod = payment.getPaymentMethod();
        this.paidAt = payment.getPaidAt();
    }
}
