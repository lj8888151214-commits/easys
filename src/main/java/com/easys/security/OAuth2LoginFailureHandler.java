package com.easys.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

// =====================================================
// 구글 로그인 실패 시에도 성공 시와 마찬가지로 구글이 브라우저를
// 백엔드 콜백 주소로 직접 이동시켜 놓은 상태이므로,
// 상대경로가 아닌 프론트엔드 절대 주소로 되돌려보내야 한다.
// =====================================================

@Component
public class OAuth2LoginFailureHandler implements AuthenticationFailureHandler {

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException {

        response.sendRedirect(frontendBaseUrl + "/login?error=google");
    }
}
