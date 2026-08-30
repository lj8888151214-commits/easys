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
                .addInterceptors(new HttpSessionHandshakeInterceptor())
                .setAllowedOriginPatterns("*");
    }

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
        // 방 번호별로 세션 관리 (Key: roomId, Value: 세션맵)
        private static final Map<String, Map<String, WebSocketSession>> rooms = new ConcurrentHashMap<>();
        private static final Map<String, String> sessionRooms = new ConcurrentHashMap<>(); // 세션ID -> 방ID
        private static final Map<String, String> userNicknames = new ConcurrentHashMap<>();
        private final ObjectMapper objectMapper = new ObjectMapper();

        @Override
        public void afterConnectionEstablished(WebSocketSession session) throws Exception {
            // URL 쿼리에서 roomId 파싱 (예: /signal?roomId=123)
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

            String initialNick = (String) session.getAttributes().get("nickname");
            if (initialNick == null || initialNick.isBlank()) {
                initialNick = "게스트";
            }

            roomSessions.put(session.getId(), session);
            sessionRooms.put(session.getId(), roomId);
            userNicknames.put(session.getId(), initialNick);

            System.out.println("🟢 [WS 연결] 방: " + roomId + " | ID: " + session.getId() + " | 닉네임: " + initialNick);

            session.sendMessage(new TextMessage("{\"type\":\"init\",\"myId\":\"" + session.getId() + "\"}"));
            broadcastUserList(roomId);
        }

        @Override
        protected void handleTextMessage(WebSocketSession session, TextMessage message) {
            try {
                String payload = message.getPayload();
                Map<String, Object> map = objectMapper.readValue(payload, Map.class);
                String type = (String) map.get("type");
                String target = (String) map.get("target");
                String roomId = sessionRooms.get(session.getId());

                if ("join".equals(type)) {
                    String nickname = (String) map.get("nickname");
                    if (nickname != null && !nickname.isBlank() && !"게스트".equals(nickname)) {
                        userNicknames.put(session.getId(), nickname);
                    }
                    broadcastUserList(roomId);
                    return;
                }

                Map<String, WebSocketSession> roomSessions = rooms.get(roomId);
                if (roomSessions == null) return;

                if ("whisper".equals(type)) {
                    String targetId = (String) map.get("targetId");
                    if (targetId != null) {
                        WebSocketSession targetSession = roomSessions.get(targetId);
                        if (targetSession != null && targetSession.isOpen()) {
                            targetSession.sendMessage(message);
                        }
                    }
                    return;
                }

                if (target != null && !target.isBlank()) {
                    WebSocketSession targetSession = roomSessions.get(target);
                    if (targetSession != null && targetSession.isOpen()) {
                        targetSession.sendMessage(message);
                    }
                    return;
                }

                for (WebSocketSession s : roomSessions.values()) {
                    if (s.isOpen() && !s.getId().equals(session.getId())) {
                        s.sendMessage(message);
                    }
                }
            } catch (Exception e) {
                System.err.println("메시지 처리 에러: " + e.getMessage());
            }
        }

        @Override
        public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
            String roomId = sessionRooms.remove(session.getId());
            userNicknames.remove(session.getId());

            if (roomId != null && rooms.containsKey(roomId)) {
                rooms.get(roomId).remove(session.getId());

                // 🌟 방에 남은 사람이 0명이면 메모리(rooms)와 스트림 목록(StreamController)에서 완전 삭제
                if (rooms.get(roomId).isEmpty()) {
                    rooms.remove(roomId);
                    com.easys.controller.StreamController.removeStream(roomId);
                } else {
                    broadcastUserList(roomId);
                }
            }
            System.out.println("🔴 [WS 종료] ID: " + session.getId());
        }

        private void broadcastUserList(String roomId) {
            Map<String, WebSocketSession> roomSessions = rooms.get(roomId);
            if (roomSessions == null) return;

            List<Map<String, String>> userList = new ArrayList<>();
            for (Map.Entry<String, WebSocketSession> entry : roomSessions.entrySet()) {
                if (entry.getValue().isOpen()) {
                    userList.add(Map.of(
                            "id", entry.getKey(),
                            "nickname", userNicknames.getOrDefault(entry.getKey(), "게스트")
                    ));
                }
            }

            try {
                String payload = objectMapper.writeValueAsString(Map.of(
                        "type", "userList",
                        "users", userList,
                        "count", userList.size()
                ));
                TextMessage msg = new TextMessage(payload);

                for (WebSocketSession s : roomSessions.values()) {
                    if (s.isOpen()) {
                        try {
                            s.sendMessage(msg);
                        } catch (IOException ignored) {}
                    }
                }
            } catch (Exception e) {}
        }

        // 🌟 모든 클라이언트에게 실시간 방송 목록 전송 (클래스 내부로 정상 이동됨)
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
            } catch (Exception e) {
                System.err.println("StreamList 브로드캐스트 에러: " + e.getMessage());
            }
        }
    }
}