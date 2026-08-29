package com.easys.service;

import com.easys.config.TossPaymentProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

// =====================================================
// 토스페이먼츠 결제 승인 API 호출 전담 클라이언트.
//
// - secretKey는 이 클래스 안에서만 사용하고 절대 밖으로 내보내지 않는다.
// - 요청/응답을 문자열로 직접 다뤄서(RestTemplate의 자동 JSON 변환에
//   기대지 않고) Spring MVC 메시지 컨버터 구성과 무관하게 동작하도록 한다.
//   (이 프로젝트는 Jackson 3(tools.jackson) 기반이라, 기존 코드에서
//   이미 쓰고 있는 것과 동일한 ObjectMapper로 직접 파싱한다.)
// =====================================================

@Component
@RequiredArgsConstructor
public class TossPaymentClient {

    private static final String CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

    private final TossPaymentProperties tossPaymentProperties;
    private final RestTemplate restTemplate = new RestTemplate();

    // 결제 승인 요청. 성공하면 토스가 내려준 응답 JSON을 Map으로 반환한다.
    // (status: "DONE"이면 승인 성공, method: 카드/계좌이체 등)
    public Map<String, Object> confirm(String paymentKey, String orderId, int amount) {
        ObjectMapper objectMapper = new ObjectMapper();

        String requestBody = objectMapper.writeValueAsString(
                Map.of(
                        "paymentKey", paymentKey,
                        "orderId", orderId,
                        "amount", amount
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, "Basic " + encodeSecretKey());
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

        String responseBody;
        try {
            responseBody = restTemplate.exchange(
                    CONFIRM_URL,
                    HttpMethod.POST,
                    entity,
                    String.class
            ).getBody();
        } catch (RestClientResponseException e) {
            throw new IllegalArgumentException(
                    "토스페이먼츠 결제 승인에 실패했습니다: " + extractMessage(e.getResponseBodyAsString())
            );
        }

        return objectMapper.readValue(responseBody, new TypeReference<Map<String, Object>>() {});
    }

    private String encodeSecretKey() {
        String secretKey = tossPaymentProperties.getSecretKey();
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException(
                    "토스페이먼츠 시크릿 키(TOSS_SECRET_KEY)가 설정되지 않았습니다."
            );
        }
        // 토스는 시크릿 키를 아이디로, 비밀번호는 사용하지 않는다.
        // 비밀번호가 없다는 것을 나타내기 위해 시크릿 키 뒤에 콜론을 붙인다.
        return Base64.getEncoder().encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));
    }

    // 토스 에러 응답({"code":"...","message":"..."})에서 message만 뽑아본다.
    // 파싱에 실패하면 원본 응답을 그대로 보여준다.
    private String extractMessage(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return "알 수 없는 오류";
        }
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            Map<String, Object> body = objectMapper.readValue(
                    responseBody, new TypeReference<Map<String, Object>>() {}
            );
            Object message = body.get("message");
            return message == null ? responseBody : message.toString();
        } catch (Exception e) {
            return responseBody;
        }
    }
}
