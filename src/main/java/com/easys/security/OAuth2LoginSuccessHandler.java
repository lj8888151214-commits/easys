package com.easys.security;

import com.easys.entity.Member;
import com.easys.repository.MemberRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Component;

import java.io.IOException;

// =====================================================
// 구글 로그인 직후, SecurityContext의 인증 주체를 OAuth2User에서
// 이 프로젝트 전역에서 쓰는 CustomUserDetails로 바꿔치기한다.
//
// 이렇게 하지 않으면 /api/login(폼 로그인)으로 들어온 사용자와
// 구글로 들어온 사용자의 Authentication 타입이 달라져서,
// StudyController 등에서 쓰는 @AuthenticationPrincipal CustomUserDetails가
// 구글 로그인 사용자에 대해서는 null이 되어버린다.
// =====================================================

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final MemberRepository memberRepository;

    private final SecurityContextRepository securityContextRepository =
            new HttpSessionSecurityContextRepository();

    // 구글 콜백은 브라우저를 실제로 백엔드(예: localhost:8080)로 이동시키므로,
    // 이후 리다이렉트는 상대경로가 아니라 프론트엔드 절대 주소로 보내야 한다.
    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        // provider.google.user-name-attribute=email 설정으로
        // getName()이 구글 sub 대신 이메일을 반환한다.
        String email = oAuth2User.getName();

        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException(
                        "구글 로그인 처리 중 회원 정보를 찾을 수 없습니다: " + email
                ));

        CustomUserDetails userDetails = new CustomUserDetails(member);

        UsernamePasswordAuthenticationToken newAuth =
                new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(newAuth);

        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);

        // 구글이 방금 브라우저를 백엔드 콜백 주소로 이동시켰으므로,
        // 상대경로가 아닌 프론트엔드 절대 주소로 되돌려보내야 한다.
        response.sendRedirect(frontendBaseUrl + "/");
    }
}
