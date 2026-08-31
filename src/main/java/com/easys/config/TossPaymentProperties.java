package com.easys.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

// application.properties의 toss.client-key / toss.secret-key 값을 주입받는다.
// 실제 값은 환경변수(TOSS_CLIENT_KEY / TOSS_SECRET_KEY)로 관리하고,
// 코드에는 절대 실제 키를 하드코딩하지 않는다.
@Component
@ConfigurationProperties(prefix = "toss")
@Getter
@Setter
public class TossPaymentProperties {

    private String clientKey;
    private String secretKey;
}
