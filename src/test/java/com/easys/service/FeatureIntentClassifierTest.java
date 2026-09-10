package com.easys.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

// 작업 요구사항 11번 테스트 시나리오(3~12번)를 그대로 검증한다. Gemini 호출 없이
// 순수 문자열 판단 로직(FeatureIntentClassifier)만 확인한다.
class FeatureIntentClassifierTest {

    @Test
    void 정확한_기능명은_오타없이_바로_매칭된다() {
        FeatureIntentClassifier.Match match = FeatureIntentClassifier.match("멘토링은 어떻게 신청해?");
        assertEquals("MENTORING", match.category());
        assertFalse(match.typo());
    }

    @Test
    void 자모가_흩어진_오타도_멘토링으로_인식한다() {
        FeatureIntentClassifier.Match match = FeatureIntentClassifier.match("멪토링 신청 어떻게 해?");
        assertEquals("MENTORING", match.category());
        assertTrue(match.typo());
    }

    @Test
    void 한글자_치환_오타도_멘토링으로_인식한다() {
        FeatureIntentClassifier.Match match = FeatureIntentClassifier.match("메토링 어디서 해?");
        assertEquals("MENTORING", match.category());
        assertTrue(match.typo());
    }

    @Test
    void 낱자모가_섞인_오타도_멘토링으로_인식한다() {
        FeatureIntentClassifier.Match match = FeatureIntentClassifier.match("멘ㅅㅅ토링 어떻게 신청해?");
        assertEquals("MENTORING", match.category());
        assertTrue(match.typo());
    }

    @Test
    void 공백과_낱자모가_섞인_오타도_인식한다() {
        FeatureIntentClassifier.Match match = FeatureIntentClassifier.match("ㅁ ㅔ토리 신청은 어떻게 해?");
        assertEquals("MENTORING", match.category());
        assertTrue(match.typo());
    }

    @Test
    void 일정이라는_동의어로도_캘린더를_인식한다() {
        FeatureIntentClassifier.Match match = FeatureIntentClassifier.match("내 일정 어디서 봐?");
        assertEquals("CALENDAR", match.category());
        assertFalse(match.typo());
    }

    @Test
    void 스트리밍_질문을_인식한다() {
        FeatureIntentClassifier.Match match = FeatureIntentClassifier.match("스트리밍은 어떻게 봐?");
        assertEquals("STREAMING", match.category());
    }

    @Test
    void 스터디_예약_질문을_인식한다() {
        FeatureIntentClassifier.Match match = FeatureIntentClassifier.match("스터디 예약은 어떻게 해?");
        assertEquals("STUDY", match.category());
    }

    @Test
    void 커뮤니티_질문을_인식한다() {
        FeatureIntentClassifier.Match match = FeatureIntentClassifier.match("커뮤니티는 뭐야?");
        assertEquals("COMMUNITY", match.category());
    }

    @Test
    void 관련없는_질문은_매칭되지_않는다() {
        assertNull(FeatureIntentClassifier.match("자바가 뭐야?"));
        assertFalse(FeatureIntentClassifier.isBestMentorQuestion("자바가 뭐야?"));
    }

    @Test
    void 최고의_멘토_질문_다양한_표현을_인식한다() {
        assertTrue(FeatureIntentClassifier.isBestMentorQuestion("이 웹에서 최고의 멘토는 누구야?"));
        assertTrue(FeatureIntentClassifier.isBestMentorQuestion("여기서 제일 좋은 멘토가 누구야?"));
        assertTrue(FeatureIntentClassifier.isBestMentorQuestion("이곳에서 가장 좋은 멘토는?"));
        assertTrue(FeatureIntentClassifier.isBestMentorQuestion("EASYS 최고의 멘토 누구야?"));
        assertTrue(FeatureIntentClassifier.isBestMentorQuestion("멘토 추천해줘"));
        assertTrue(FeatureIntentClassifier.isBestMentorQuestion("여기서 제일 잘하는 멘토가 누구야?"));
    }

    @Test
    void 최고의_멘토가_아닌_일반_멘토링_질문은_구분한다() {
        assertFalse(FeatureIntentClassifier.isBestMentorQuestion("멘토링은 어떻게 신청해?"));
    }

    @Test
    void EASYS_이름이나_이지스로_물으면_정체성_질문으로_인식한다() {
        assertTrue(FeatureIntentClassifier.isEasysIdentityQuestion("EASYS가 뭐야?"));
        assertTrue(FeatureIntentClassifier.isEasysIdentityQuestion("easys가 뭐야?"));
        assertTrue(FeatureIntentClassifier.isEasysIdentityQuestion("이지스가 뭐야?"));
        assertTrue(FeatureIntentClassifier.isEasysIdentityQuestion("이지스 홈페이지가 뭐야?"));
        assertTrue(FeatureIntentClassifier.isEasysIdentityQuestion("우리 홈페이지는 뭐 하는 곳이야?"));
    }

    @Test
    void 여기나_이곳은_정체성_질문_마커와_함께_있을때만_인식한다() {
        assertTrue(FeatureIntentClassifier.isEasysIdentityQuestion("여기 뭐하는 사이트야?"));
        assertTrue(FeatureIntentClassifier.isEasysIdentityQuestion("이곳에서 뭘 할 수 있어?"));
        assertFalse(FeatureIntentClassifier.isEasysIdentityQuestion("여기서 제일 좋은 멘토가 누구야?"));
    }

    @Test
    void 관련없는_질문은_정체성_질문으로_인식되지_않는다() {
        assertFalse(FeatureIntentClassifier.isEasysIdentityQuestion("자바가 뭐야?"));
        assertFalse(FeatureIntentClassifier.isEasysIdentityQuestion("멘토링은 어떻게 신청해?"));
    }

    // 17단계: 실제 사용자 테스트에서 발견된 문제들을 검증하기 위해 추가한 판별
    // 로직들이다.

    @Test
    void 인사와_감정_표현은_캐주얼_대화로_인식한다() {
        assertTrue(FeatureIntentClassifier.isCasualChat("반갑다"));
        assertTrue(FeatureIntentClassifier.isCasualChat("안녕"));
        assertTrue(FeatureIntentClassifier.isCasualChat("고마워"));
        assertTrue(FeatureIntentClassifier.isCasualChat("모르는 걸 질문하는 게 부끄러워"));
        assertFalse(FeatureIntentClassifier.isCasualChat("멘토링은 어떻게 신청해?"));
    }

    @Test
    void 이동_요청은_이용_방법_질문과_구분된다() {
        assertTrue(FeatureIntentClassifier.isNavigationRequest("나를 멘토링 페이지로 이동시켜줘"));
        assertTrue(FeatureIntentClassifier.isNavigationRequest("캘린더 보여줘"));
        assertFalse(FeatureIntentClassifier.isNavigationRequest("멘토링은 어떻게 신청해?"));
    }

    @Test
    void 가르치는_의도도_멘토링으로_인식한다() {
        assertTrue(FeatureIntentClassifier.isTeachIntent("나도 누군가를 가르칠 수 있어?"));
        assertTrue(FeatureIntentClassifier.isTeachIntent("내가 잘하는걸 가르쳐도 될까?"));
        assertFalse(FeatureIntentClassifier.isTeachIntent("멘토링은 어떻게 신청해?"));
    }

    @Test
    void 뭘_배워야_할지_모르는_질문을_탐색형으로_인식한다() {
        assertTrue(FeatureIntentClassifier.isLearningExplorationQuestion("나는 뭘 배워야 할지 모르겠어"));
        assertFalse(FeatureIntentClassifier.isLearningExplorationQuestion("자바가 뭐야?"));
    }

    @Test
    void 방송_시청과_생성_의도를_구분한다() {
        assertEquals(FeatureIntentClassifier.StreamingIntent.VIEW,
                FeatureIntentClassifier.matchStreamingIntent("방송 보고 싶어"));
        assertEquals(FeatureIntentClassifier.StreamingIntent.CREATE,
                FeatureIntentClassifier.matchStreamingIntent("방송 만들고 싶어"));
        assertNull(FeatureIntentClassifier.matchStreamingIntent("스트리밍은 뭐야?"));
    }

    @Test
    void 그룹_스터디와_카페_예약을_studyTopic으로_정확히_구분한다() {
        assertEquals(FeatureIntentClassifier.StudyTopic.GROUP_STUDY,
                FeatureIntentClassifier.matchStudyTopic("스터디는 어떻게 참여해?"));
        assertEquals(FeatureIntentClassifier.StudyTopic.CAFE_RESERVATION,
                FeatureIntentClassifier.matchStudyTopic("카페에서 공부할 공간 예약하고 싶어"));
        assertNull(FeatureIntentClassifier.matchStudyTopic("스터디 어디서 구함"));
        assertEquals(FeatureIntentClassifier.StudyTopic.GROUP_STUDY,
                FeatureIntentClassifier.matchStudyTopic("그룹 스터디요"));
    }

    @Test
    void 내_일정_질문을_개인_데이터_질문으로_인식한다() {
        assertTrue(FeatureIntentClassifier.isPersonalScheduleQuestion("내 일정 보여줘"));
        assertFalse(FeatureIntentClassifier.isPersonalScheduleQuestion("캘린더는 뭐야?"));
    }

    // 18단계: 실제 사용자 테스트에서 발견된 문제들을 검증하기 위해 추가한 판별
    // 로직들이다.

    @Test
    void 일정_질문의_기본_범위는_다가오는_일정이다() {
        assertEquals(FeatureIntentClassifier.ScheduleRange.UPCOMING,
                FeatureIntentClassifier.matchScheduleRange("내 일정 보여줘"));
        assertEquals(FeatureIntentClassifier.ScheduleRange.PAST,
                FeatureIntentClassifier.matchScheduleRange("지난 일정 보여줘"));
        assertEquals(FeatureIntentClassifier.ScheduleRange.TODAY,
                FeatureIntentClassifier.matchScheduleRange("오늘 일정 보여줘"));
        assertEquals(FeatureIntentClassifier.ScheduleRange.THIS_WEEK,
                FeatureIntentClassifier.matchScheduleRange("이번 주 일정 보여줘"));
        assertEquals(FeatureIntentClassifier.ScheduleRange.RECENT_CREATED,
                FeatureIntentClassifier.matchScheduleRange("방금 내가 등록해달라고 한 일정"));
    }

    @Test
    void 내_이름이_뭐야_질문을_인식한다() {
        assertTrue(FeatureIntentClassifier.isNameQuestion("내 이름이 뭐야?"));
        assertFalse(FeatureIntentClassifier.isNameQuestion("멘토링 어떻게 해?"));
    }

    @Test
    void 기억해_요청에서_이름만_정확히_추출한다() {
        assertEquals("0ho", FeatureIntentClassifier.extractNameToRemember("0ho야 기억해"));
        assertEquals("0ho", FeatureIntentClassifier.extractNameToRemember("내 이름은 0ho야. 기억해"));
        assertNull(FeatureIntentClassifier.extractNameToRemember("멘토링 어떻게 해?"));
        assertNull(FeatureIntentClassifier.extractNameToRemember("오늘 날씨 좋다야"));
    }

    @Test
    void 이름_잊기_요청과_일반_잊기_요청을_구분한다() {
        assertTrue(FeatureIntentClassifier.isForgetNameRequest("내 이름 기억하지 마"));
        assertFalse(FeatureIntentClassifier.isForgetNameRequest("그거 잊어줘"));
        assertTrue(FeatureIntentClassifier.isGenericForgetRequest("그거 잊어줘"));
        assertFalse(FeatureIntentClassifier.isGenericForgetRequest("내 이름 기억하지 마"));
    }

    @Test
    void 학습_문제_출제_과목을_인식한다() {
        assertTrue(FeatureIntentClassifier.isQuizRequest("자바 문제 몇 개 내줘"));
        assertEquals(FeatureIntentClassifier.QuizSubject.JAVA,
                FeatureIntentClassifier.matchQuizSubject("자바 문제 몇 개 내줘"));
        assertEquals(FeatureIntentClassifier.QuizSubject.DB_SQL,
                FeatureIntentClassifier.matchQuizSubject("SQL 문제 몇 개 내줘"));
        assertEquals(FeatureIntentClassifier.QuizSubject.SPRING,
                FeatureIntentClassifier.matchQuizSubject("스프링 문제 내줘"));
        assertEquals(FeatureIntentClassifier.QuizSubject.REACT,
                FeatureIntentClassifier.matchQuizSubject("리액트 문제 내줘"));
        assertNull(FeatureIntentClassifier.matchQuizSubject("문제 좀 내줘"));
    }

    @Test
    void 인기_방송_질문을_인식하고_일반_방송_질문과_구분한다() {
        assertTrue(FeatureIntentClassifier.isPopularStreamQuestion("지금 제일 인기있는 방송이 뭐야?"));
        assertTrue(FeatureIntentClassifier.isPopularStreamQuestion("스트리밍 하는 사람중에 제일 인기좋은 사람이 누구야"));
        assertFalse(FeatureIntentClassifier.isPopularStreamQuestion("방송 보고 싶어"));
    }

    // 19단계: 실제 사용자 테스트(상태 관리/화제 전환)에서 발견된 문제들을 검증하기
    // 위해 추가한 판별 로직들이다.

    @Test
    void 내가_등록한_멘토링_질문을_일반_이용_방법_질문과_구분한다() {
        assertTrue(FeatureIntentClassifier.isMyMentoringQuestion("내가 등록한 멘토링은?"));
        assertTrue(FeatureIntentClassifier.isMyMentoringQuestion("내가 신청한 멘토링 목록 보여줘"));
        assertFalse(FeatureIntentClassifier.isMyMentoringQuestion("멘토링은 어떻게 신청해?"));
    }

    @Test
    void 인기_게시글_질문을_인식한다() {
        assertTrue(FeatureIntentClassifier.isPopularPostQuestion("커뮤니티 글중에 제일 인기있는글은 뭐야?"));
        assertFalse(FeatureIntentClassifier.isPopularPostQuestion("글 어떻게 써?"));
    }

    @Test
    void 대화_삭제_요청을_다른_삭제_요청과_구분한다() {
        assertTrue(FeatureIntentClassifier.isDeleteHistoryRequest("지금까지 대화 다 지워줘"));
        assertTrue(FeatureIntentClassifier.isDeleteHistoryRequest("채팅 기록 삭제해줘"));
        assertFalse(FeatureIntentClassifier.isDeleteHistoryRequest("예약 삭제해줘"));
    }

    @Test
    void 문맥_이어받기_표현을_판단한다() {
        assertTrue(FeatureIntentClassifier.looksLikeContextContinuation("그럼 결제 안 해도 돼?"));
        assertTrue(FeatureIntentClassifier.looksLikeContextContinuation("등록이 되면 끝이야?"));
        assertFalse(FeatureIntentClassifier.looksLikeContextContinuation("java"));
        assertFalse(FeatureIntentClassifier.looksLikeContextContinuation("http"));
    }

    @Test
    void 여긴_같은_축약형도_정체성_질문으로_인식한다() {
        assertTrue(FeatureIntentClassifier.isEasysIdentityQuestion("여긴 뭐하는 곳이야?"));
    }

    @Test
    void 이동해줘_형태도_이동_요청으로_인식한다() {
        assertTrue(FeatureIntentClassifier.isNavigationRequest("캘린더로 이동해줘"));
        assertTrue(FeatureIntentClassifier.isNavigationRequest("멘토링 페이지로 이동시켜줘"));
    }

    // 20단계: 실제 브라우저 테스트에서 "자바 문제 하나만 내봐"에 5문제가 나오던
    // 문제를 검증하기 위해 추가한 판별 로직들이다.

    @Test
    void 문제_개수를_지정하지_않으면_기본값은_1이다() {
        assertEquals(1, FeatureIntentClassifier.parseQuizCount("자바 문제 하나만 내봐"));
        assertEquals(1, FeatureIntentClassifier.parseQuizCount("문제 하나만 내줘"));
        assertEquals(1, FeatureIntentClassifier.parseQuizCount("자바 문제 내줘"));
    }

    @Test
    void 문제_개수를_명시하면_그_개수를_그대로_쓴다() {
        assertEquals(5, FeatureIntentClassifier.parseQuizCount("5문제 내줘"));
        assertEquals(5, FeatureIntentClassifier.parseQuizCount("문제 5개 내줘"));
        assertEquals(10, FeatureIntentClassifier.parseQuizCount("10문제 내줘"));
        assertEquals(10, FeatureIntentClassifier.parseQuizCount("100문제 내줘"));
    }

    @Test
    void 원문자나_숫자로_된_짧은_답만_퀴즈_정답_입력으로_인식한다() {
        assertEquals("②", FeatureIntentClassifier.matchQuizAnswerOption("②"));
        assertEquals("②", FeatureIntentClassifier.matchQuizAnswerOption("2"));
        assertEquals("②", FeatureIntentClassifier.matchQuizAnswerOption("2번"));
        assertEquals("②", FeatureIntentClassifier.matchQuizAnswerOption("정답은 2번이야"));
        assertNull(FeatureIntentClassifier.matchQuizAnswerOption("내 일정 보여줘"));
        assertNull(FeatureIntentClassifier.matchQuizAnswerOption("2024년에 시작했어"));
    }

    // 21단계: 실제 브라우저 테스트에서 "음, 계산해보면 ②번이 맞는 것 같아요"처럼
    // 설명과 함께 보기 번호를 말한 답변이 채점으로 이어지지 않고 일반 대화로
    // 새어나가던 문제를 검증한다.
    @Test
    void 설명과_함께_보기_번호를_말해도_퀴즈_정답으로_인식한다() {
        assertEquals("②", FeatureIntentClassifier.matchQuizAnswerOption("음, 계산해보면 ②번이 맞는 것 같아요"));
        assertEquals("②", FeatureIntentClassifier.matchQuizAnswerOption("2를 더하면 12가 되니까 2번 아닐까요?"));
        assertNull(FeatureIntentClassifier.matchQuizAnswerOption("이 문제는 3번째로 다시 풀어볼게요"));
        assertNull(FeatureIntentClassifier.matchQuizAnswerOption("버스 13번 타고 가면 돼"));
    }

    @Test
    void 보기_번호_없는_순수_자연어_설명은_퀴즈_정답으로_인식하지_않는다() {
        assertNull(FeatureIntentClassifier.matchQuizAnswerOption(
                "12가 되게 하려면 2를 더하는 int num = 2; 변수를 하나더 더 정해서 score + num 하며 되는거야?"));
    }

    // 22단계: 퀴즈 채점 대기 중 완전히 무관한 새 질문("HTTP 상태코드 200이
    // 뭐야?")이 왔을 때, 보기 번호가 없다는 이유만으로 퀴즈 답변 시도로
    // 오인해서는 안 된다. "~는 뭐야?"류 표현은 새 화제로 본다.
    @Test
    void 뭐야로_끝나는_질문은_새_질문으로_인식한다() {
        assertTrue(FeatureIntentClassifier.looksLikeNewQuestion("HTTP 상태코드 200이 뭐야?"));
        assertTrue(FeatureIntentClassifier.looksLikeNewQuestion("REST API가 무엇인가요?"));
        assertFalse(FeatureIntentClassifier.looksLikeNewQuestion(
                "12가 되게 하려면 2를 더하는 int num = 2; 변수를 하나더 더 정해서 score + num 하며 되는거야?"));
        assertFalse(FeatureIntentClassifier.looksLikeNewQuestion("②"));
    }
}
