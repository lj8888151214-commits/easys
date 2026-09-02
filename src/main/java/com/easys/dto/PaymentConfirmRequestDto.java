package com.easys.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

// 토스 결제창에서 successUrl로 리다이렉트되며 전달되는 값들을
// 프론트가 그대로 서버에 전달할 때 사용하는 요청 DTO.
@Getter
@NoArgsConstructor
public class PaymentConfirmRequestDto {

    private String orderId;
    private String paymentKey;
    private Integer amount;
}
