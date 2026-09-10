package com.easys.dto;

import java.util.List;

// AiChatController(/api/ai/chat)의 응답 구조.
// - reply: 화면에 보여줄 답변 텍스트 (기존 그대로 유지 - 프론트가 data.reply로 읽는다)
// - intent: 질문이 어떤 EASYS 기능에 관한 것인지 (MENTORING/CALENDAR/STREAMING/STUDY/
//   COMMUNITY/BEST_MENTOR/EASYS_ABOUT 중 하나, 관련 없으면 null). 기존 프론트 호환을
//   위해 그대로 유지한다.
// - confirmTypo: 오타로 보여 "혹시 ~을 말씀하시는 건가요?" 확인 문구를 reply 앞에
//   붙였는지 여부. reply 텍스트에 이미 포함되어 있으므로 화면 렌더링에 필수는 아니지만,
//   추후 UI에서 별도로 활용할 수 있도록 함께 내려준다.
// - sessionId: 이번 대화가 속한 세션 식별자(Redis 키의 일부). 프론트는 이 값을
//   저장해뒀다가 다음 질문을 보낼 때 AiChatRequestDto.sessionId로 그대로 다시
//   실어 보내야, 서버가 Redis에서 이전 대화를 찾아 이어갈 수 있다.
// - actions: 17단계 신규. intent 하나로는 "스터디"가 그룹 스터디인지 카페(스터디룸)
//   예약인지 구분이 안 됐고, 답변 하나에 여러 개의 바로가기를 붙일 수도 없었다.
//   실제 이동 경로(URL)는 여기서도 만들지 않는다 - React가 target 코드를 실제
//   <Route path>로 바꾼다. intent 필드는 하위 호환을 위해 그대로 두고, actions는
//   비어있을 수 있다(관련 기능이 없는 질문, 예: EASYS_ABOUT, 일반 지식 질문 등).
public class AiChatResponseDto {

    private final String reply;
    private final String intent;
    private final boolean confirmTypo;
    private final String sessionId;
    private final List<ActionDto> actions;

    public AiChatResponseDto(String reply, String intent, boolean confirmTypo, String sessionId) {
        this(reply, intent, confirmTypo, sessionId, List.of());
    }

    public AiChatResponseDto(String reply, String intent, boolean confirmTypo, String sessionId,
                              List<ActionDto> actions) {
        this.reply = reply;
        this.intent = intent;
        this.confirmTypo = confirmTypo;
        this.sessionId = sessionId;
        this.actions = actions != null ? actions : List.of();
    }

    public String getReply() {
        return reply;
    }

    public String getIntent() {
        return intent;
    }

    public boolean isConfirmTypo() {
        return confirmTypo;
    }

    public String getSessionId() {
        return sessionId;
    }

    public List<ActionDto> getActions() {
        return actions;
    }
}
