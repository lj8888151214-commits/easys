package com.easys.service;

import org.springframework.stereotype.Service;

import java.util.List;

// 12단계(RAG): "EASYS에 실제로 존재하는 기능/정책"을 담아두고, 질문 주제에 맞는
// 것만 검색해서 돌려주는 서비스.
//
// 검색 방식: 이미 검증된 FeatureIntentClassifier의 분류 결과(matchStudyTopic로
// 카페/그룹스터디 구분, match()로 멘토링/캘린더/스트리밍/커뮤니티 구분)를 그대로
// 재사용한다 - 같은 판단을 두 번 다르게 하지 않기 위해서다. FeatureIntentClassifier가
// 다루지 않는 payment(결제/환불)만 이 서비스 안에서 직접 keywords로 판단한다.
//
// 지금은 지식이 7개뿐이라 이 정도 규칙 기반 검색으로 충분하다. 나중에 지식이 많이
// 늘어나면 이 클래스 안의 search()만 더 정교하게(예: keywords 전체 대상 점수화)
// 바꾸면 되고, 호출하는 쪽(AiChatService)은 안 바뀌어도 된다.
@Service
public class EasysKnowledgeService {

    private static final List<EasysKnowledge> KNOWLEDGE_BASE = List.of(
            // 17단계: 실제 사용자 테스트에서 두 가지 정체성 오류가 발견됐다.
            //   1) "개발자를 위한" 서비스라고 답함 - EASYS는 특정 직군 전용이 아니라
            //      누구나 잘하는 것을 나누고 배우고 싶은 것을 배우는 학습 공간이다.
            //   2) "이지스는 EASYS의 약어"라고 답함 - 근거 없는 지어낸 정보다. 사용자가
            //      직접 지은 이름일 뿐, 약어인지 여부는 알려진 바가 없다.
            // 이 두 오류를 다시 만들지 않도록 content에 명시적으로 반영했다.
            new EasysKnowledge(
                    "about",
                    "EASYS 서비스 소개",
                    "EASYS는 누구나 쉽게 배우고, 자신이 잘하는 것을 다른 사람과 나누며 함께 "
                            + "공부할 수 있는 학습 공간입니다. 개발자나 특정 전문가만을 위한 서비스가 "
                            + "아니라, 잘하는 분야가 있다면 다른 사람에게 알려줄 수도 있고 배우고 싶은 "
                            + "것이 있다면 멘토링이나 스터디를 통해 함께 공부할 수 있도록 만든 "
                            + "웹사이트입니다. \"이지스\"는 EASYS를 부르는 별칭입니다(사용자가 직접 "
                            + "지은 이름입니다). 멘토링(사람에게 배우거나 가르치기), 그룹 "
                            + "스터디(함께 공부하기), 카페(스터디룸) 예약(공부할 공간 이용), 캘린더 "
                            + "(학습 일정 관리), 실시간 라이브 스트리밍(공부/활동을 보여주거나 "
                            + "시청하기), 커뮤니티(글과 댓글로 소통하기) 기능을 제공합니다. 결제는 "
                            + "토스페이먼츠로 진행됩니다.",
                    List.of("이지스", "easys", "소개")
            ),
            // 17단계: "나도 누군가를 가르칠 수 있어?"에 "EASYS는 가르치는 기능을
            // 제공하지 않습니다"라고 답한 사례가 있었다. 실제로는 정반대다 - 누구나
            // 심사 없이 멘토 등록을 해서 가르칠 수 있다. 이 사실을 배우는 쪽 설명보다
            // 먼저 앞에 두어, "가르치고 싶다"는 질문에도 이 지식이 바로 답이 되게 했다.
            new EasysKnowledge(
                    "mentoring",
                    "멘토링(가르치기/배우기) 등록·신청·승인·결제·확정",
                    "EASYS에서는 누구나 \"멘토 등록\"을 하면 별도 심사 없이 직접 멘토가 되어 "
                            + "자신이 잘하는 것을 가르치는 멘토링을 등록할 수 있습니다. 반대로 배우고 "
                            + "싶은 사람은 멘토 목록에서 원하는 멘토를 고르고, 그 멘토가 등록해둔 "
                            + "멘토링 중 하나를 선택해 예약을 신청합니다. 순서: 멘토 선택 → 예약 신청 → "
                            + "멘토 승인 → 결제 → 결제 완료 → 최종 확정 → 캘린더 자동 등록. 멘토의 "
                            + "승인만으로 멘토링이 최종 확정되는 것이 아닙니다. 반드시 결제가 완료되어야 "
                            + "최종 확정됩니다. 완료된 멘토링에는 리뷰(별점)를 남길 수 있고, 멘토와 1:1 "
                            + "채팅도 가능합니다. 멘토링은 특정 기술이나 주제로 한정되어 있지 않고, "
                            + "멘토가 등록한 어떤 주제든 가능합니다.",
                    List.of("멘토링", "멘토", "가르치")
            ),
            // 13단계: 원래 "카페(스터디룸) 예약과는 다른 별개 기능"이라는 비교 문장이
            // 들어있었는데, RAG로 지식을 딱 하나만 골라서 주는 지금 구조에서는 그 안에
            // "카페"라는 단어가 그냥 들어있는 것만으로도 Qwen이 엉뚱하게 "스터디 참여 =
            // 카페 가입"처럼 섞어버리는 사례가 실제로 발견됐다. 예전(10~11단계, 모든
            // 설명을 한 프롬프트에 다 넣던 방식)에는 이 비교 문장이 꼭 필요했지만,
            // 지금은 관련 지식 하나만 단독으로 전달되니 비교 대상 자체를 언급할 필요가
            // 없다 - 그래서 "카페" 언급을 아예 지웠다.
            new EasysKnowledge(
                    "group_study",
                    "그룹 스터디 개설/참여",
                    "스터디를 만들고 싶으면 스터디를 개설하면 방장이 됩니다. 스터디에 "
                            + "참여하고 싶으면 개설된 스터디에 신청하고, 방장이 승인/거절합니다. "
                            + "정원이 차면 더 이상 신청할 수 없습니다. 참여가 승인되면 그룹 채팅을 "
                            + "사용할 수 있습니다. 스터디 주제는 특정 기술이나 분야로 제한되지 "
                            + "않습니다.",
                    List.of("스터디", "그룹 스터디")
            ),
            // 13단계: 순서를 번호로 못박아서(1→2→3) Qwen이 임의로 순서를 재구성하지
            // 못하게 했다. 내용 자체는 바뀐 것 없이 ReservationService.java(신규 예약
            // 마감 10분, 취소 마감 1시간, onStudyPaymentConfirmed→관리자
            // approveReservation→캘린더 등록)와 정확히 같다 - 새로 지어낸 절차 없음.
            // (위 group_study와 같은 이유로 "그룹 스터디와는 다른 메뉴" 비교 문장도 지웠다.)
            new EasysKnowledge(
                    "cafe_reservation",
                    "카페(스터디룸) 예약/결제",
                    "순서: "
                            + "1) 사용자가 원하는 시간(1시간 단위)과 인원수를 정해 예약을 신청하고 "
                            + "결제합니다(이용 시작 10분 후까지 가능). "
                            + "2) 결제가 완료되면 관리자 승인 대기 상태가 됩니다. "
                            + "3) 관리자가 관리자 모드에서 승인해야 그때 최종 확정되고, 캘린더에 "
                            + "자동으로 일정이 등록됩니다. 취소는 이용 시작 1시간 전까지만 가능합니다.",
                    List.of("카페", "스터디룸", "공간예약")
            ),
            new EasysKnowledge(
                    "calendar",
                    "캘린더",
                    "개인 일정을 직접 등록/수정/삭제할 수 있습니다. 멘토링이나 카페 예약이 "
                            + "확정되면 자동으로 캘린더에 일정이 추가됩니다.",
                    List.of("캘린더", "일정")
            ),
            new EasysKnowledge(
                    "streaming",
                    "스트리밍",
                    "EASYS의 스트리밍은 넷플릭스 같은 영상 다시보기 서비스가 아닙니다. "
                            + "사용자가 방 제목/설명/카테고리를 정해 실시간 라이브 방송방을 직접 만들고, "
                            + "다른 사람이 그 방송을 시청하는 기능입니다. 시청자 수가 실시간으로 표시되고, "
                            + "시청자가 모두 나가서 0명이 되면 방이 자동으로 사라집니다.",
                    List.of("스트리밍", "방송")
            ),
            new EasysKnowledge(
                    "community",
                    "커뮤니티",
                    "커뮤니티에서는 제목/내용/카테고리를 정해 이미지와 함께 글을 쓸 수 있고, "
                            + "댓글을 달거나 좋아요를 누를 수 있습니다.",
                    List.of("커뮤니티")
            ),
            new EasysKnowledge(
                    "payment",
                    "결제/환불",
                    "결제 수단은 토스페이먼츠(카드, 계좌이체 등 토스가 지원하는 방식)만 "
                            + "가능합니다. 환불 절차나 기간, 할부, 쿠폰, 포인트 같은 기능은 EASYS에 "
                            + "마련되어 있지 않습니다. 환불을 요청할 수 있는 별도의 문의 창구(고객센터, "
                            + "관리자 문의 등)도 마련되어 있지 않습니다.",
                    List.of("결제", "환불", "토스", "할부", "쿠폰", "포인트", "refund")
            )
    );

    // rawMessage: 사용자가 실제로 입력한 원문(오타 보정 전).
    // match: AiChatService가 이미 계산해둔 FeatureIntentClassifier.match() 결과를 그대로
    //        받는다(같은 판단을 여기서 다시 하지 않기 위해).
    public List<EasysKnowledge> search(String rawMessage, FeatureIntentClassifier.Match match) {
        FeatureIntentClassifier.StudyTopic studyTopic = FeatureIntentClassifier.matchStudyTopic(rawMessage);

        if (studyTopic == FeatureIntentClassifier.StudyTopic.CAFE_RESERVATION) {
            return findByCategory("cafe_reservation");
        }
        if (studyTopic == FeatureIntentClassifier.StudyTopic.GROUP_STUDY) {
            return findByCategory("group_study");
        }

        if (match != null) {
            String category = switch (match.category()) {
                case "EASYS_ABOUT" -> "about";
                case "MENTORING" -> "mentoring";
                case "CALENDAR" -> "calendar";
                case "STREAMING" -> "streaming";
                case "COMMUNITY" -> "community";
                // STUDY만 매칭되고 위 matchStudyTopic()이 카페/그룹스터디 어느 쪽인지
                // 정하지 못했다면(예: "스터디"라는 단어만 있고 참여/개설/신청 같은
                // 동작 표현이 없는 경우), 둘 중 하나로 억지로 단정하지 않는다.
                default -> null;
            };
            if (category != null) {
                return findByCategory(category);
            }
        }

        // 결제/환불은 FeatureIntentClassifier가 다루는 영역이 아니라서 여기서
        // Knowledge 자체의 keywords로 직접 판단한다. "refund"처럼 영문 키워드도
        // 대소문자 구분 없이 매칭한다 - 원래 소문자만 비교하면 "REFUND가 뭐야"
        // 같은 입력은 걸리지 않는 문제가 있었다.
        String lowerRawMessage = rawMessage.toLowerCase();
        for (EasysKnowledge knowledge : KNOWLEDGE_BASE) {
            if ("payment".equals(knowledge.category())) {
                for (String keyword : knowledge.keywords()) {
                    if (lowerRawMessage.contains(keyword.toLowerCase())) {
                        return List.of(knowledge);
                    }
                }
            }
        }

        return List.of();
    }

    private List<EasysKnowledge> findByCategory(String category) {
        return KNOWLEDGE_BASE.stream()
                .filter(k -> k.category().equals(category))
                .toList();
    }
}
