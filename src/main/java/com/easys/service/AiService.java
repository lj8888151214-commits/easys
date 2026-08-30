package com.easys.service;

import org.springframework.stereotype.Service;

@Service
public class AiService {

    public String getAiResponse(String model, String message) {
        // 추후 각 AI 모델별 공식 SDK나 RestTemplate을 이용해 API Key와 함께 연동할 곳입니다.
        switch (model) {
            case "gemini":
                // Gemini API 호출 로직
                return "Gemini API 응답: " + message;
            case "gpt":
                // OpenAI API 호출 로직
                return "ChatGPT 응답: " + message;
            case "claude":
                // Claude API 호출 로직
                return "Claude 응답: " + message;
            default:
                return "지원하지 않는 AI 모델입니다.";
        }
    }
}