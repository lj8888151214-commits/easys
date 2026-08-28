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
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors
                        .configurationSource(corsConfigurationSource())
                )

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()
                        .requestMatchers(
                                "/signal",
                                "/signal/**"
                        ).permitAll()

                        .requestMatchers(
                                "/"
                        ).permitAll()

                        .requestMatchers(
                                "/login"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.POST,
                                "/member"
                        ).permitAll()

                        .requestMatchers(
                                "/member/join"
                        ).permitAll()

                        .requestMatchers(
                                "/api/calendar/personal",
                                "/api/calendar/personal/**",
                                "/api/study-groups",
                                "/api/study-groups/**"
                        ).authenticated()

                        .requestMatchers(
                                "/email/**"
                        ).permitAll()

                        .requestMatchers(
                                "/auth/**"
                        ).permitAll()

                        .requestMatchers(
                                "/css/**",
                                "/js/**",
                                "/images/**"
                        ).permitAll()

                        .requestMatchers(
                                "/profile-images/**"
                        ).permitAll()

                        .requestMatchers(
                                "/error"
                        ).permitAll()

                        .requestMatchers(
                                "/member/me",
                                "/member/me/**"
                        ).authenticated()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/study",
                                "/study/**"
                        ).permitAll()

                        .anyRequest().authenticated()
                )

                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"message\":\"로그인이 필요합니다.\"}");
                        })
                )

                .formLogin(form -> form
                        .loginProcessingUrl("/login")
                        .usernameParameter("username")
                        .passwordParameter("password")
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

                .logout(logout -> logout
                        .logoutUrl("/logout")
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

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOriginPatterns(
                List.of(
                        "http://localhost:5173",
                        "http://127.0.0.1:5173",
                        "http://192.168.*.*:*",
                        "http://10.*.*.*:*"
                )
        );

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

        configuration.setAllowedHeaders(
                List.of("*")
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}