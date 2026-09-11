package com.easys.dto;

public class AiChatRequestDto {

    private String message;

    // 이전 대화와 이어서 기억하기 위한 세션 식별자. 첫 질문이라 프론트가 아직 모르면
    // null/빈 값으로 보내도 된다 - 그러면 서버(AiChatService)가 새로 하나 발급해서
    // 응답(AiChatResponseDto.sessionId)에 실어 보내주고, 프론트는 그 값을 저장해뒀다가
    // 다음 질문부터 그대로 다시 보내면 된다.
    private String sessionId;

    // 20단계: 비로그인 사용자의 무료 체험 횟수를 서버(Redis)에서 세기 위한
    // 식별자. 브라우저(localStorage)가 한 번 발급해서 계속 재사용한다 - 여기
    // 담긴 값은 "누구인지"를 구분하는 용도일 뿐이고, 실제 남은 횟수는 항상
    // 서버가 판단한다(이 값 자체를 카운트로 신뢰하지 않는다).
    private String guestId;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getGuestId() {
        return guestId;
    }

    public void setGuestId(String guestId) {
        this.guestId = guestId;
    }
}
