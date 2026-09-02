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

        private static final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

        private static final Map<String, Map<String, WebSocketSession>> rooms = new ConcurrentHashMap<>();
        private static final Map<String, String> sessionRooms = new ConcurrentHashMap<>();

        private static final Map<String, Map<String, WebSocketSession>> rooms = new ConcurrentHashMap<>();
        private static final Map<String, String> sessionRooms = new ConcurrentHashMap<>();

        private static final Map<String, String> userNicknames = new ConcurrentHashMap<>();

        // 🌟 방 생성 시각 및 최소 입장 인원 기록 맵
        private static final Map<String, Long> roomCreationTime = new ConcurrentHashMap<>();
        private static final Map<String, Boolean> hasUserEntered = new ConcurrentHashMap<>(); // 실제 유저가 들어온 적 있는지 체크

        private final ObjectMapper objectMapper = new ObjectMapper();

        @Override
        public void afterConnectionEstablished(WebSocketSession session) throws Exception {

            // 닫힌 세션 정리
            sessions.entrySet().removeIf(entry -> !entry.getValue().isOpen());
            userNicknames.entrySet().removeIf(entry -> !sessions.containsKey(entry.getKey()));

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


            // 🌟 최초 1회만 생성 시간 기록 (절대 putIfAbsent로 덮어씌워지지 않게 고정)
            if (!roomCreationTime.containsKey(roomId)) {
                roomCreationTime.put(roomId, System.currentTimeMillis());
            }

            Map<String, WebSocketSession> roomSessions = rooms.get(roomId);

            Map<String, WebSocketSession> roomSessions = rooms.get(roomId);


            String initialNick = (String) session.getAttributes().get("nickname");
            if (initialNick == null || initialNick.isBlank()) {
                initialNick = "게스트";
            }

            roomSessions.put(session.getId(), session);
            sessionRooms.put(session.getId(), roomId);
            userNicknames.put(session.getId(), initialNick);


            // 1. 발급된 본인 ID 전달

            // 🌟 세션이 안정적으로 1명 이상 유지되면 "유저가 정상 입장함"으로 마킹
            if (roomSessions.size() >= 1) {
                hasUserEntered.put(roomId, true);
            }


            session.sendMessage(new TextMessage("{\"type\":\"init\",\"myId\":\"" + session.getId() + "\"}"));

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

                    broadcastUserList();

                // 🌟 호스트가 스트리밍을 종료하거나 뒤로 갈 때 브로드캐스트 및 DB 삭제 수행
                // 🌟 호스트가 스트리밍 종료/뒤로가기로 인해 'stream-ended' 신호를 보낼 때
                if ("stream-ended".equals(type)) {
                    Map<String, WebSocketSession> roomSessions = rooms.get(roomId);
                    if (roomSessions != null) {
                        for (WebSocketSession s : roomSessions.values()) {
                            if (s.isOpen()) {
                                s.sendMessage(message);
                            }
                        }
                    }

                    // 🚀 소켓 통신 시점에서 확실하게 서버 내부에서 DB 삭제 요청 수행
                    if (roomId != null) {
                        try {
                            String backendUrl = "http://localhost:8080/api/streams/" + roomId;
                            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) new java.net.URL(backendUrl).openConnection();
                            conn.setRequestMethod("DELETE");
                            conn.setConnectTimeout(2000);
                            conn.setReadTimeout(2000);
                            int responseCode = conn.getResponseCode();
                            System.out.println("🗑️ [소켓 연동 DB 삭제] 방(" + roomId + ") 삭제 완료, 응답 코드: " + responseCode);
                        } catch (Exception e) {
                            System.err.println("⚠️ 소켓 기반 DB 방 삭제 실패: " + e.getMessage());
                        }
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
            } catch (Exception e) {}
        }

        @Override
        public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
            String roomId = sessionRooms.remove(session.getId());
            userNicknames.remove(session.getId());

            System.out.println("🔴 [WS 종료] ID: " + session.getId() + " | 총 인원: " + sessions.size());
            broadcastUserList();


            if (roomId != null && rooms.containsKey(roomId)) {
                Map<String, WebSocketSession> roomSessions = rooms.get(roomId);
                roomSessions.remove(session.getId());

                if (roomSessions.isEmpty()) {
                    // 방에 사람이 아예 없어진 경우 메모리에서만 방 제거 (DB 삭제는 프론트의 명시적 DELETE API에 위임)
                    rooms.remove(roomId);
                    roomCreationTime.remove(roomId);
                    hasUserEntered.remove(roomId);
                } else {
                    // 🌟 [중요] 누군가 나갔다고 해서 무조건 스트리밍을 종료시키지 않고,
                    // 현재 남아있는 사용자 목록만 갱신해 줍니다.
                    // (오직 호스트가 '스트리밍 종료'나 '뒤로가기'를 눌러서 명시적으로 신호를 보낼 때만
                    //  handleTextMessage의 "stream-ended"가 작동하여 게스트들이 튕겨 나갑니다.)
                    broadcastUserList(roomId);
                }
            }


            if (roomId != null && rooms.containsKey(roomId)) {
                rooms.get(roomId).remove(session.getId());

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
            } catch (Exception e) {}

        }
    }
}