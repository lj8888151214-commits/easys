package com.easys.service;

import java.util.List;

// 12단계(RAG): EASYS의 실제 기능/정책 정보를 담는 지식 한 단위.
//
// System Prompt(AI의 행동 규칙) / Knowledge(EASYS 실제 기능·정책 정보) / Redis(이전 대화)
// 세 가지 역할을 분리하기 위해 만들었다 - "EASYS 기능이 바뀌면 여기 content만 고치면
// 되고, AiChatService의 행동 규칙은 안 건드려도 된다"가 목표다.
//
// keywords는 지금은 EasysKnowledgeService가 payment 판단에만 직접 쓰지만(다른 카테고리는
// 이미 검증된 FeatureIntentClassifier의 분류 결과를 그대로 재사용), 나중에 지식이
// 늘어나서 범용 키워드 검색으로 바꾸고 싶을 때도 이 필드 하나로 확장할 수 있다.
public record EasysKnowledge(
        String category,
        String title,
        String content,
        List<String> keywords
) {
}
