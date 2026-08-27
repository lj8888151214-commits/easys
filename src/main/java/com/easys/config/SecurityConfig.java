package com.easys.config;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    // =====================================================
    // 비밀번호 암호화
    // =====================================================

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // =====================================================
    // Spring Security 설정
    // =====================================================

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http

                // =====================================================
                // CSRF
                // =====================================================

                .csrf(csrf -> csrf.disable())

                // =====================================================
                // CORS
                // =====================================================

                .cors(cors -> cors
                        .configurationSource(corsConfigurationSource())
                )

                // =====================================================
                // URL 접근 권한
                // =====================================================

                .authorizeHttpRequests(auth -> auth

                        // React에서 발생하는 OPTIONS 요청 허용
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()

                        // =================================================
                        // 메인
                        // =================================================

                        .requestMatchers(
                                "/"
                        ).permitAll()

                        // =================================================
                        // 로그인
                        // =================================================

                        .requestMatchers(
                                "/login"
                        ).permitAll()

                        // =================================================
                        // 회원가입
                        // =================================================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/member"
                        ).permitAll()

                        .requestMatchers(
                                "/member/join"
                        ).permitAll()

                        // =================================================
                        // 이메일 인증
                        // =================================================

                        .requestMatchers(
                                "/email/**"
                        ).permitAll()

                        // =================================================
                        // 인증 관련 API
                        // =================================================

                        .requestMatchers(
                                "/auth/**"
                        ).permitAll()

                        // =================================================
                        // 정적 리소스
                        // =================================================

                        .requestMatchers(
                                "/css/**",
                                "/js/**",
                                "/images/**"
                        ).permitAll()

                        // =================================================
                        // 프로필 이미지
                        // =================================================

                        .requestMatchers(
                                "/profile-images/**"
                        ).permitAll()

                        // =================================================
                        // 오류 페이지
                        // =================================================

                        .requestMatchers(
                                "/error"
                        ).permitAll()

                        // =================================================
                        // 내 회원 정보
                        // =================================================
                        //
                        // GET    /member/me
                        // PUT    /member/me
                        // PUT    /member/me/password
                        //
                        // 로그인한 사용자만 접근
                        // =================================================

                        .requestMatchers(
                                "/member/me",
                                "/member/me/**"
                        ).authenticated()

                        // =================================================
                        // 스터디 조회
                        // =================================================
                        //
                        // 스터디 목록/상세는 로그인 없이 조회 가능
                        // =================================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/study",
                                "/study/**"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/mentor",
                                "/mentor/{mentorId}"
                        ).permitAll()

                        // 특정 멘토가 등록한 멘토링 목록 (멘토 찾기 화면에서 조회)
                        .requestMatchers(
                                HttpMethod.GET,
                                "/mentor/offerings/mentor/*"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/mentor/reservation/*/booked-dates"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/mentor/reviews/eligible/**"
                        ).authenticated()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/mentor/reviews/**"
                        ).permitAll()

                        // =================================================
                        // 그 외 모든 요청
                        // =================================================

                        .anyRequest().authenticated()
                )

                // =====================================================
                // 로그인
                // =====================================================

                .formLogin(form -> form

                        // React의 로그인 처리 요청
                        //
                        // React:
                        // POST /api/login
                        //
                        // Vite Proxy:
                        // POST /login
                        //
                        // Spring Security:
                        // POST /login
                        .loginProcessingUrl("/login")

                        // React에서 username이라는 이름으로
                        // 이메일을 보내므로 username 유지
                        .usernameParameter("username")

                        // 비밀번호
                        .passwordParameter("password")

                        // =================================================
                        // 로그인 성공
                        // =================================================
                        //
                        // 기존:
                        // /로 redirect
                        //
                        // 변경:
                        // React에게 200 응답만 전달
                        // =================================================

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

                        // =================================================
                        // 로그인 실패
                        // =================================================

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

                // =====================================================
                // 로그아웃
                // =====================================================

                .logout(logout -> logout

                        // React:
                        // POST /api/logout
                        //
                        // Vite Proxy:
                        // POST /logout
                        .logoutUrl("/logout")

                        // 로그아웃 성공 시 React에게 200 응답
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

    // =====================================================
    // CORS 설정
    // =====================================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        // =================================================
        // React 개발 서버 허용
        // =================================================

        configuration.setAllowedOriginPatterns(
                List.of(
                        "http://localhost:5173",
                        "http://127.0.0.1:5173",
                        "http://192.168.*.*:*",
                        "http://10.*.*.*:*"
                )
        );

        // =================================================
        // 허용 HTTP Method
        // =================================================

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

        // =================================================
        // 허용 Header
        // =================================================

        configuration.setAllowedHeaders(
                List.of("*")
        );

        // =================================================
        // Session / Cookie 허용
        // =================================================

        configuration.setAllowCredentials(true);

        // =================================================
        // CORS 적용
        // =================================================

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}
