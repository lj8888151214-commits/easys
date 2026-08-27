package com.easys.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 로그인 필요 / 존재하지 않음 / 권한 없음 등
    // 서비스에서 던지는 IllegalArgumentException을
    // 원래 메시지가 담긴 JSON 응답으로 변환
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(
            IllegalArgumentException exception
    ) {

        HttpStatus status =
                "로그인이 필요합니다.".equals(exception.getMessage())
                        ? HttpStatus.UNAUTHORIZED
                        : HttpStatus.BAD_REQUEST;

        return ResponseEntity
                .status(status)
                .body(Map.of("message", exception.getMessage()));
    }
}
