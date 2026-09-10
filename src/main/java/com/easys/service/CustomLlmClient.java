package com.easys.service;

import com.easys.config.LlmProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

// =====================================================
// 우리가 로컬에 띄운 Ollama(Qwen2.5 3B) 서버를 호출하는 전담 클라이언트.
//
// TossPaymentClient.java와 똑같은 방식을 따른다 - 요청/응답을 문자열로 직접
// 다뤄서(RestTemplate의 자동 JSON 변환에 기대지 않고) 이 프로젝트가 이미 쓰고 있는
// ObjectMapper(tools.jackson)로 직접 만들고 파싱한다.
//
// 8단계: AiChatService가 이 클래스를 통해 실제로 Qwen을 사용한다. Redis에서 꺼낸
// 이전 대화 기록까지 함께 보낼 수 있도록 messages 리스트를 받는 ask()를 추가했다
// (질문 하나만 보내던 7단계의 ask(String)는 그대로 남겨뒀고, 내부적으로 이 리스트
// 버전을 재사용한다). Gemini(AiChatService의 generate())는 이 클래스와 무관하게
// 코드는 그대로 남아있다 - 되돌리고 싶으면 AiChatService에서 부르는 메서드만 바꾸면 된다.
// =====================================================
@Slf4j
@Component
@RequiredArgsConstructor
public class CustomLlmClient {

    // 로컬 모델이 아직 메모리에 안 올라와 있으면 처음 한 번은 로딩에만 수십 초가
    // 걸릴 수 있다. 기본 RestTemplate의 타임아웃에 기대지 않고 넉넉하게 직접 정한다.
    private static final int CONNECT_TIMEOUT_MS = 5_000;    // 로컬 서버라 연결 자체는 금방 됨
    private static final int READ_TIMEOUT_MS = 120_000;     // 모델 최초 로딩 + 답변 생성 시간 고려

    private final LlmProperties llmProperties;
    private final RestTemplate restTemplate = buildRestTemplate();

    // Ollama /api/chat에 질문 하나만 보내고, 답변 텍스트(message.content)만 꺼내서 반환한다.
    // (이전 대화 없이 단발성으로 물어볼 때 쓴다)
    public String ask(String message) {
        return ask(List.of(Map.of("role", "user", "content", message)));
    }

    // Ollama /api/chat에 여러 턴의 대화(messages)를 통째로 보내고, 마지막 답변 텍스트만
    // 꺼내서 반환한다. messages는 오래된 것부터 순서대로 담아야 한다 -
    // 예: [{"role":"user",...}, {"role":"assistant",...}, {"role":"user",...(이번 질문)}]
    public String ask(List<Map<String, String>> messages) {
        ObjectMapper objectMapper = new ObjectMapper();

        Map<String, Object> requestPayload = new java.util.HashMap<>();
        requestPayload.put("model", llmProperties.getModel());
        requestPayload.put("messages", messages);
        requestPayload.put("stream", false);
        // 16단계: 온도가 낮을수록 참고 지식과 무관한 일반론(그리고 그 과정에서
        // 섞여 나오는 한자/가나)으로 새는 빈도가 줄어드는 것을 재현 테스트로
        // 확인했다. 설정이 없으면(null) 옵션 자체를 보내지 않아 Ollama 기본값을
        // 그대로 쓴다.
        if (llmProperties.getTemperature() != null) {
            requestPayload.put("options", Map.of("temperature", llmProperties.getTemperature()));
        }

        String requestBody = objectMapper.writeValueAsString(requestPayload);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

        String url = llmProperties.getBaseUrl() + "/api/chat";

        String responseBody;
        long startedAt = System.currentTimeMillis();
        try {
            responseBody = restTemplate.exchange(url, HttpMethod.POST, entity, String.class).getBody();
            log.info("Ollama({}) 응답 시간: {}ms (messages={})",
                    llmProperties.getModel(), System.currentTimeMillis() - startedAt, messages.size());
        } catch (RestClientException e) {
            // Ollama가 아예 안 떠 있어서 연결 자체가 안 되는 경우(RestClientResponseException이
            // 아닌 경우)에는 응답 본문이 없으므로 e.getMessage()를 대신 사용한다.
            String detail = e instanceof RestClientResponseException responseException
                    ? responseException.getResponseBodyAsString()
                    : e.getMessage();
            throw new IllegalStateException("Ollama 서버 호출에 실패했습니다: " + detail, e);
        }

        Map<String, Object> response = objectMapper.readValue(
                responseBody, new TypeReference<Map<String, Object>>() {}
        );

        @SuppressWarnings("unchecked")
        Map<String, Object> responseMessage = (Map<String, Object>) response.get("message");
        return (String) responseMessage.get("content");
    }

    private static RestTemplate buildRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return new RestTemplate(factory);
    }
}
