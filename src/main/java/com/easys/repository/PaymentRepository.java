package com.easys.repository;

import com.easys.entity.Payment;
import com.easys.entity.PaymentProductType;
import com.easys.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    boolean existsByProductTypeAndTargetId(
            PaymentProductType productType,
            Long targetId
    );

    boolean existsByProductTypeAndTargetIdAndStatus(
            PaymentProductType productType,
            Long targetId,
            PaymentStatus status
    );

    Optional<Payment> findByProductTypeAndTargetId(
            PaymentProductType productType,
            Long targetId
    );

    // 토스 결제 승인(confirm) 요청은 orderId로 어떤 결제인지 식별한다.
    Optional<Payment> findByOrderId(String orderId);

    void deleteByProductTypeAndTargetIdIn(
            PaymentProductType productType,
            Collection<Long> targetIds
    );
}
