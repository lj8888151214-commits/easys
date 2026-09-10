package com.easys.service;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

// AI 챗봇 2단계: Redis에 "세션(sessionId)별 대화 기록"을 저장하고 다시 꺼내는 역할.
//
// 1단계에서 만든 save()/find()(문자열 하나를 그대로 저장/조회)는 그대로 남겨뒀다 -
// 이번에 추가한 기능은 그것과 별개로, 대화 여러 턴을 리스트 형태로 관리한다.
//
// Redis에 저장되는 실제 모양(키: "chat:session:{sessionId}", Redis List 자료구조):
//   [0] {"role":"user","content":"내 이름은 홍길동이야."}
//   [1] {"role":"model","content":"반가워요 홍길동님! ..."}
//   [2] {"role":"user","content":"내 이름이 뭐라고 했지?"}
//   [3] {"role":"model","content":"홍길동님이라고 하셨어요."}
// role은 Gemini가 멀티턴 대화에서 쓰는 이름을 그대로 썼다: "user"(사람) / "model"(AI).
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatSessionService {

    public static final String ROLE_USER = "user";
    public static final String ROLE_MODEL = "model";

    private static final String KEY_PREFIX = "chat:session:";

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // 최근 몇 "턴"(질문 1개 + 답변 1개 = 1턴)까지 기억할지. application.properties의
    // chat.session.max-turns로 바꿀 수 있다.
    @Value("${chat.session.max-turns:10}")
    private int maxTurns;

    // 대화가 얼마 동안 조용하면 잊어버릴지(분). application.properties의
    // chat.session.ttl-minutes로 바꿀 수 있다.
    @Value("${chat.session.ttl-minutes:30}")
    private long ttlMinutes;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @ToString
    public static class ChatTurn {
        private String role;
        private String content;
    }

    // ----- 1단계에서 만든 최소 기능(문자열 저장/조회) - 그대로 유지 -----

    public void save(String key, String value) {
        redisTemplate.opsForValue().set(key, value);
    }

    public String find(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    // ----- 2단계: 세션별 대화 기록 -----

    // sessionId가 없으면(브라우저에서 처음 보낸 질문이면) 새로 하나 발급한다.
    public String resolveSessionId(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return UUID.randomUUID().toString();
        }
        return sessionId;
    }

    // 이 세션에 쌓인 대화를 오래된 순서 그대로 반환한다. 기록이 없거나 TTL이 지나
    // 이미 사라졌으면 빈 리스트를 반환한다(에러 아님 - "처음 대화하는 것"과 동일하게 처리).
    public List<ChatTurn> getHistory(String sessionId) {
        List<String> rawEntries = redisTemplate.opsForList().range(sessionKey(sessionId), 0, -1);
        if (rawEntries == null || rawEntries.isEmpty()) {
            return Collections.emptyList();
        }

        List<ChatTurn> history = new ArrayList<>(rawEntries.size());
        for (String raw : rawEntries) {
            try {
                history.add(objectMapper.readValue(raw, ChatTurn.class));
            } catch (Exception e) {
                log.warn("Redis 대화 기록 파싱 실패 (sessionId={}) - 이 항목은 건너뜀", sessionId, e);
            }
        }
        return history;
    }

    // 사용자가 실제로 입력한 질문을 이번 턴 기록으로 남긴다.
    public void appendUserMessage(String sessionId, String content) {
        append(sessionId, ROLE_USER, content);
    }

    // AI가 실제로 답한 내용을 이번 턴 기록으로 남긴다.
    public void appendModelMessage(String sessionId, String content) {
        append(sessionId, ROLE_MODEL, content);
    }

    private void append(String sessionId, String role, String content) {
        String redisKey = sessionKey(sessionId);
        String entry = objectMapper.writeValueAsString(new ChatTurn(role, content));

        redisTemplate.opsForList().rightPush(redisKey, entry);

        // 최근 N턴(=사용자+AI 메시지 합쳐서 N*2개)만 남기고 그보다 오래된 건 잘라낸다.
        long keepCount = (long) maxTurns * 2;
        redisTemplate.opsForList().trim(redisKey, -keepCount, -1);

        // 메시지가 오갈 때마다 TTL을 다시 걸어서 "마지막 대화로부터 N분" 동안만
        // 기억하게 한다(계속 대화 중이면 만료되지 않고, 조용해지면 자동으로 사라짐).
        redisTemplate.expire(redisKey, Duration.ofMinutes(ttlMinutes));
    }

    private String sessionKey(String sessionId) {
        return KEY_PREFIX + sessionId;
    }

    // 19단계: "문제 하나 내줘 → 어떤 과목? → java" 같은 흐름에서, 두 번째 턴이
    // 무엇을 기다리고 있는지 알아야 한다. 새 DB 테이블 없이 Redis에 세션과 같은
    // 키 규칙(chat:session:{sessionId}:pending)으로 "지금 대기 중인 상태 하나"만
    // 저장한다 - 대화 기록(List)과는 별개의 값(String)이라 기존 구조와 충돌하지
    // 않는다. TTL은 기존 대화 세션과 동일한 정책(chat.session.ttl-minutes)을 쓴다.
    //
    // 상태는 "한 번 쓰고 버리는" 용도로만 설계했다 - AiChatService가 이 상태를
    // 읽는 즉시 지우고, 이번 턴에 실제로 그 상태를 써야 하는지는 그 다음에
    // 판단한다. 그래서 상태가 여러 턴에 걸쳐 계속 남아 다른 명확한 질문을
    // 방해하는 일이 없다.
    private static final String PENDING_STATE_SUFFIX = ":pending";

    public void setPendingState(String sessionId, String state) {
        redisTemplate.opsForValue().set(
                sessionKey(sessionId) + PENDING_STATE_SUFFIX, state, Duration.ofMinutes(ttlMinutes)
        );
    }

    public String getPendingState(String sessionId) {
        return redisTemplate.opsForValue().get(sessionKey(sessionId) + PENDING_STATE_SUFFIX);
    }

    public void clearPendingState(String sessionId) {
        redisTemplate.delete(sessionKey(sessionId) + PENDING_STATE_SUFFIX);
    }

    // 19단계: "지금까지 대화 다 지워줘" 확인 후 실제 삭제에 쓴다. 이 세션의 대화
    // 기록과 대기 상태를 함께 지운다. member 격리는 이 메서드가 아니라 호출하는
    // 쪽(AiChatService)이 "이 sessionId가 지금 이 요청을 보낸 사용자의 것인지"를
    // 이미 프론트가 자신의 sessionId만 보내는 구조로 보장한다(로그인 사용자의
    // 영구 기록 삭제는 AiChatMessageRepository 쪽에서 member 기준으로 별도 처리).
    public void deleteHistory(String sessionId) {
        redisTemplate.delete(sessionKey(sessionId));
        clearPendingState(sessionId);
        clearPendingQuiz(sessionId);
    }

    // 20단계: "문제 하나만 내줘 → ②" 흐름에서 방금 낸 문제의 정답/해설을 기억해뒀다가,
    // 사용자가 답을 입력하면 그때 채점한다 - 새 DB 테이블을 만들지 않고 기존
    // pendingState(":pending")와 같은 방식으로 Redis에 "한 번 쓰고 버리는" 값
    // 하나만 더 둔다(대화 기록/대기 상태와는 다른 별도 키라 서로 충돌하지 않는다).
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @ToString
    public static class QuizPending {
        private String subjectLabel;
        // Qwen이 <<<ANSWER>>> 마커를 정상적으로 지켜서, 정답을 구조적으로 뽑아낼 수
        // 있었던 경우에만 채워진다. 실패했다면 null이고, 그때는 rawModelReply로만
        // 나중에(사용자가 답한 뒤) 한 번 더 판정을 맡긴다.
        private String correctOption;
        private String explanation;
        // 마커 파싱에 실패했을 때의 안전장치용 원문(정답 포함). 사용자에게는 절대
        // 그대로 보여주지 않고, 채점 시점에만 Qwen에게 문맥으로 전달한다.
        private String rawModelReply;
    }

    private static final String QUIZ_PENDING_SUFFIX = ":quizPending";

    public void setPendingQuiz(String sessionId, QuizPending quiz) {
        String json = objectMapper.writeValueAsString(quiz);
        redisTemplate.opsForValue().set(
                sessionKey(sessionId) + QUIZ_PENDING_SUFFIX, json, Duration.ofMinutes(ttlMinutes)
        );
    }

    public QuizPending getPendingQuiz(String sessionId) {
        String raw = redisTemplate.opsForValue().get(sessionKey(sessionId) + QUIZ_PENDING_SUFFIX);
        if (raw == null) {
            return null;
        }
        try {
            return objectMapper.readValue(raw, QuizPending.class);
        } catch (Exception e) {
            log.warn("Redis 퀴즈 채점 대기 상태 파싱 실패 (sessionId={}) - 이 상태는 건너뜀", sessionId, e);
            return null;
        }
    }

    public void clearPendingQuiz(String sessionId) {
        redisTemplate.delete(sessionKey(sessionId) + QUIZ_PENDING_SUFFIX);
    }

    // 20단계: 비로그인 사용자의 무료 체험 횟수. IP는 쓰지 않는다(같은 IP를 여러
    // 사람이 공유할 수 있음) - 대신 브라우저(localStorage)가 발급해 보내주는
    // guestId를 키로 쓰되, "몇 번 남았는지"는 클라이언트 값을 절대 믿지 않고
    // 이 서버/Redis의 카운터만 신뢰한다. 새 DB 테이블은 만들지 않는다.
    private static final String GUEST_USAGE_PREFIX = "chat:guest:usage:";

    public long incrementGuestUsage(String guestId, Duration ttl) {
        String key = GUEST_USAGE_PREFIX + guestId;
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1L) {
            redisTemplate.expire(key, ttl);
        }
        return count == null ? 1L : count;
    }

    public long getGuestUsage(String guestId) {
        String raw = redisTemplate.opsForValue().get(GUEST_USAGE_PREFIX + guestId);
        if (raw == null) {
            return 0L;
        }
        try {
            return Long.parseLong(raw);
        } catch (NumberFormatException e) {
            return 0L;
        }
    }
}
