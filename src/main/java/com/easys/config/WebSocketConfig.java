package com.easys.config;

import com.easys.security.CustomUserDetails;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

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
                .addInterceptors(new HttpSessionHandshakeInterceptor()) // 🌟 세션에서 닉네임 자동 추출
                .setAllowedOriginPatterns("*");
    }

    // 🌟 핸드셰이크 시점에 Spring Security 세션에서 실제 로그인 닉네임/이메일 추출
    public static class HttpSessionHandshakeInterceptor implements HandshakeInterceptor {
        @Override
        public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                       WebSocketHandler wsHandler, Map<String, Object> attributes) {
            if (request instanceof ServletServerHttpRequest servletRequest) {
                HttpSession session = servletRequest.getServletRequest().getSession(false);
                if (session != null) {
                    SecurityContext context = (SecurityContext) session.getAttribute("SPRING_SECURITY_CONTEXT");
                    if (context != null && context.getAuthentication() != null) {
                        Authentication auth = context.getAuthentication();
                        if (auth.getPrincipal() instanceof CustomUserDetails userDetails) {
                            String nick = userDetails.getMember().getNickname();
                            attributes.put("nickname", nick != null ? nick : userDetails.getUsername());
                        } else {
                            attributes.put("nickname", auth.getName());
                        }
                    }
                }
            }
            return true;
        }

        @Override
        public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {}
    }

    public static class SignalWebSocketHandler extends TextWebSocketHandler {
        private static final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
        private static final Map<String, String> userNicknames = new ConcurrentHashMap<>();
        private final ObjectMapper objectMapper = new ObjectMapper();

        @Override
        public void afterConnectionEstablished(WebSocketSession session) throws Exception {
<<<<<<< Updated upstream
            // 닫힌 세션 정리
            sessions.entrySet().removeIf(entry -> !entry.getValue().isOpen());
            userNicknames.entrySet().removeIf(entry -> !sessions.containsKey(entry.getKey()));
=======
            String query = session.getUri().getQuery();
            String roomId = "default-room";
            if (query != null) {
                for (String param : query.split("&")) {
                    String[] kv = param.split("=");
                    if (kv.length == 2 && "roomId".equals(kv[0])) {
                        roomId = kv[1];
                    }
                }
            }

            rooms.putIfAbsent(roomId, new ConcurrentHashMap<>());
            Map<String, WebSocketSession> roomSessions = rooms.get(roomId);
>>>>>>> Stashed changes

            // 핸드셰이크 인터셉터에서 추출한 닉네임 우선 적용
            String initialNick = (String) session.getAttributes().get("nickname");
            if (initialNick == null || initialNick.isBlank()) {
                initialNick = "게스트";
            }

            sessions.put(session.getId(), session);
            userNicknames.put(session.getId(), initialNick);
            System.out.println("🟢 [WS 연결] ID: " + session.getId() + " | 닉네임: " + initialNick + " | 총 인원: " + sessions.size());

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
                String type = (String) map.get("type");
                String target = (String) map.get("target");

                // 🌟 클라이언트가 수동으로 보낸 닉네임 등록 처리
                if ("join".equals(type)) {
                    String nickname = (String) map.get("nickname");
                    if (nickname != null && !nickname.isBlank() && !"게스트".equals(nickname)) {
                        userNicknames.put(session.getId(), nickname);
                        System.out.println("👤 [닉네임 갱신] ID: " + session.getId() + " -> " + nickname);
                    }
                    broadcastUserList();
                    return;
                }

                // 1:1 시그널링 메시지
                if (target != null && !target.isEmpty()) {
                    WebSocketSession targetSession = sessions.get(target);
                    if (targetSession != null && targetSession.isOpen()) {
                        targetSession.sendMessage(message);
                    }
                }
                // 전체 브로드캐스트
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
            userNicknames.remove(session.getId());
<<<<<<< Updated upstream
            System.out.println("🔴 [WS 종료] ID: " + session.getId() + " | 총 인원: " + sessions.size());
            broadcastUserList();
=======

            if (roomId != null && rooms.containsKey(roomId)) {
                rooms.get(roomId).remove(session.getId());

                // 🌟 방에 남은 사람이 0명이면 메모리 맵에서만 안전하게 제거
                if (rooms.get(roomId).isEmpty()) {
                    rooms.remove(roomId);
                } else {
                    broadcastUserList(roomId);
                }
            }
            System.out.println("🔴 [WS 종료] ID: " + session.getId());
>>>>>>> Stashed changes
        }

        private void broadcastUserList() {
            sessions.entrySet().removeIf(entry -> !entry.getValue().isOpen());
            userNicknames.entrySet().removeIf(entry -> !sessions.containsKey(entry.getKey()));

            List<Map<String, String>> userList = new ArrayList<>();
            for (String id : sessions.keySet()) {
                userList.add(Map.of(
                        "id", id,
                        "nickname", userNicknames.getOrDefault(id, "게스트")
                ));
            }

            try {
                String payload = objectMapper.writeValueAsString(Map.of(
                        "type", "userList",
                        "users", userList,
                        "count", sessions.size()
                ));
                TextMessage msg = new TextMessage(payload);

                for (WebSocketSession s : sessions.values()) {
                    if (s.isOpen()) {
                        try {
                            s.sendMessage(msg);
                        } catch (IOException ignored) {}
                    }
                }
<<<<<<< Updated upstream
=======
            } catch (Exception e) {}
        }

        public static void broadcastStreamList(List<Map<String, Object>> streams) {
            try {
                String payload = new ObjectMapper().writeValueAsString(Map.of(
                        "type", "streamList",
                        "streams", streams
                ));
                TextMessage msg = new TextMessage(payload);

                for (Map<String, WebSocketSession> roomSessions : rooms.values()) {
                    for (WebSocketSession s : roomSessions.values()) {
                        if (s.isOpen()) {
                            try {
                                s.sendMessage(msg);
                            } catch (IOException ignored) {}
                        }
                    }
                }
>>>>>>> Stashed changes
            } catch (Exception e) {
                System.err.println("UserList 브로드캐스트 에러: " + e.getMessage());
            }
        }
    }
}