package com.easys.service;

import com.easys.config.GeminiProperties;
import com.google.genai.Client;
import com.google.genai.errors.ApiException;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AiChatService {

    // EASYS AI 챗봇의 답변 범위를 웹 개발/학습 주제로 제한하고, 초보자가 이해하기 쉬운
    // 말로 설명하도록 안내하는 시스템 지침이다.
    // 1단계에서는 EASYS 실제 DB(멘토/스터디/캘린더 등)를 조회하지 않으므로, 그런 "실시간
    // 데이터"를 아는 것처럼 답하지 않도록 제한하되, "기능을 어떻게 쓰는지"에 대한 일반적인
    // 이용 방법 설명은 허용한다 (이 구분이 없으면 멘토링/캘린더 등 이용 방법을 묻는 질문에도
    // "지원하지 않는다"고 답해버려서 UX 개선 요구사항과 충돌한다).
    // 답변 길이를 기본적으로 짧게 유지하도록 지시하고, URL은 절대 언급하지 않게 한다 -
    // 기능 바로가기 버튼은 Gemini가 생성한 URL이 아니라, 프론트가 질문 키워드로 직접
    // 판단해 App.jsx의 실제 라우트로 연결한다(AiChatbot.jsx의 FEATURE_SHORTCUTS 참고).
    private static final String SYSTEM_INSTRUCTION =
            "당신은 EASYS 서비스의 학습 도우미 AI입니다. "
                    + "Java, Spring Boot, React, HTML, CSS, JavaScript, SQL, Git 등 "
                    + "웹 개발 및 프로그래밍 학습과 관련된 질문에 답변하세요. "
                    + "또한 EASYS 사이트의 멘토링, 캘린더, 스트리밍, 스터디 예약, 커뮤니티 "
                    + "기능을 어떻게 이용하는지 묻는 질문에도 일반적인 이용 절차를 설명해주세요. "
                    + "질문하는 사람은 프로그래밍을 처음 배우는 초보자일 수 있으니, "
                    + "지나치게 전문적인 용어는 피하고 쉽고 부드러운 말투로 설명하세요. "
                    + "그 외 웹 개발/EASYS 기능과 관련 없는 질문을 받으면, "
                    + "정중하게 지원 범위를 벗어난 질문이라고 안내하세요. "
                    + "\n\n"
                    + "답변 길이 규칙: 기본적으로 2~4문장 이내로 핵심만 간결하게 답하세요. "
                    + "질문에 대한 결론이나 답을 먼저 제시하고, 불필요하게 장황한 설명이나 "
                    + "같은 말 반복은 하지 마세요. 사용자가 \"자세히\", \"상세하게\", "
                    + "\"자세하게\", \"더 설명해줘\"처럼 긴 설명을 명시적으로 요청한 경우에만 "
                    + "여러 문단으로 자세히 답변하세요. "
                    + "\n\n"
                    + "당신은 EASYS의 실제 멘토 목록, 스터디 예약 현황, 캘린더 일정 같은 "
                    + "구체적인 실시간 데이터는 조회할 수 없습니다. 그런 구체적인 데이터를 "
                    + "아는 것처럼 답하지 마세요. 다만 그 기능을 어떻게 이용하는지에 대한 "
                    + "일반적인 절차 설명은 짧게 해도 됩니다. "
                    + "답변에 URL이나 링크 주소를 절대 포함하지 마세요 - 페이지 이동은 "
                    + "화면의 버튼으로 별도 제공됩니다.";

    private final GeminiProperties geminiProperties;

    private Client client;

    @PostConstruct
    private void init() {
        this.client = Client.builder()
                .apiKey(geminiProperties.getApiKey())
                .build();
    }

    public String ask(String message) {
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("질문 내용을 입력해주세요.");
        }

        GenerateContentConfig config = GenerateContentConfig.builder()
                .systemInstruction(Content.fromParts(Part.fromText(SYSTEM_INSTRUCTION)))
                .build();

        try {
            GenerateContentResponse response =
                    client.models.generateContent(geminiProperties.getModel(), message, config);
            return response.text();
        } catch (ApiException e) {
            if (e.code() == 429) {
                throw new IllegalStateException("지금 요청이 많아 잠시 후 다시 시도해주세요.", e);
            }
            throw new IllegalStateException("AI 응답을 가져오는 중 문제가 발생했습니다.", e);
        }
    }
}
