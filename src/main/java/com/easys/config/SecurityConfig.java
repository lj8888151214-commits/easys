package com.easys.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    // 비밀번호 암호화 도구
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // 1. 로그인 없이 접근 가능한 공개 URL (컨트롤러 매핑 경로 + 정적 리소스)
                        .requestMatchers(
                                "/",                // 메인 홈 화면 (GET /)
                                "/login",            // 로그인 화면 (GET /login)
                                "/member/join",      // 회원가입 화면 (GET /member/join)
                                "/member",           // 회원가입 API (POST /member)
                                "/email/**",         // 이메일 인증 API
                                "/css/**",           // static/css 폴더
                                "/js/**",            // static/js 폴더
                                "/images/**"         // static/images 폴더 (jpg, png 등)
                        ).permitAll()

                        // 2. 그 외 모든 요청(예: /cam, /member/me 등)은 로그인 필수
                        .anyRequest().authenticated()
                )
                .formLogin(form -> form
                        .loginPage("/login")                 // 컨트롤러 매핑된 로그인 페이지 URL
                        .loginProcessingUrl("/login")        // 로그인 form의 action 경로 (Spring Security 처리)
                        .defaultSuccessUrl("/", true)        // 로그인 성공 시 이동 경로
                        .failureUrl("/login?error=true")     // 로그인 실패 시 이동 경로
                        .permitAll()
                )
                .logout(logout -> logout
                        .logoutUrl("/logout")                // 로그아웃 요청 URL
                        .logoutSuccessUrl("/")               // 로그아웃 성공 시 메인 화면으로 이동
                        .permitAll()
                );

        int a;
        return http.build();
    }
}