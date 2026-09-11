package com.easys.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

// application.properties의 llm.base-url / llm.model 값을 주입받는다.
// 지금은 로컬 Ollama 서버(Qwen2.5 3B)를 가리키지만, 나중에 다른 서버/모델로 바꾸더라도
// 이 설정값만 바꾸면 되고 CustomLlmClient 코드는 그대로 둘 수 있다
// (GeminiProperties가 gemini.api-key/gemini.model을 담당하는 것과 같은 역할 - 서로 별개).
@Component
@ConfigurationProperties(prefix = "llm")
@Getter
@Setter
public class LlmProperties {

    private String baseUrl;
    private String model;

    // 16단계: 재현 테스트에서 온도(temperature)가 낮을수록 참고 지식과 무관한
    // 일반론으로 새는 빈도가 줄어드는 것을 확인해서 설정으로 뽑아둔다
    // (application.properties의 llm.temperature, 기본 0.4). null이면
    // CustomLlmClient가 Ollama 기본값을 그대로 쓴다(옵션 자체를 보내지 않음).
    private Double temperature;
}
