package com.easys.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

// application.properties의 gemini.api-key / gemini.model 값을 주입받는다.
// 실제 키 값은 환경변수(GOOGLE_API_KEY)로 관리하고, 코드에는 절대 하드코딩하지 않는다.
@Component
@ConfigurationProperties(prefix = "gemini")
@Getter
@Setter
public class GeminiProperties {

    private String apiKey;
    private String model;
}
