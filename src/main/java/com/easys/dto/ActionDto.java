package com.easys.dto;

// 17단계: AI 답변에 여러 개의 EASYS 기능 바로가기를 붙일 수 있도록 도입.
// LLM(Qwen)은 절대 URL/경로를 직접 만들지 않는다 - 여기서는 실제 경로가 아니라
// "어떤 기능을 가리키는지"(target)만 내려주고, 실제 <Route path>는 React
// (AiChatbot.jsx)가 이미 알고 있는 경로로만 연결한다.
public record ActionDto(
        // 지금은 "NAVIGATION" 하나뿐이다. 나중에 다른 종류의 action이 필요해지면
        // 여기에 새 값을 추가한다.
        String type,
        // MENTORING / CALENDAR / STREAMING_VIEW / STREAMING_CREATE / STREAMING_ROOM /
        // STUDY_GROUP / STUDY_RESERVATION / COMMUNITY
        String target,
        String label,
        // 18단계: "지금 제일 인기있는 방송" 같은 실제 데이터 기반 답변에서, 그 특정
        // 방(roomId)으로 바로 연결하기 위한 쿼리스트링(예: "roomId=5"). 대부분의
        // action은 필요 없으므로 null이다 - React가 있으면 경로 뒤에 붙이고, 없으면
        // target의 기본 경로만 사용한다.
        String query
) {
    public ActionDto(String type, String target, String label) {
        this(type, target, label, null);
    }
}
