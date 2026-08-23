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

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. CSRF 비활성화 (React 비동기 요청 필수)
                .csrf(csrf -> csrf.disable())

                // 2. CORS 허용
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 3. 요청 URL 권한 제어
                .authorizeHttpRequests(auth -> auth
                        // Preflight(OPTIONS) 통과
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 로그인, 회원가입, 메일인증 전체 허용
                        .requestMatchers(
                                "/",
                                "/login",
                                "/member",
                                "/member/**",
                                "/api/member",
                                "/api/member/**",
                                "/email/**",
                                "/api/email/**",
                                "/auth/**",
                                "/api/auth/**",
                                "/css/**",
                                "/js/**",
                                "/images/**",
                                "/error"
                        ).permitAll()

                        // 스터디 조회는 비로그인도 가능
                        .requestMatchers(HttpMethod.GET, "/study", "/study/**", "/api/study/**").permitAll()

                        // 나머지는 인증 필요
                        .anyRequest().authenticated()
                )

                // 4. Spring Security 기본 로그인 핸들러 (200 OK / 401 JSON 응답)
                .formLogin(form -> form
                        .loginProcessingUrl("/login")
                        .usernameParameter("username") // "email" -> "username" 으로 변경 (프론트와 일치)
                        .passwordParameter("password")
                        .successHandler((request, response, authentication) -> {
                            response.setStatus(HttpServletResponse.SC_OK);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"message\":\"로그인 성공\"}");
                        })
                        .failureHandler((request, response, exception) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"message\":\"이메일 또는 비밀번호가 일치하지 않습니다.\"}");
                        })
                        .permitAll()
                )

                // 5. 로그아웃 핸들러
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessHandler((request, response, authentication) -> {
                            response.setStatus(HttpServletResponse.SC_OK);
                        })
                        .permitAll()
                );

        return http.build();
    }

    // React(5173 포트) 통신을 위한 CORS 설정
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://127.0.0.1:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}