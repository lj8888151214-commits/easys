package com.easys.service;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// 사용자의 질문 문장에서 "EASYS의 어떤 기능을 말하는지"를 판단한다.
// - Gemini가 URL/기능을 임의로 정하지 않도록, 이 클래스가 먼저 질문의 의도(카테고리)를
//   정하고 AiChatService/AiChatbot.jsx는 그 결과(intent 코드)만 사용한다.
// - "멪토링", "메토링", "멘ㅅㅅ토링", "ㅁ ㅔ토리"처럼 오타/자모가 흩어진 입력도 인식할 수 있도록
//   한글 음절을 초성/중성/종성 자모로 분해한 뒤 편집거리(Levenshtein)로 비교한다.
//   음절 단위로 비교하면 한 글자만 달라도 전체가 크게 달라 보이지만, 자모 단위로 풀어보면
//   실제로는 한두 자모만 다른 경우가 대부분이라 오타 판별이 훨씬 잘 된다.
public final class FeatureIntentClassifier {

    private FeatureIntentClassifier() {
    }

    public record Match(String category, String canonicalKeyword, boolean typo) {
    }

    private record FeatureCategory(String code, String canonicalKeyword, List<String> aliases) {
    }

    // 순서가 우선순위다 - 여러 키워드가 겹칠 수 있는 질문("멘토링 예약" 등)은 위에서부터
    // 먼저 매칭된다. AiChatbot.jsx의 FEATURE_SHORTCUTS와 category/우선순위를 맞춘다.
    private static final List<FeatureCategory> CATEGORIES = List.of(
            new FeatureCategory("MENTORING", "멘토링", List.of("멘토링", "멘토")),
            new FeatureCategory("CALENDAR", "캘린더", List.of("캘린더", "일정")),
            new FeatureCategory("STREAMING", "스트리밍", List.of("스트리밍", "방송")),
            new FeatureCategory("STUDY", "스터디", List.of("스터디", "카페")),
            new FeatureCategory("COMMUNITY", "커뮤니티", List.of("커뮤니티"))
    );

    // "최고의 멘토" 의도를 판단하기 위한 보조 키워드. 오타 허용까지는 하지 않는다
    // (요구사항에서 오타 허용 대상은 5개 기능 이름뿐이다).
    private static final String[] BEST_MENTOR_MARKERS = {
            "최고", "제일", "베스트", "추천", "가장", "1등", "잘하는", "탑"
    };

    private static final String MENTOR_WORD = "멘토";

    // 16단계: "EASYS가 뭐야?"는 인식되는데 "이지스가 뭐야?", "여기 뭐하는 사이트야?"는
    // 인식이 안 되는 문제의 원인 - 이 클래스에는 EASYS 자체를 가리키는 표현을 판단하는
    // 로직이 전혀 없었다(멘토링/캘린더/스트리밍/스터디/커뮤니티 5개 기능만 판단).
    // 그래서 "이지스"처럼 EASYS를 가리키는 것이 명백한 표현과, "여기"/"이곳"처럼
    // 문맥이 필요한 표현을 구분해서 판단하는 로직을 추가한다.
    //
    // - EASYS_NAME_ALIASES: 그 자체로 EASYS를 가리키는 게 명확한 이름. 영문
    //   "easys"는 대소문자를 가리지 않도록 소문자로 비교한다.
    // - EASYS_SITE_PHRASES: "우리/이/여기" + "홈페이지/사이트" 조합도 이 챗봇이
    //   붙어있는 사이트 자체를 가리키는 것이 명확하다.
    // - "여기"/"이곳"만 단독으로 쓰인 경우는 다른 대상(예: 화면의 특정 위치)을
    //   가리킬 수도 있으므로, "이게 무엇인지 묻는" 질문 마커와 함께 있을 때만
    //   EASYS를 가리키는 것으로 판단한다.
    private static final String[] EASYS_NAME_ALIASES = {"easys", "이지스"};

    private static final String[] EASYS_SITE_PHRASES = {
            "이지스 홈페이지", "이지스 사이트", "우리 홈페이지", "우리 사이트",
            "이 홈페이지", "이 사이트", "여기 홈페이지", "여기 사이트"
    };

    // 19단계: "여긴 뭐하는 곳이야?"가 인식되지 않는 문제 발견 - "여긴"은 "여기는"이
    // 구어체로 줄어든 형태라 글자 그대로는 "여기"라는 부분 문자열을 포함하지
    // 않는다(여/긴 vs 여/기). 흔한 축약형을 명시적으로 추가한다.
    private static final String[] EASYS_CONTEXTUAL_PLACE_WORDS = {"여기", "여긴", "이곳"};

    private static final String[] EASYS_IDENTITY_QUESTION_MARKERS = {
            "뭐", "무엇", "무슨", "뭘", "어떤", "소개", "처음"
    };

    // "EASYS가 뭐야?", "이지스가 뭐야?", "이지스 홈페이지가 뭐야?", "우리 홈페이지는
    // 뭐 하는 곳이야?", "여기 뭐하는 사이트야?"처럼 EASYS 서비스 자체에 대한 질문인지
    // 판단한다. 특정 기능(멘토링/캘린더 등) 질문과는 별개다 - 그 판단은 match()가 한다.
    public static boolean isEasysIdentityQuestion(String rawMessage) {
        String normalized = normalize(rawMessage);
        if (normalized.isEmpty()) {
            return false;
        }
        String lowerNormalized = normalized.toLowerCase();

        for (String alias : EASYS_NAME_ALIASES) {
            if (lowerNormalized.contains(alias)) {
                return true;
            }
        }
        for (String phrase : EASYS_SITE_PHRASES) {
            if (normalized.contains(phrase)) {
                return true;
            }
        }

        boolean mentionsContextualPlace = false;
        for (String place : EASYS_CONTEXTUAL_PLACE_WORDS) {
            if (normalized.contains(place)) {
                mentionsContextualPlace = true;
                break;
            }
        }
        if (!mentionsContextualPlace) {
            return false;
        }
        for (String marker : EASYS_IDENTITY_QUESTION_MARKERS) {
            if (normalized.contains(marker)) {
                return true;
            }
        }
        return false;
    }

    // "EASYS에서 최고의 멘토는 누구야?" 류의 질문인지 판단한다.
    public static boolean isBestMentorQuestion(String rawMessage) {
        String normalized = normalize(rawMessage);
        if (normalized.isEmpty()) {
            return false;
        }

        boolean mentionsMentor = normalized.contains(MENTOR_WORD)
                || containsFuzzy(normalized, decompose(MENTOR_WORD), 1);
        if (!mentionsMentor) {
            return false;
        }

        for (String marker : BEST_MENTOR_MARKERS) {
            if (normalized.contains(marker)) {
                return true;
            }
        }
        return false;
    }

    // 11단계: "스터디"(그룹 스터디)와 "카페(스터디룸) 예약"은 서로 완전히 다른
    // 기능인데, 위 CATEGORIES는 원래 "바로가기 버튼 하나를 고르는" 용도로 만들어져서
    // 이 둘을 STUDY 하나로 묶어둔 상태다(그 용도는 지금도 맞다 - /study-reservation
    // 버튼 하나로 충분하다). 하지만 Qwen에게 "지금 질문이 그룹 스터디인지 카페
    // 예약인지" 정확히 알려주려면 더 세밀한 구분이 필요해서, 기존 CATEGORIES/match()는
    // 전혀 건드리지 않고 이 메서드만 새로 추가한다(용도가 다른 두 분류를 분리해서
    // 기존 바로가기 버튼 동작에 회귀를 만들지 않는다).
    public enum StudyTopic {
        CAFE_RESERVATION,
        GROUP_STUDY
    }

    // "카페", "스터디룸", "공간예약"이 하나라도 있으면 무조건 카페 예약으로 본다
    // (그룹 스터디 키워드보다 우선 검사 - 요구사항의 "카페/스터디룸이 있으면
    // 반드시 카페 예약 흐름으로 판단한다"를 그대로 반영).
    private static final String[] CAFE_RESERVATION_KEYWORDS = {"카페", "스터디룸", "공간예약"};

    // 위 카페 키워드가 없을 때만, "스터디"라는 단어와 아래 행동 표현이 함께 있으면
    // 그룹 스터디로 본다. 단순히 "스터디"라는 단어 하나만으로는 판단하지 않는다.
    private static final String[] GROUP_STUDY_ACTION_WORDS = {"참여", "개설", "모집", "신청", "만들"};

    public static StudyTopic matchStudyTopic(String rawMessage) {
        String normalized = normalize(rawMessage);
        if (normalized.isEmpty()) {
            return null;
        }

        for (String keyword : CAFE_RESERVATION_KEYWORDS) {
            if (normalized.contains(keyword)) {
                return StudyTopic.CAFE_RESERVATION;
            }
        }

        // 17단계: AiChatService가 "스터디 어디서 구함"처럼 애매한 질문에 명확화
        // 질문("그룹 스터디를 찾으시는 건가요, 아니면 공부할 공간을 예약하려는
        // 건가요?")으로 되물은 뒤, 사용자가 "그룹 스터디요"라고만 답하는 경우를
        // 대비한다. "그룹"이라는 단서만으로도 충분히 명확하므로 행동 표현
        // (참여/개설 등) 없이도 그룹 스터디로 본다.
        if (normalized.contains("그룹")) {
            return StudyTopic.GROUP_STUDY;
        }

        if (normalized.contains("스터디")) {
            for (String action : GROUP_STUDY_ACTION_WORDS) {
                if (normalized.contains(action)) {
                    return StudyTopic.GROUP_STUDY;
                }
            }
        }

        return null;
    }

    // 17단계: 실제 사용자 테스트에서 "반갑다"/"안녕" 같은 순수 인사에도 AI가 EASYS
    // 소개를 억지로 붙이는 문제가 발견됐다. 원인은 공통 System Prompt에 항상 들어있는
    // "[EASYS란]" 설명 문단이었다 - 질문이 인사든 기능 질문이든 항상 그 문단을
    // 읽게 되니, 모델이 "EASYS 얘기를 해야 한다"고 느낀 것이다. 그래서 인사/감정
    // 표현처럼 EASYS 지식이 전혀 필요 없는 대화를 먼저 걸러내서, 이런 대화에는
    // EASYS 설명이 없는 훨씬 짧은 전용 프롬프트(AiChatService.CASUAL_PROMPT)를 쓴다.
    // 단, "이지스"/기능 키워드가 함께 있으면 이 판단보다 먼저 그쪽으로 처리되도록
    // AiChatService가 이 메서드를 다른 판단들보다 나중에 확인한다.
    private static final String[] CASUAL_CHAT_MARKERS = {
            "반갑", "안녕", "고마워", "감사", "수고", "잘했어", "잘자", "굿모닝", "좋은 아침",
            "힘들", "심심", "지치", "피곤", "우울", "슬퍼", "기뻐", "행복",
            "화나", "화가나", "화가난", "화났", "짜증",
            "ㅋㅋ", "ㅎㅎ", "ㅠㅠ", "ㅜㅜ", "부끄러", "쑥스러", "미안"
    };

    public static boolean isCasualChat(String rawMessage) {
        String normalized = normalize(rawMessage);
        if (normalized.isEmpty()) {
            return false;
        }
        for (String marker : CASUAL_CHAT_MARKERS) {
            if (normalized.contains(marker)) {
                return true;
            }
        }
        return false;
    }

    // 17단계: "나를 멘토링 페이지로 이동시켜줘"처럼 명백한 이동 요청인데도, AI가
    // "그런 기능은 제공하지 않습니다"라고 잘못 답하거나 이용 방법을 설명하는 문제가
    // 있었다. 실제로는 intent만 맞으면 프론트(AiChatbot.jsx)가 바로가기 버튼을 이미
    // 보여주고 있으므로, 이런 요청에는 Qwen에게 설명을 시키지 않고 짧게 안내만
    // 하도록 판단하는 마커다. 방법을 묻는 질문("어떻게 해?")과는 구분한다.
    // 19단계: "캘린더로 이동해줘"가 인식되지 않는 문제 발견 - "이동시켜"만 있고
    // 더 흔한 "이동해"(이동해줘/이동해주세요/이동하고 싶어)가 없었다.
    private static final String[] NAVIGATION_MARKERS = {
            "이동시켜", "이동해", "보내줘", "가고싶", "가고 싶", "가볼래", "가줘", "들어가고싶",
            "들어가고 싶", "보여줘", "열어줘", "페이지로", "페이지 보여줘", "바로가기"
    };

    public static boolean isNavigationRequest(String rawMessage) {
        String normalized = normalize(rawMessage);
        if (normalized.isEmpty()) {
            return false;
        }
        for (String marker : NAVIGATION_MARKERS) {
            if (normalized.contains(marker)) {
                return true;
            }
        }
        return false;
    }

    // 17단계: "나도 누군가를 가르칠 수 있어?", "내가 잘하는 걸 가르쳐도 될까?"는
    // "멘토"/"멘토링"이라는 단어가 전혀 없어서 기존 MENTORING 매칭에 걸리지 않았다.
    // 그 결과 멘토 등록 관련 지식이 전달되지 않아, 대화 문맥이 없을 때는 AI가
    // "EASYS는 가르치는 기능을 제공하지 않는다"처럼 서비스 철학과 반대로 답하는
    // 사례가 실제로 있었다. "가르치다" 계열 표현을 MENTORING으로 판단한다.
    private static final String[] TEACH_MARKERS = {
            "가르치", "가르켜", "가르켜줘", "멘토가 될", "멘토가될", "멘토 할 수", "멘토할 수"
    };

    public static boolean isTeachIntent(String rawMessage) {
        String normalized = normalize(rawMessage);
        if (normalized.isEmpty()) {
            return false;
        }
        for (String marker : TEACH_MARKERS) {
            if (normalized.contains(marker)) {
                return true;
            }
        }
        return false;
    }

    // 17단계: "나는 뭘 배워야 할지 모르겠어"류 질문에 AI가 일반적인 취업/기술 조언을
    // 길게 늘어놓는 문제가 있었다. 이런 질문은 정답을 알려주는 게 아니라 사용자에게
    // 되물어서 탐색하는 게 맞다고 판단해서, 이 경우 Qwen 호출 없이 정해진 탐색형
    // 질문(고정 선택지)을 그대로 보여준다 - hallucination 위험이 전혀 없다.
    private static final String[] LEARNING_EXPLORATION_MARKERS = {
            "뭘 배워야", "무엇을 배워야", "뭐 배워야", "뭐 공부해야", "무슨 공부", "공부할지 모르",
            "배울지 모르", "뭘 해야 할지 모르"
    };

    public static boolean isLearningExplorationQuestion(String rawMessage) {
        String normalized = normalize(rawMessage);
        if (normalized.isEmpty()) {
            return false;
        }
        for (String marker : LEARNING_EXPLORATION_MARKERS) {
            if (normalized.contains(marker)) {
                return true;
            }
        }
        return false;
    }

    // 17단계: "방송 보고 싶어"(시청)와 "방송 만들고 싶어"(생성)는 완전히 다른
    // 요청인데, 둘 다 STREAMING 카테고리로만 묶여서 AI가 구분하지 못하고 답변이
    // 뒤섞이는 문제(심지어 "스터디룸에서 스트리밍 시작" 같은 존재하지 않는 기능까지
    // 지어내는 사례)가 있었다. 동사로 시청/생성 의도를 구분해서 Qwen에게 명시적으로
    // 알려준다.
    public enum StreamingIntent {
        VIEW,
        CREATE
    }

    private static final String[] STREAMING_VIEW_MARKERS = {"보고싶", "보고 싶", "시청", "구경"};
    private static final String[] STREAMING_CREATE_MARKERS = {
            "만들고싶", "만들고 싶", "만들래", "시작하고싶", "시작하고 싶", "방송할래", "방송하고싶"
    };

    public static StreamingIntent matchStreamingIntent(String rawMessage) {
        String normalized = normalize(rawMessage);
        if (normalized.isEmpty()) {
            return null;
        }
        for (String marker : STREAMING_CREATE_MARKERS) {
            if (normalized.contains(marker)) {
                return StreamingIntent.CREATE;
            }
        }
        for (String marker : STREAMING_VIEW_MARKERS) {
            if (normalized.contains(marker)) {
                return StreamingIntent.VIEW;
            }
        }
        return null;
    }

    // 19단계: "내가 등록한 멘토링은?"에 실제 데이터 조회 없이 일반적인 등록 방법을
    // 설명하던 문제 - 이 질문은 RAG가 아니라 실제 DB(MentorProfile/MentoringOffering/
    // MentoringReservation)로 답해야 한다. "내가"/"나의"/"제가" + "멘토링" +
    // "등록"/"신청"이 함께 있을 때만 인식한다("멘토링은 어떻게 신청해?"처럼 자기
    // 소유를 나타내는 말이 없는 일반 이용 방법 질문과 구분하기 위해).
    private static final String[] SELF_REFERENCE_MARKERS = {"내가", "나의", "제가"};

    public static boolean isMyMentoringQuestion(String rawMessage) {
        String normalized = normalize(rawMessage);
        if (!normalized.contains("멘토링")) {
            return false;
        }
        boolean mentionsSelf = false;
        for (String marker : SELF_REFERENCE_MARKERS) {
            if (normalized.contains(marker)) {
                mentionsSelf = true;
                break;
            }
        }
        if (!mentionsSelf) {
            return false;
        }
        return normalized.contains("등록") || normalized.contains("신청");
    }

    // 19단계: "그럼 결제 안 해도 돼?", "등록이 되면 끝이야?"처럼 스스로 새로운
    // 주제를 밝히지 않고 이전 대화를 이어받아야만 뜻이 통하는 짧은 후속 질문을
    // 판단한다. resolveKnowledge()의 "직전 주제 물려받기"를 이런 표현에만
    // 적용하기 위한 것 - "java"처럼 EASYS 도메인과 무관한 완전히 새로운 단어가
    // 엉뚱하게 이전 주제(예: 멘토링)를 물려받는 문제를 막는다.
    private static final String[] CONTEXT_CONTINUATION_MARKERS = {
            "그럼", "그거", "그게", "그것", "이거", "그래서", "그러면", "그리고", "그렇다면"
    };

    public static boolean looksLikeContextContinuation(String rawMessage) {
        String normalized = normalize(rawMessage);
        for (String marker : CONTEXT_CONTINUATION_MARKERS) {
            if (normalized.contains(marker)) {
                return true;
            }
        }
        return normalized.contains("되면") || normalized.contains("하면");
    }

    // 19단계: "지금까지 대화 다 지워줘" 판별. "삭제"/"지워" 계열 표현과 "대화"/
    // "채팅"/"기록" 계열 표현이 함께 있을 때만 인식한다(단순히 "삭제"라는 말만
    // 있는 다른 요청과 구분하기 위해 - 예: "예약 삭제해줘"는 다른 기능이다).
    public static boolean isDeleteHistoryRequest(String rawMessage) {
        String normalized = normalize(rawMessage);
        boolean mentionsDelete = normalized.contains("지워") || normalized.contains("삭제");
        boolean mentionsChat = normalized.contains("대화") || normalized.contains("채팅")
                || normalized.contains("기록");
        return mentionsDelete && mentionsChat;
    }

    // 17단계: "내 일정 보여줘"는 원래도 "일정"이 CALENDAR의 별칭이라 매칭은 됐지만,
    // AiChatService가 이걸 그냥 "캘린더 기능 설명"으로만 답해서 실제 데이터를 보여주지
    // 못했다(로그인 사용자의 실제 개인 일정 API가 이미 있는데도 안 쓴 것). "내"라는
    // 소유 표현이 있으면 실제 데이터를 조회하는 개인 데이터 질문으로 판단한다.
    private static final String[] PERSONAL_SCHEDULE_MARKERS = {
            "내일정", "내스케줄", "내캘린더", "오늘일정", "이번주일정", "내예정된일정",
            "지난일정", "다가오는일정", "방금등록", "최근등록", "방금만든", "방금추가",
            "방금등록한", "방금내가"
    };

    public static boolean isPersonalScheduleQuestion(String rawMessage) {
        String normalized = normalize(rawMessage);
        if (normalized.isEmpty()) {
            return false;
        }
        for (String marker : PERSONAL_SCHEDULE_MARKERS) {
            if (normalized.contains(marker)) {
                return true;
            }
        }
        return false;
    }

    // 18단계: "내 일정"이라고만 물으면 지난 09/04 일정까지 전부 보여주던 문제가
    // 있었다. "내 일정"의 기본값은 "다가오는 일정"이어야 하고, "지난 일정"/"오늘
    // 일정"/"이번 주 일정"/"방금 등록한 일정"은 각각 명시적으로 구분해야 한다.
    // 이 판단은 Qwen에게 맡기지 않고 서버가 결정적으로 한다(AiChatService).
    public enum ScheduleRange {
        UPCOMING,
        PAST,
        TODAY,
        THIS_WEEK,
        RECENT_CREATED
    }

    public static ScheduleRange matchScheduleRange(String rawMessage) {
        String normalized = normalize(rawMessage);
        if (normalized.contains("방금") || normalized.contains("최근") || normalized.contains("금방")) {
            return ScheduleRange.RECENT_CREATED;
        }
        if (normalized.contains("지난") || normalized.contains("과거") || normalized.contains("이전")) {
            return ScheduleRange.PAST;
        }
        if (normalized.contains("오늘")) {
            return ScheduleRange.TODAY;
        }
        if (normalized.contains("이번주") || normalized.contains("이번 주")) {
            return ScheduleRange.THIS_WEEK;
        }
        return ScheduleRange.UPCOMING;
    }

    // 18단계: 로그인 사용자가 "내 이름이 뭐야?"라고 물었을 때 사용한다. Member의
    // nickname은 이미 있는 필드이므로, 새로운 이름 저장 테이블을 만들지 않고
    // 기존 인증 정보를 우선 활용한다(장기 기억에 별도로 저장한 "선호 이름"이
    // 있으면 그게 우선이고, 없으면 nickname을 쓴다 - AiChatService에서 처리).
    private static final String[] NAME_QUESTION_MARKERS = {"내이름", "내가누구", "나누구"};

    public static boolean isNameQuestion(String rawMessage) {
        String normalized = normalize(rawMessage);
        for (String marker : NAME_QUESTION_MARKERS) {
            if (normalized.contains(marker)) {
                return true;
            }
        }
        return false;
    }

    // 18단계: "0ho야 기억해", "내 이름은 0ho야. 기억해"에서 실제로 기억해야 할
    // 이름만 뽑아낸다. "기억"이라는 말이 함께 있어야만 저장 의도로 본다 -
    // 일반적인 모든 대화를 장기 기억으로 저장하지 않기 위해서다.
    private static final Pattern NAME_BEFORE_YA_PATTERN =
            Pattern.compile("([\\p{L}\\p{N}_]+)야[^가-힣]{0,3}[\\s,.]*.{0,6}?기억");
    private static final Pattern NAME_AFTER_IREUMEUN_PATTERN =
            Pattern.compile("이름은\\s*([\\p{L}\\p{N}_]+)(?:이에요|예요|이야|야|입니다)");

    public static String extractNameToRemember(String rawMessage) {
        if (rawMessage == null || !rawMessage.contains("기억")) {
            return null;
        }
        Matcher matcher = NAME_AFTER_IREUMEUN_PATTERN.matcher(rawMessage);
        if (matcher.find()) {
            return matcher.group(1);
        }
        matcher = NAME_BEFORE_YA_PATTERN.matcher(rawMessage);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    // 18단계: "이름 기억하지 마"/"이름 잊어줘"는 저장해둔 이름만 지운다. "이름"
    // 언급 없이 "그거 잊어줘"라고만 하면 가장 최근에 기억해둔 항목을 지운다
    // (AiChatService가 어떤 걸 지울지 결정).
    private static final String[] FORGET_NAME_MARKERS = {"이름기억하지마", "이름잊어", "이름지워"};

    public static boolean isForgetNameRequest(String rawMessage) {
        String normalized = normalize(rawMessage);
        for (String marker : FORGET_NAME_MARKERS) {
            if (normalized.contains(marker)) {
                return true;
            }
        }
        return false;
    }

    public static boolean isGenericForgetRequest(String rawMessage) {
        String normalized = normalize(rawMessage);
        boolean mentionsForget = normalized.contains("잊어") || normalized.contains("기억하지마")
                || normalized.contains("기억하지말");
        return mentionsForget && !normalized.contains("이름");
    }

    // 18단계: "이거 기억해둬"/"이거 저장해줘"처럼 이름이 아닌 자유 형식 메모를
    // 저장하려는 요청. "기억"/"저장" 단어가 있고 위의 이름 저장 패턴에는 해당하지
    // 않을 때만 메모로 취급한다.
    public static boolean isGenericRememberRequest(String rawMessage) {
        if (rawMessage == null) {
            return false;
        }
        boolean mentionsRemember = rawMessage.contains("기억") || rawMessage.contains("저장해");
        return mentionsRemember && extractNameToRemember(rawMessage) == null;
    }

    // 18단계: "자바 문제 몇 개 내줘"에서 어떤 과목인지 판단한다. 학습 문제 출제는
    // EASYS 기능이 아니라 Qwen의 일반 지식 영역이므로 RAG를 타지 않는다.
    public enum QuizSubject {
        JAVA,
        DB_SQL,
        SPRING,
        REACT,
        HTTP
    }

    private static final String[] QUIZ_MARKERS = {"문제", "퀴즈", "출제"};

    public static boolean isQuizRequest(String rawMessage) {
        String normalized = normalize(rawMessage);
        for (String marker : QUIZ_MARKERS) {
            if (normalized.contains(marker)) {
                return true;
            }
        }
        return false;
    }

    public static QuizSubject matchQuizSubject(String rawMessage) {
        String lower = normalize(rawMessage).toLowerCase();
        if (lower.contains("자바") || lower.contains("java")) {
            return QuizSubject.JAVA;
        }
        if (lower.contains("db") || lower.contains("sql") || lower.contains("데이터베이스")) {
            return QuizSubject.DB_SQL;
        }
        if (lower.contains("스프링") || lower.contains("spring")) {
            return QuizSubject.SPRING;
        }
        if (lower.contains("리액트") || lower.contains("react")) {
            return QuizSubject.REACT;
        }
        if (lower.contains("http")) {
            return QuizSubject.HTTP;
        }
        return null;
    }

    // 20단계 실제 브라우저 테스트에서 발견: "자바 문제 하나만 내봐"라고 했는데도
    // 항상 5문제가 나왔다 - 원인은 AiChatService.buildQuizReply가 사용자가 몇 개를
    // 요청했는지 전혀 보지 않고 "문제 5개를 내주세요"를 하드코딩해서 Qwen에게
    // 보냈기 때문이다(문제 개수를 LLM 프롬프트 문구에만 맡기지 않고, 이제
    // 애플리케이션이 직접 개수를 정해서 그 숫자만큼만 요청한다). "N문제"/"N개"처럼
    // 숫자가 명시된 경우에만 그 개수를 쓰고, 없으면 기본값 1이다("하나만"도 숫자가
    // 없으므로 기본값 1로 이미 정확히 처리된다). 개수는 최대 10개로 제한해서
    // 지나치게 큰 요청으로 Qwen 응답이 무너지는 것을 막는다.
    private static final Pattern QUIZ_COUNT_PATTERN = Pattern.compile("(\\d+)\\s*(문제|개)");

    public static int parseQuizCount(String rawMessage) {
        if (rawMessage == null) {
            return 1;
        }
        Matcher matcher = QUIZ_COUNT_PATTERN.matcher(rawMessage);
        if (!matcher.find()) {
            return 1;
        }
        int count = Integer.parseInt(matcher.group(1));
        return Math.max(1, Math.min(count, 10));
    }

    // 20단계: "문제 하나만 내줘 → ② " 흐름에서, 사용자가 방금 낸 문제에 답하는
    // 중인지 판단한다. "①"/"②"/"③"/"④" 같은 원문자나 "2"/"2번"처럼 아주 짧은
    // 응답만 정답 입력으로 본다 - 다른 목적의 메시지(예: "내 일정 보여줘")가
    // 우연히 숫자를 포함한다고 해서 정답으로 오인하지 않도록 전체 메시지가 이
    // 패턴과 정확히 일치할 때만 인정한다.
    private static final char[] CIRCLED_DIGITS = {'①', '②', '③', '④'};

    private static final Pattern QUIZ_ANSWER_EXACT_PATTERN =
            Pattern.compile("^(정답은|답은|답)?([①②③④]|[1-4])(번)?(이야|이에요|예요|입니다|요)?[.!]?$");

    // 21단계 실제 브라우저 테스트에서 발견: "음, 계산해보면 ②번이 맞는 것
    // 같아요"처럼 설명과 함께 보기 번호를 말하는 답변은 위 exact 패턴(전체
    // 메시지가 답 하나뿐이어야 함)에 걸리지 않아 그대로 일반 대화로 새어나갔다.
    // 원문자(①②③④)나 "N번"처럼 "보기를 골랐다"는 것이 명확한 표현이 메시지
    // 어딘가에 있으면 그것도 정답 입력으로 인정한다. 다만 오탐을 막기 위해
    // "3번째"처럼 순서를 뜻하는 표현은 제외하고, 바로 옆에 다른 숫자가 붙어있는
    // 경우(예: "13번")도 제외한다 - 이런 안전장치 없이 "N번"만 찾으면 완전히
    // 무관한 문장까지 정답으로 오인할 수 있다.
    private static final Pattern QUIZ_ANSWER_TOKEN_PATTERN =
            Pattern.compile("[①②③④]|(?<!\\d)[1-4]번(?!째)(?!\\d)");

    public static String matchQuizAnswerOption(String rawMessage) {
        String normalized = normalize(rawMessage);
        if (normalized.isEmpty() || normalized.length() > 60) {
            return null;
        }

        Matcher exact = QUIZ_ANSWER_EXACT_PATTERN.matcher(normalized);
        if (exact.matches()) {
            return toCircledOption(exact.group(2));
        }

        Matcher token = QUIZ_ANSWER_TOKEN_PATTERN.matcher(normalized);
        if (token.find()) {
            String found = token.group();
            return toCircledOption(String.valueOf(found.charAt(0)));
        }

        return null;
    }

    // 22단계 실제 브라우저 테스트에서 발견: "자바 문제 하나 내줘" 다음에 완전히
    // 무관한 새 질문("HTTP 상태코드 200이 뭐야?")을 했는데, 보기 번호가 없다는
    // 이유만으로 무조건 "아직 답 안 한 퀴즈에 대한 답변 시도"로 오인해서
    // "정답 보기 번호로 답해 주세요"라고만 답한 문제가 있었다. "~는 뭐야?"류
    // 표현은 새로운 대상을 스스로 밝히는 질문(=완전히 새로운 화제)일 가능성이
    // 높으므로, 이런 표현이 있으면 퀴즈 답변 시도로 보지 않고 새 질문으로
    // 넘긴다. 반대로 "12가 되게 하려면...되는거야?"처럼 방금 낸 문제의 코드/
    // 변수를 그대로 언급하며 확인을 구하는 문장에는 "뭐"/"무엇" 같은 표현이
    // 없으므로 여기 걸리지 않고, 기존처럼 "보기 번호로 답해달라"는 안내로
    // 이어진다.
    private static final String[] NEW_QUESTION_MARKERS = {"뭐", "무엇", "뭔가", "무슨"};

    public static boolean looksLikeNewQuestion(String rawMessage) {
        String normalized = normalize(rawMessage);
        for (String marker : NEW_QUESTION_MARKERS) {
            if (normalized.contains(marker)) {
                return true;
            }
        }
        return false;
    }

    private static String toCircledOption(String option) {
        if (Character.isDigit(option.charAt(0))) {
            int index = Integer.parseInt(option) - 1;
            return String.valueOf(CIRCLED_DIGITS[index]);
        }
        return option;
    }

    // 18단계: "지금 제일 인기있는 방송이 뭐야?"는 Qwen의 일반 지식(YouTube 등)이
    // 아니라 EASYS 실제 DB(StreamingStudio.viewers)로 답해야 한다.
    private static final String[] POPULARITY_MARKERS = {"인기", "제일", "가장", "탑"};
    private static final String[] STREAM_WORD_MARKERS = {"방송", "스트리밍", "스트리머"};

    public static boolean isPopularStreamQuestion(String rawMessage) {
        String normalized = normalize(rawMessage);
        boolean mentionsStream = false;
        for (String word : STREAM_WORD_MARKERS) {
            if (normalized.contains(word)) {
                mentionsStream = true;
                break;
            }
        }
        if (!mentionsStream) {
            return false;
        }
        for (String marker : POPULARITY_MARKERS) {
            if (normalized.contains(marker)) {
                return true;
            }
        }
        return false;
    }

    // 19단계: "커뮤니티 글중에 제일 인기있는글은 뭐야?"도 인기 방송과 마찬가지로
    // 실제 DB(PostLike 집계)로 답해야 한다. POPULARITY_MARKERS는 위 인기 방송
    // 판단과 공유한다.
    private static final String[] POST_WORD_MARKERS = {"글", "게시글", "게시물", "포스트"};

    public static boolean isPopularPostQuestion(String rawMessage) {
        String normalized = normalize(rawMessage);
        boolean mentionsPost = false;
        for (String word : POST_WORD_MARKERS) {
            if (normalized.contains(word)) {
                mentionsPost = true;
                break;
            }
        }
        if (!mentionsPost) {
            return false;
        }
        for (String marker : POPULARITY_MARKERS) {
            if (normalized.contains(marker)) {
                return true;
            }
        }
        return false;
    }

    // 질문이 어떤 EASYS 기능에 관한 것인지 판단한다. 정확히 일치하면 typo=false,
    // 오타로 보여 자모 단위 편집거리로 판단했다면 typo=true를 반환한다. 매칭이 없으면 null.
    public static Match match(String rawMessage) {
        String normalized = normalize(rawMessage);
        if (normalized.isEmpty()) {
            return null;
        }

        for (FeatureCategory category : CATEGORIES) {
            for (String alias : category.aliases()) {
                if (normalized.contains(alias)) {
                    return new Match(category.code(), category.canonicalKeyword(), false);
                }
            }
        }

        for (FeatureCategory category : CATEGORIES) {
            String keywordJamo = decompose(category.canonicalKeyword());
            int threshold = Math.max(1, keywordJamo.length() / 3);
            if (containsFuzzy(normalized, keywordJamo, threshold)) {
                return new Match(category.code(), category.canonicalKeyword(), true);
            }
        }

        return null;
    }

    private static String normalize(String message) {
        if (message == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder(message.length());
        for (int i = 0; i < message.length(); i++) {
            char c = message.charAt(i);
            if (!Character.isWhitespace(c)) {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    // normalizedMessage(공백 제거된 원문)를 자모로 분해한 뒤, keywordJamoPattern과
    // 가장 가까운 구간(윈도우)의 편집거리가 threshold 이하인지 검사한다.
    private static boolean containsFuzzy(String normalizedMessage, String keywordJamoPattern, int threshold) {
        if (keywordJamoPattern.isEmpty()) {
            return false;
        }

        String messageJamo = decompose(normalizedMessage);
        if (messageJamo.contains(keywordJamoPattern)) {
            return true;
        }

        int kw = keywordJamoPattern.length();
        int minLen = Math.max(1, kw - threshold - 1);
        int maxLen = kw + threshold + 1;

        for (int len = minLen; len <= maxLen; len++) {
            for (int start = 0; start + len <= messageJamo.length(); start++) {
                String window = messageJamo.substring(start, start + len);
                if (levenshtein(window, keywordJamoPattern) <= threshold) {
                    return true;
                }
            }
        }
        return false;
    }

    private static int levenshtein(String a, String b) {
        int[] prev = new int[b.length() + 1];
        int[] curr = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) {
            prev[j] = j;
        }

        for (int i = 1; i <= a.length(); i++) {
            curr[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                curr[j] = Math.min(Math.min(curr[j - 1] + 1, prev[j] + 1), prev[j - 1] + cost);
            }
            int[] tmp = prev;
            prev = curr;
            curr = tmp;
        }
        return prev[b.length()];
    }

    private static final char[] CHOSEONG = {
            'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
            'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
    };
    private static final char[] JUNGSEONG = {
            'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
            'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
    };
    private static final char[] JONGSEONG = {
            0, 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
            'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
            'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
    };

    // 완성된 한글 음절(가~힣)을 호환 자모(ㄱ,ㅏ 등) 시퀀스로 풀어 쓴다. 이미 낱자모이거나
    // 한글이 아닌 문자는 그대로 둔다.
    private static String decompose(String text) {
        StringBuilder sb = new StringBuilder(text.length() * 2);
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (c >= 0xAC00 && c <= 0xD7A3) {
                int offset = c - 0xAC00;
                int cho = offset / (21 * 28);
                int jung = (offset % (21 * 28)) / 28;
                int jong = offset % 28;
                sb.append(CHOSEONG[cho]);
                sb.append(JUNGSEONG[jung]);
                if (JONGSEONG[jong] != 0) {
                    sb.append(JONGSEONG[jong]);
                }
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }
}
