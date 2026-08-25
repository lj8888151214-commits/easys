package com.easys.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        container.setMaxTextMessageBufferSize(10 * 1024 * 1024);
        container.setMaxBinaryMessageBufferSize(10 * 1024 * 1024);
        return container;
    }

    @Bean
    public SignalWebSocketHandler signalWebSocketHandler() {
        return new SignalWebSocketHandler();
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(signalWebSocketHandler(), "/signal")
                .setAllowedOriginPatterns("*");
    }

    public static class SignalWebSocketHandler extends TextWebSocketHandler {
        private static final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
        private final ObjectMapper objectMapper = new ObjectMapper();

        @Override
        public void afterConnectionEstablished(WebSocketSession session) throws Exception {
            // 닫힌 세션 정리
            sessions.entrySet().removeIf(entry -> !entry.getValue().isOpen());
            sessions.put(session.getId(), session);
            System.out.println("🟢 [WS 연결] ID: " + session.getId() + " | 총 인원: " + sessions.size());

            // 1. 발급된 본인 ID 전달
            session.sendMessage(new TextMessage("{\"type\":\"init\",\"myId\":\"" + session.getId() + "\"}"));

            // 2. 전체 참가자 목록 브로드캐스트
            broadcastUserList();
        }

        @Override
        protected void handleTextMessage(WebSocketSession session, TextMessage message) {
            try {
                String payload = message.getPayload();
                Map<String, Object> map = objectMapper.readValue(payload, Map.class);
                String target = (String) map.get("target");

                // 특정 대상에게 쏘는 1:1 시그널링 메시지 (Offer, Answer, Candidate)
                if (target != null && !target.isEmpty()) {
                    WebSocketSession targetSession = sessions.get(target);
                    if (targetSession != null && targetSession.isOpen()) {
                        targetSession.sendMessage(message);
                    }
                }
                // 전체 브로드캐스트 (request-stream, chat, stream-stopped 등)
                else {
                    for (WebSocketSession s : sessions.values()) {
                        if (s.isOpen() && !s.getId().equals(session.getId())) {
                            s.sendMessage(message);
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("메시지 처리 에러: " + e.getMessage());
            }
        }

        @Override
        public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
            sessions.remove(session.getId());
            System.out.println("🔴 [WS 종료] ID: " + session.getId() + " | 총 인원: " + sessions.size());
            broadcastUserList();
        }

        private void broadcastUserList() {
            sessions.entrySet().removeIf(entry -> !entry.getValue().isOpen());
            String usersJson = sessions.keySet().stream()
                    .map(id -> "\"" + id + "\"")
                    .collect(Collectors.joining(","));

            String payload = String.format("{\"type\":\"userList\",\"users\":[%s],\"count\":%d}", usersJson, sessions.size());
            TextMessage msg = new TextMessage(payload);

            for (WebSocketSession s : sessions.values()) {
                if (s.isOpen()) {
                    try {
                        s.sendMessage(msg);
                    } catch (IOException ignored) {}
                }
            }
        }
    }
}