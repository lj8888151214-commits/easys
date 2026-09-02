package com.easys.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class CamSignalService {

    // 실시간 웹소켓 세션 목록 (ID -> Session)
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // 1. 세션 연결 및 초기 ID 발급 + 전체 인원 갱신 브로드캐스트
    public void registerSession(WebSocketSession session) throws IOException {
        sessions.put(session.getId(), session);
        log.info(">>> [캠 접속] Session ID: {}, 현재 총 접속자: {}명", session.getId(), sessions.size());

        // 본인에게 초기 myId 전송
        Map<String, Object> initMsg = Map.of(
                "type", "init",
                "myId", session.getId()
        );
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(initMsg)));

        // 전체 방 참여자에게 유저 리스트 브로드캐스트
        broadcastUserList();
    }

    // 2. 메시지 라우팅 (1:1 WebRTC 시그널링 vs 전체 브로드캐스트)
    public void handleSignalMessage(WebSocketSession session, String payload) throws IOException {
        Map<String, Object> data = objectMapper.readValue(payload, Map.class);
        String target = (String) data.get("target");

        // 1:1 시그널링 (offer, answer, candidate, request-stream)
        if (target != null && sessions.containsKey(target)) {
            WebSocketSession targetSession = sessions.get(target);
            if (targetSession != null && targetSession.isOpen()) {
                targetSession.sendMessage(new TextMessage(payload));
            }
        }
        // 전체 브로드캐스트 (chat, stream-stopped 등)
        else {
            for (WebSocketSession s : sessions.values()) {
                if (s.isOpen() && !s.getId().equals(session.getId())) {
                    s.sendMessage(new TextMessage(payload));
                }
            }
        }
    }

    // 3. 세션 종료 처리
    public void removeSession(WebSocketSession session) throws IOException {
        sessions.remove(session.getId());
        log.info(">>> [캠 퇴장] Session ID: {}, 남은 접속자: {}명", session.getId(), sessions.size());
        broadcastUserList();
    }

    // 전체 참여자 목록 전송 (화면 슬롯 개수 동기화)
    public void broadcastUserList() throws IOException {
        List<String> userList = new ArrayList<>(sessions.keySet());
        Map<String, Object> listMsg = Map.of(
                "type", "userList",
                "users", userList
        );
        TextMessage textMessage = new TextMessage(objectMapper.writeValueAsString(listMsg));

        for (WebSocketSession s : sessions.values()) {
            if (s.isOpen()) {
                s.sendMessage(textMessage);
            }
        }
    }

    // 현재 접속 인원수 조회
    public int getConnectedUserCount() {
        return sessions.size();
    }
}