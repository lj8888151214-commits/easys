package com.easys.config;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    // 비밀번호 암호화
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Spring Security 설정
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http

                // CSRF 비활성화
                .csrf(csrf -> csrf.disable())

                // CORS 설정
                .cors(cors -> cors
                        .configurationSource(corsConfigurationSource())
                )

                // URL 접근 권한 설정
                .authorizeHttpRequests(auth -> auth

                        // React의 OPTIONS 요청 허용
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()

                        // 메인
                        .requestMatchers(
                                "/"
                        ).permitAll()

                        // 로그인
                        .requestMatchers(
                                "/login"
                        ).permitAll()

                        // 회원가입
                        .requestMatchers(
                                HttpMethod.POST,
                                "/member"
                        ).permitAll()

                        .requestMatchers(
                                "/member/join"
                        ).permitAll()

                        // 이메일 인증
                        .requestMatchers(
                                "/email/**"
                        ).permitAll()

                        // 인증 관련 API
                        .requestMatchers(
                                "/auth/**"
                        ).permitAll()

                        // 정적 리소스
                        .requestMatchers(
                                "/css/**",
                                "/js/**",
                                "/images/**"
                        ).permitAll()

                        // 프로필 이미지
                        .requestMatchers(
                                "/profile-images/**"
                        ).permitAll()

                        // 오류 페이지
                        .requestMatchers(
                                "/error"
                        ).permitAll()

                        // 로그인한 사용자의 회원 정보
                        .requestMatchers(
                                "/member/me",
                                "/member/me/**"
                        ).authenticated()

                        // 스터디 조회
                        .requestMatchers(
                                HttpMethod.GET,
                                "/study",
                                "/study/**"
                        ).permitAll()

                        // 스터디룸 목록/상세/검색/리뷰 조회 (예약 전 누구나 볼 수 있어야 함)
                        .requestMatchers(
                                HttpMethod.GET,
                                "/study-rooms",
                                "/study-rooms/**"
                        ).permitAll()

                        // 스터디룸 예약 가능 시간 조회
                        .requestMatchers(
                                HttpMethod.GET,
                                "/reservations/availability"
                        ).permitAll()

                        // 커뮤니티 게시글 조회
                        .requestMatchers(
                                HttpMethod.GET,
                                "/community/posts",
                                "/community/posts/**"
                        ).permitAll()

                        // 관리자 전용 API (스터디룸/커뮤니티 관리 등)
                        .requestMatchers(
                                "/admin/**"
                        ).hasRole("ADMIN")

                        // 그 외 모든 요청은 로그인 필요
                        .anyRequest().authenticated()
                )

                // /api/** 요청은 로그인 페이지로 리다이렉트하지 않고
                // 401 JSON 응답을 그대로 내려준다.
                // (스터디룸/예약/리뷰 API는 프론트에서 절대경로로 직접 호출하므로
                //  실제 요청 경로에 /api 접두사가 그대로 남아있다)
                .exceptionHandling(exception -> exception
                        .defaultAuthenticationEntryPointFor(
                                (request, response, authException) -> {

                                    response.setStatus(
                                            HttpServletResponse.SC_UNAUTHORIZED
                                    );

                                    response.setContentType(
                                            "application/json;charset=UTF-8"
                                    );

                                    response.getWriter().write(
                                            "{\"message\":\"로그인이 필요합니다.\"}"
                                    );
                                },
                                PathPatternRequestMatcher.pathPattern("/api/**")
                        )
                        .defaultAccessDeniedHandlerFor(
                                (request, response, accessDeniedException) -> {

                                    response.setStatus(
                                            HttpServletResponse.SC_FORBIDDEN
                                    );

                                    response.setContentType(
                                            "application/json;charset=UTF-8"
                                    );

                                    response.getWriter().write(
                                            "{\"message\":\"관리자만 접근할 수 있습니다.\"}"
                                    );
                                },
                                PathPatternRequestMatcher.pathPattern("/api/**")
                        )
                )

                // 로그인 설정
                .formLogin(form -> form

                        // 로그인 처리 URL
                        .loginProcessingUrl("/login")

                        // 로그인 이메일 파라미터
                        .usernameParameter("username")

                        // 로그인 비밀번호 파라미터
                        .passwordParameter("password")

                        // 로그인 성공
                        .successHandler(
                                (request, response, authentication) -> {

                                    response.setStatus(
                                            HttpServletResponse.SC_OK
                                    );

                                    response.setContentType(
                                            "application/json;charset=UTF-8"
                                    );

                                    response.getWriter().write(
                                            "{\"message\":\"로그인 성공\"}"
                                    );
                                }
                        )

                        // 로그인 실패
                        .failureHandler(
                                (request, response, exception) -> {

                                    response.setStatus(
                                            HttpServletResponse.SC_UNAUTHORIZED
                                    );

                                    response.setContentType(
                                            "application/json;charset=UTF-8"
                                    );

                                    response.getWriter().write(
                                            "{\"message\":\"이메일 또는 비밀번호가 일치하지 않습니다.\"}"
                                    );
                                }
                        )

                        .permitAll()
                )

                // 로그아웃 설정
                .logout(logout -> logout

                        // 로그아웃 처리 URL
                        .logoutUrl("/logout")

                        // 로그아웃 성공
                        .logoutSuccessHandler(
                                (request, response, authentication) -> {

                                    response.setStatus(
                                            HttpServletResponse.SC_OK
                                    );

                                    response.setContentType(
                                            "application/json;charset=UTF-8"
                                    );

                                    response.getWriter().write(
                                            "{\"message\":\"로그아웃 성공\"}"
                                    );
                                }
                        )

                        .permitAll()
                );

        return http.build();
    }

    // CORS 설정
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        // React 개발 서버 허용
        configuration.setAllowedOriginPatterns(
                List.of(
                        "http://localhost:*",
                        "http://127.0.0.1:*",
                        "http://192.168.*.*:*",
                        "http://10.*.*.*:*"
                )
        );

        // 허용 HTTP Method
        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH",
                        "OPTIONS"
                )
        );

        // 허용 Header
        configuration.setAllowedHeaders(
                List.of("*")
        );

        // Cookie / Session 허용
        configuration.setAllowCredentials(true);

        // 모든 URL에 CORS 적용
        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}