package com.easys.service;

import com.easys.dto.ActionDto;
import com.easys.dto.AiChatHistoryItemDto;
import com.easys.dto.AiChatResponseDto;
import com.easys.dto.MentorProfileResponseDto;
import com.easys.entity.AiChatMessage;
import com.easys.entity.CommunityPost;
import com.easys.entity.Member;
import com.easys.entity.MentorProfile;
import com.easys.entity.MentoringOffering;
import com.easys.entity.MentoringReservation;
import com.easys.entity.MentoringReservationStatus;
import com.easys.entity.PersonalSchedule;
import com.easys.entity.StreamingStudio;
import com.easys.repository.AiChatMessageRepository;
import com.easys.repository.MentorProfileRepository;
import com.easys.repository.MentoringOfferingRepository;
import com.easys.repository.MentoringReservationRepository;
import com.easys.repository.PostLikeRepository;
import com.easys.repository.StreamingStudioRepository;
import com.easys.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatService {

    // 15단계: Gemini 제거 이후, Qwen(Ollama)에게 전달하는 EASYS 전용 시스템 프롬프트.
    //
    // 역할 분리(12단계 이후 유지):
    //   - System Prompt(여기, EASYS_PROMPT_COMMON) = AI가 항상 지켜야 할 "행동 규칙"만.
    //   - Knowledge(EasysKnowledgeService/EasysKnowledge) = EASYS의 실제 기능/정책 "정보".
    //   - Redis(ChatSessionService) = 단기 대화 문맥.
    //   - DB(AiUserMemory/AiChatMessage, 18단계 신규) = 로그아웃해도 사라지면 안 되는
    //     장기 기억과 영구 채팅 기록.
    private static final String EASYS_PROMPT_COMMON = """
            당신은 EASYS라는 학습 플랫폼 안에 있는 친절한 AI 도우미입니다.

            [말투]
            - 항상 자연스러운 한국어 존댓말로, 친절하고 부드럽게 답하세요. 명령하듯
              단답으로 끝내지 말고, 처음 온 사람에게 설명해주는 느낌으로 답하세요.
            - 사람을 부를 때, 이번 대화에서 실제로 알려준 이름이 있다면 그 이름 뒤에
              한국어 "님"만 붙이세요. 이름을 모르면 지어내거나 예시 이름을 쓰지 말고,
              이름 없이 "사용자님" 또는 이름 없는 자연스러운 문장으로 답하세요.
            - "EASYS" 뒤에 조사를 붙일 때는 "EASYS는", "EASYS에서", "EASYS를"처럼
              자연스러운 한국어 조사를 쓰세요("EASYS은"처럼 잘못된 조사를 쓰지 마세요).
            - 문장을 끝낼 때는 한국어 마침표(.)만 쓰세요. 중국어/일본어에서 쓰는
              전각 문장부호(。、！？ 등)는 절대 쓰지 마세요.
            - 한자(중국어 문자)나 일본어 문자(가나)는 단 하나도 섞지 마세요. 서비스/
              기술 고유명사(EASYS, Qwen, Redis, React, Spring Boot 등)는 필요하면 영문
              그대로 써도 되지만, 문장 자체를 중국어나 영어로 쓰지 마세요. 사용자가
              "영어로 답변해줘"처럼 명시적으로 요청한 경우에만 그 이후 영어로 답하고,
              사용자가 "한국어로 해줘"라고 하면 즉시 한국어로 돌아오세요. 요청이 없으면
              항상 한국어입니다.
            - 사용자는 지금 이미 EASYS 웹사이트 안에서 이 챗봇과 대화하고 있습니다.
              "EASYS 웹사이트로 접속하세요" 같은 말은 하지 마세요.

            [답변 길이와 구성]
            질문의 성격에 맞게 답변 길이를 조절하세요.
            - 단순한 사실 질문: 결론을 먼저 말하고, 필요한 배경을 1~2문장 더 붙이세요.
            - "~는 어떻게 해?"처럼 이용 방법을 묻는 질문: 시작 지점 → 진행 순서 →
              마지막에 확정/완료되는 방식까지 순서대로 설명하세요.
            - "처음인데", "잘 모르겠어"처럼 처음 이용하는 사람으로 보이는 질문: 기본
              설명과 함께 지금 무엇부터 하면 되는지도 안내하세요.
            - 짧은 후속 질문은 이전 대화 주제를 이어받아 필요한 부분만 답하세요.
              이전 답변에서 이미 번호를 붙여 설명한 절차를 처음부터 다시 나열하지
              마세요.
            한 문장으로 끝내는 답변은 피하되, 참고 지식에 없는 내용을 채우기 위해
            불필요하게 길게 늘리지는 마세요. 참고 지식에 있는 내용이라도, 그것이
            원래 일반적으로 무엇인지 사전적으로 설명하지 말고 EASYS 안에서 실제로
            어떻게 동작하는지부터 바로 답하세요.

            [사실 기반 답변]
            - 아래에 "EASYS 관련 참고 지식"이 함께 주어지면, 오직 그 내용에 실제로
              적혀 있는 것만 사실로 간주하고 답하세요. 참고 지식에 적혀 있지 않은
              구체적인 내용(가격, 기간, 숫자, 연락 방법 등)은 그것이 있는지 없는지도
              모른다는 뜻입니다 - "정확히 확인이 어렵다"고만 답하고, 절대 새로운
              내용을 만들어 채우지 마세요.
            - 참고 지식이 함께 주어지지 않은 질문은 EASYS와 무관한 일반 지식 질문일
              수 있습니다(예: 프로그래밍 언어, 기술 용어 등). 이런 질문에는 알고
              있는 일반 지식으로 자연스럽게 답하세요. 다만 EASYS의 구체적인 기능이나
              정책은 지어내지 마세요.
            - 잘 알지 못하는 이름이나 용어가 나오면, 아는 척하며 뜻을 지어내지 말고
              정확히 어떤 뜻으로 말씀하신 건지 확인이 어렵다고 답하며 되물어보세요.
              특히 잘 모르는 용어를 EASYS의 기능이나 기술이라고 단정하지 마세요.
            - EASYS가 특정 언어나 주제를 다루지 않는다고 단정하지 말고, 멘토링과
              스터디는 특정 기술에 한정되지 않는다고 안내하세요. 사용자에게 EASYS가
              아닌 다른 사이트를 찾아가라고 권하지 마세요.
            - 답변에 URL이나 링크를 포함하지 마세요.
            """;

    // 17단계: 인사/감사/감정 표현처럼 EASYS 지식이 전혀 필요 없는 대화 전용 프롬프트.
    private static final String CASUAL_PROMPT = """
            당신은 EASYS라는 학습 플랫폼 안에 있는 친근한 AI 도우미입니다. 지금
            사용자는 EASYS 기능을 물어보는 것이 아니라 가벼운 인사나 감정을
            표현하고 있습니다.

            - 짧고 친근하게, 자연스러운 한국어 존댓말로 답하세요.
            - EASYS 소개나 기능 설명을 억지로 붙이지 마세요. 사용자가 실제로
              기능을 물어보면 그때 설명하면 됩니다.
            - 사용자가 힘들다/부끄럽다/모르겠다처럼 감정을 표현하면, 먼저 공감하고
              편하게 이야기할 수 있다는 느낌을 주세요.
            - 한자(중국어)나 일본어 문자, 전각 문장부호(。、！？)는 쓰지 마세요.
            """;

    // 18단계: "자바 문제 몇 개 내줘" 같은 학습 문제 출제는 EASYS 기능이 아니라
    // Qwen의 일반 지식 영역이다. 이 요청은 Redis 대화 기록을 전달하지 않고
    // (askQwen 호출 시 history를 빈 리스트로 넘김) 완전히 새로 시작한다 - 그래야
    // "방송 보고 싶어" 다음에 "자바 문제 내줘"를 물어도 스트리밍 얘기가 절대
    // 섞이지 않는다(이번 질문에는 이전 문맥이 필요 없다는 것을 구조적으로 보장).
    // 20단계 실제 브라우저 테스트에서 발견: "자바 문제 하나만 내봐"에 5문제가
    // 나오고, 문제 뒤에 "이 코드의 결과는 2입니다"처럼 정답까지 바로 공개되는
    // 문제가 있었다. 문제 개수는 이제 이 프롬프트가 아니라 애플리케이션
    // (FeatureIntentClassifier.parseQuizCount + buildQuizReply)이 정확한 개수를
    // 계산해서 매번 "정확히 N개"라고 명시적으로 요청한다 - "몇 개 내주세요"처럼
    // 모호하게 맡기지 않는다.
    //
    // 정답 비공개는 "말하지 마세요"라는 프롬프트 지시만으로는 3B급 소형 모델이
    // 실제로 지키지 않는 것을 확인했다(위 재현 사례). 그래서 문제가 1개일 때는
    // 아예 정답/해설을 별도 마커(QUIZ_ANSWER_MARKER/QUIZ_EXPLANATION_MARKER) 뒤에
    // 쓰게 하고, buildQuizReply가 그 마커 뒤쪽을 통째로 잘라내 사용자에게는 절대
    // 보여주지 않는다(문제 본문만 전달) - 즉 "정답을 말하지 않는다"를 프롬프트가
    // 아니라 애플리케이션 코드가 강제한다. 정답은 사용자가 답을 입력한 뒤에만
    // buildQuizJudgeReply가 꺼내 쓴다.
    private static final String QUIZ_ANSWER_MARKER = "<<<ANSWER>>>";
    private static final String QUIZ_EXPLANATION_MARKER = "<<<EXPLANATION>>>";

    // 21단계 실제 브라우저 테스트에서 발견: "객관식이면 보기를 붙이세요"처럼
    // 조건부로만 지시하니 Qwen이 종종 "score가 12가 되도록 코드를 완성하세요"
    // 같은 주관식(코드 완성형) 문제를 냈다. 그런데 채점(matchQuizAnswerOption)은
    // "②"/"2번"처럼 객관식 보기 응답만 인식하므로, 문제 형식과 채점 방식이 서로
    // 어긋나 사용자의 자연어 답변("...하면 되는거야?")이 퀴즈 채점으로 들어가지
    // 못하고 그대로 일반 Qwen 대화로 새어나가 AI가 마음대로 정답 코드를
    // 만들어주는 사고로 이어졌다. 근본 해결책은 "채점 로직이 받을 수 있는 형태로
    // 문제를 강제로 통일"하는 것 - 코드 완성형/주관식을 아예 금지하고 항상 4지
    // 선다 객관식만 내게 한다(가장 단순하고 안정적인 방향).
    private static final String QUIZ_PROMPT_SINGLE = """
            당신은 EASYS 학습 플랫폼의 AI 학습 도우미입니다. 지금은 EASYS 기능
            설명이 아니라, 사용자가 요청한 과목의 연습 문제를 출제해야 합니다.

            아래 규칙을 반드시 그대로 지키세요.
            - 문제는 정확히 1개만 내세요. 절대로 2개 이상 내지 마세요.
            - 반드시 4지선다 객관식으로만 내세요. 보기는 항상 ①②③④ 4개를
              붙이세요.
            - "다음 코드를 완성하세요", "빈칸을 채우세요"처럼 사용자가 직접 코드를
              작성해야 하는 주관식/코드 완성형 문제는 절대 내지 마세요. 대신
              "다음 코드의 실행 결과는 무엇일까요?"처럼 이미 완성된 코드나 개념을
              보여주고 그 결과/정답을 보기 중에서 고르게 하세요.
            - 난이도가 지정되지 않았다면 초급~중급 정도의 기본 난이도로 내세요.
            - 필요하면 코드는 완성된 형태로 ```java 같은 코드 블록으로 보여주세요.
            - 문제 본문(마커 이전 부분)에는 정답, 힌트, 해설을 절대 포함하지 마세요.
            - 문제를 다 쓴 다음, 반드시 아래 형식 그대로 정답과 해설을 적으세요.
              이 아래 내용은 사용자에게 보이지 않고 시스템이 채점에만 사용합니다.

            %s
            (정답 보기 하나만, 예: ②)
            %s
            (정답인 이유를 1~2문장으로 간단히)

            - 한자(중국어)나 일본어 문자, 전각 문장부호(。、！？)는 쓰지 마세요.
            - 항상 자연스러운 한국어 존댓말로 답하세요.
            """.formatted(QUIZ_ANSWER_MARKER, QUIZ_EXPLANATION_MARKER);

    private static final String QUIZ_PROMPT_MULTI = """
            당신은 EASYS 학습 플랫폼의 AI 학습 도우미입니다. 지금은 EASYS 기능
            설명이 아니라, 사용자가 요청한 과목의 연습 문제를 출제해야 합니다.

            - 사용자 메시지에 적힌 개수만큼 정확히 문제를 내세요. 그보다 많이도,
              적게도 내지 마세요.
            - 반드시 4지선다 객관식으로만 내세요. 각 문제마다 보기를 ①②③④ 4개
              붙이세요. "다음 코드를 완성하세요"처럼 사용자가 직접 코드를 작성해야
              하는 주관식/코드 완성형 문제는 내지 마세요.
            - 요청받은 과목에 정확히 맞는 문제를 내세요.
            - 난이도가 지정되지 않았다면 초급~중급 정도의 기본 난이도로 내세요.
            - 문제는 번호를 붙여 나열하고, 각 문제는 간결하게 작성하세요.
            - 정답이나 해설은 사용자가 따로 요청하기 전에는 절대 먼저 알려주지
              마세요("결과는 O입니다", "정답은 O번입니다" 같은 문장을 쓰지 마세요).
            - 한자(중국어)나 일본어 문자, 전각 문장부호(。、！？)는 쓰지 마세요.
            - 항상 자연스러운 한국어 존댓말로 답하세요.
            """;

    // 20단계: 마커 파싱에 실패했을 때(모델이 형식을 안 지켰을 때)의 2차 안전장치.
    // 문제 본문에 이미 답이 새어 나온 문장을 애플리케이션이 정규식으로 찾아
    // 제거한다(기존 stripHallucinatedSentences와 같은 패턴).
    private static final Pattern QUIZ_ANSWER_LEAK_PATTERN = Pattern.compile(
            "정답은[^.!?\\n]*[①②③④0-9][^.!?\\n]*[.!?]?"
                    + "|결과는[^.!?\\n]*(입니다|이다|예요|이에요)[^.!?\\n]*[.!?]?"
                    + "|[①②③④0-9]\\s*번이?\\s*(정답|맞습니다|맞아요|맞다)[^.!?\\n]*[.!?]?"
    );

    private static final String QUIZ_ANSWER_PROMPT_LINE = "정답을 입력해 주세요. 예: ②";

    // 22단계: parseSingleQuizReply가 형식 위반(마커 누락/문제 중복/보기 개수
    // 불일치)을 감지했을 때 한 번만 재시도할 때 붙이는 지시문. 기존
    // FOREIGN_SCRIPT_RETRY_NOTE와 같은 패턴(같은 시스템 프롬프트 + 교정 지시
    // 한 줄만 추가)이다.
    private static final String QUIZ_FORMAT_RETRY_NOTE =
            "\n\n[중요] 방금 응답이 형식을 지키지 않았습니다(문제가 중복되었거나, 보기가 4개가 "
                    + "아니거나, 마커 형식이 틀렸습니다). 문제는 딱 1개만, 보기는 정확히 4개(①②③④)만, "
                    + "<<<ANSWER>>>/<<<EXPLANATION>>> 마커를 정확히 지켜서 처음부터 다시 작성하세요. "
                    + "방금 만들었던 문제를 반복하거나 다른 프로그래밍 언어로 다시 쓰지 마세요.";

    // 20단계: 마커 파싱에 실패해 정답을 구조적으로 뽑아내지 못했을 때만 쓰는
    // 채점 전용 프롬프트. 문제/정답 원문은 사용자에게 보여준 적이 없으므로,
    // 여기서 판정 결과만 새로 만들어서 그때 처음 보여준다.
    private static final String QUIZ_JUDGE_PROMPT = """
            당신은 EASYS 학습 플랫폼의 AI 학습 도우미입니다. 이미 출제된 문제에
            대해 사용자가 고른 답이 맞는지 판정해주세요.

            - "정답입니다" 또는 "정답이 아닙니다. 정답은 O번입니다"로 먼저 명확히
              답한 뒤, 간단한 해설을 1~2문장 덧붙이세요.
            - 한자(중국어)나 일본어 문자, 전각 문장부호(。、！？)는 쓰지 마세요.
            - 항상 자연스러운 한국어 존댓말로 답하세요.
            """;

    // 16단계: Qwen2.5 3B가 드물게 한자/가나/그 외 다른 문자 체계를 답변에 섞는
    // 것을 실제로 확인했다. 한글(가/힣, 자모)과 로마자(EASYS, Qwen 등 고유명사)는
    // 정상이므로 그대로 두고, 답변에 나올 일이 없는 문자 체계만 잡는다.
    private static final Pattern FOREIGN_SCRIPT_PATTERN = Pattern.compile(
            "[぀-ヿ一-鿿؀-ۿऀ-ॿЀ-ӿ฀-๿]"
    );

    private static final String FOREIGN_SCRIPT_RETRY_NOTE =
            "\n\n[중요] 방금 답변에 한자나 다른 나라 문자가 섞여 있었습니다. 그런 문자를 전혀 "
                    + "사용하지 말고, 순수 한국어 문장으로만 다시 답하세요.";

    private static final String FOREIGN_SCRIPT_SAFE_REPLY =
            "죄송합니다. 지금은 답변을 정확히 드리기 어렵습니다. 질문을 조금 더 구체적으로 "
                    + "다시 말씀해 주시겠어요?";

    private static final Map<Character, String> CJK_PUNCTUATION_REPLACEMENTS = Map.of(
            '。', ".",
            '、', ",",
            '！', "!",
            '？', "?",
            '：', ":",
            '；', ";"
    );

    private static final Map<String, String> EASYS_PARTICLE_FIXES = Map.of(
            "EASYS은", "EASYS는",
            "EASYS을", "EASYS를",
            "EASYS과", "EASYS와"
    );

    private static final Pattern REFUND_PERIOD_HALLUCINATION_PATTERN =
            Pattern.compile("환불.{0,30}\\d+\\s*(일|주|개월|년)|\\d+\\s*(일|주|개월|년).{0,30}환불");

    private static final String REFUND_SAFE_REPLY =
            "환불 기간은 정확히 확인이 어렵습니다. 현재 EASYS에는 별도로 정해진 환불 기간이나 "
                    + "절차가 마련되어 있지 않습니다. 결제는 토스페이먼츠를 통해 진행됩니다.";

    // 18단계 실제 API 테스트에서 발견: "별도의 문의 창구를 이용하시면" 같은 새로운
    // 표현으로도 문의 창구를 지어냈다("고객센터"라는 정확한 단어가 없어서 기존
    // 패턴에는 안 걸렸다) - "문의 창구"/"문의처" 자체를 넓게 잡는다.
    private static final Pattern INVENTED_CONTACT_CHANNEL_PATTERN =
            Pattern.compile("고객\\s*센터|고객\\s*지원|고객\\s*상담|관리자에게\\s*(연락|문의)|문의\\s*창구|문의처");

    private static final Pattern EASYS_WEBSITE_ACCESS_PATTERN =
            Pattern.compile("(EASYS|이지스)\\s*(웹사이트|사이트|홈페이지)(로|에)?\\s*(접속|이동)");

    private static final Pattern OTHER_SITE_RECOMMENDATION_PATTERN =
            Pattern.compile("다른\\s*\\S{0,6}\\s*(사이트|플랫폼|웹사이트|서비스).{0,15}(찾아|이용해|가보|알아보)");

    private static final Pattern CAFE_MENTION_IN_STREAMING_PATTERN = Pattern.compile("카페|스터디룸");

    // 18단계 실제 API 테스트에서 발견: knowledge 문구에서 "약어라는 근거가 없다"는
    // 말을 완전히 빼도, Qwen이 자체적으로 "이지스는 EASYS의 약어입니다"라고 지어낸
    // 사례가 있었다(부정 지시를 오히려 따라 말하는 작은 모델의 습성과 비슷하게,
    // "약어"라는 개념 자체에 끌리는 것으로 보임). "약어"라는 단어 자체는
    // HTTP/DB 같은 일반 지식 질문에서는 정상적으로 필요하므로 전체 금지하지
    // 않고, "이지스"/"EASYS" 근처에 나올 때만 그 문장을 제거한다.
    private static final Pattern EASYS_ABBREVIATION_HALLUCINATION_PATTERN =
            Pattern.compile("(이지스|EASYS)[^.!?]{0,15}약어|약어[^.!?]{0,15}(이지스|EASYS)");

    // 18단계: 실제 EASYS 라우트(App.jsx 기준)에 맞춘 action 표.
    //   STREAMING_VIEW      -> /streaming        (라이브 방송 목록/시청)
    //   STREAMING_CREATE    -> /streaming/cam    (방송 시작하기)
    //   STREAMING_ROOM      -> /streaming/cam?roomId=X (특정 방으로 바로 입장)
    //   STUDY_GROUP         -> /study
    //   STUDY_RESERVATION   -> /study-reservation
    // 실제 <Route path>는 여기서 만들지 않는다 - target 코드만 정하고, React
    // (AiChatbot.jsx)가 실제 경로로 바꾼다.
    private record ActionTarget(String target, String label, String navigationAck) {
        List<ActionDto> toActionList() {
            return List.of(new ActionDto("NAVIGATION", target, label));
        }
    }

    // 19단계: "문제 하나 내줘 → 어떤 과목? → java" 흐름에서 두 번째 턴이 "과목
    // 대답"임을 알기 위한 대기 상태 값. ChatSessionService가 Redis에 저장한다
    // (새 DB 테이블 없음). "한 번 쓰고 버리는" 상태라 값 자체는 이 하나뿐이다.
    // 20단계: "문제 하나만 내줘 → 어떤 과목? → java"에서 "하나만"이라는 개수
    // 정보가 두 번째 턴("java")까지 이어져야 한다. pendingState 값 자체는 문자열
    // 하나뿐이라, "QUIZ_WAITING_SUBJECT:1"처럼 개수를 뒤에 붙여서 함께 저장한다
    // (새 Redis 키를 추가하지 않고 기존 pendingState 값의 형식만 확장).
    private static final String QUIZ_WAITING_SUBJECT = "QUIZ_WAITING_SUBJECT";
    private static final String QUIZ_WAITING_SUBJECT_PREFIX = QUIZ_WAITING_SUBJECT + ":";

    // 20단계: 비로그인 사용자의 무료 체험 횟수. application.properties의
    // ai.guest.free-limit(기본 3회)/ai.guest.reset-hours(기본 24시간)로 조절한다.
    @Value("${ai.guest.free-limit:3}")
    private int guestFreeLimit;

    @Value("${ai.guest.reset-hours:24}")
    private long guestResetHours;

    private final MentorProfileService mentorProfileService;
    private final ChatSessionService chatSessionService;
    private final CustomLlmClient customLlmClient;
    private final EasysKnowledgeService easysKnowledgeService;
    private final PersonalScheduleService personalScheduleService;
    private final AiUserMemoryService aiUserMemoryService;
    private final AiChatMessageRepository aiChatMessageRepository;
    private final StreamingStudioRepository streamingStudioRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final MentoringOfferingRepository mentoringOfferingRepository;
    private final MentoringReservationRepository mentoringReservationRepository;
    private final PostLikeRepository postLikeRepository;

    public AiChatResponseDto ask(String message, String rawSessionId, String guestId, CustomUserDetails userDetails) {
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("질문 내용을 입력해주세요.");
        }

        String sessionId = chatSessionService.resolveSessionId(rawSessionId);

        // 20단계: 비로그인 사용자는 짧은 무료 체험(기본 3회) 후 회원가입을
        // 유도한다. "몇 번 남았는지"는 브라우저(localStorage)가 아니라 항상
        // 서버(Redis)의 카운터로만 판단한다 - 클라이언트 값은 guestId(식별자)로만
        // 쓰고 신뢰하지 않는다. IP는 여러 사람이 공유할 수 있어 식별에 쓰지
        // 않는다. 로그인 사용자는 이 제한과 완전히 무관하다.
        if (userDetails == null) {
            String effectiveGuestId = (guestId != null && !guestId.isBlank()) ? guestId : sessionId;
            if (chatSessionService.getGuestUsage(effectiveGuestId) >= guestFreeLimit) {
                return buildGuestLimitReachedReply(sessionId);
            }
            chatSessionService.incrementGuestUsage(effectiveGuestId, Duration.ofHours(guestResetHours));
        }

        // 19단계: "문제 하나 내줘 → 어떤 과목? → java" 흐름을 위한 대기 상태.
        // 이번 턴에서 즉시 읽고 지운다("한 번만 기다리는" 상태) - 그래야 이번
        // 결과와 무관하게 다음 턴에는 절대 남아있지 않는다. 실제로 그 상태를
        // 사용할지는 아래에서, 이번 입력이 다른 명확한 기능 요청에 전혀 해당하지
        // 않는다는 것이 확인된 뒤에 마지막으로 판단한다.
        String pendingState = chatSessionService.getPendingState(sessionId);
        chatSessionService.clearPendingState(sessionId);

        // 20단계: "문제 하나만 내줘 → ②" 흐름을 위한 채점 대기 상태도 같은
        // 방식으로 즉시 읽고 지운다. 실제로 채점에 쓸지는 아래에서 이번 메시지가
        // 다른 명확한 의도(예: "내 일정 보여줘")에 전혀 해당하지 않고, 정답
        // 입력처럼 보일 때만 마지막에 판단한다 - 그래야 퀴즈 채점 대기 상태가
        // 새로운 질문을 방해하지 않는다.
        ChatSessionService.QuizPending pendingQuiz = chatSessionService.getPendingQuiz(sessionId);
        chatSessionService.clearPendingQuiz(sessionId);

        // 18단계: 로그인 사용자의 개인 데이터/장기 기억 관련 요청을 가장 먼저
        // 결정적으로(Qwen 호출 없이) 처리한다 - hallucination 위험이 전혀 없다.
        // 이런 요청은 전부 "명확한 새 의도"이므로, 위에서 읽은 대기 상태와 무관하게
        // 항상 우선한다.

        if (FeatureIntentClassifier.isNameQuestion(message)) {
            return buildNameReply(message, sessionId, userDetails);
        }

        String nameToRemember = FeatureIntentClassifier.extractNameToRemember(message);
        if (nameToRemember != null) {
            return buildRememberNameReply(message, sessionId, userDetails, nameToRemember);
        }

        if (FeatureIntentClassifier.isForgetNameRequest(message)) {
            return buildForgetNameReply(message, sessionId, userDetails);
        }

        if (FeatureIntentClassifier.isGenericForgetRequest(message)) {
            return buildForgetGenericReply(message, sessionId, userDetails);
        }

        if (FeatureIntentClassifier.isGenericRememberRequest(message)) {
            return buildRememberNoteReply(message, sessionId, userDetails);
        }

        // 19단계: "지금까지 대화 다 지워줘" - 바로 지우지 않고 먼저 확인 Action을 준다.
        if (FeatureIntentClassifier.isDeleteHistoryRequest(message)) {
            return buildDeleteConfirmationReply(message, sessionId, userDetails);
        }

        // "내 일정 보여줘"는 RAG 지식(캘린더 기능 설명)이 아니라 로그인 사용자의
        // 실제 개인 일정 데이터로 답해야 한다.
        if (FeatureIntentClassifier.isPersonalScheduleQuestion(message)) {
            return buildPersonalScheduleReply(message, sessionId, userDetails);
        }

        // 19단계: "내가 등록한 멘토링은?"도 RAG(이용 방법 설명)가 아니라 실제
        // DB(MentorProfile/MentoringOffering/MentoringReservation)로 답해야 한다.
        if (FeatureIntentClassifier.isMyMentoringQuestion(message)) {
            return buildMyMentoringReply(message, sessionId, userDetails);
        }

        // 18단계: "지금 제일 인기있는 방송이 뭐야?"는 Qwen의 일반 지식(YouTube 등)이
        // 아니라 EASYS 실제 DB(StreamingStudio.viewers)로 답해야 한다.
        if (FeatureIntentClassifier.isPopularStreamQuestion(message)) {
            return buildPopularStreamReply(message, sessionId, userDetails);
        }

        // 19단계: "커뮤니티 글중에 제일 인기있는글은 뭐야?"도 실제 DB(PostLike
        // 집계)로 답해야 한다.
        if (FeatureIntentClassifier.isPopularPostQuestion(message)) {
            return buildPopularPostReply(message, sessionId, userDetails);
        }

        // "EASYS에서 최고의 멘토는 누구야?" 같은 질문은 LLM이 멘토 이름이나 별점을
        // 지어낼 위험이 있으므로, Qwen을 거치지 않고 DB에서 집계한 실제 데이터로
        // 서버가 답을 확정한다.
        if (FeatureIntentClassifier.isBestMentorQuestion(message)) {
            return buildBestMentorReply(sessionId);
        }

        // "나는 뭘 배워야 할지 모르겠어"류 질문에 일반적인 취업/기술 조언을 길게
        // 늘어놓던 문제 - 정답을 알려주는 대신 사용자에게 되물어 탐색하도록 고정된
        // 안내를 준다(Qwen 호출 없음, hallucination 위험 없음).
        if (FeatureIntentClassifier.isLearningExplorationQuestion(message)) {
            return buildLearningExplorationReply(message, sessionId, userDetails);
        }

        // 18단계: "자바 문제 몇 개 내줘"류 학습 문제 출제. EASYS RAG나 이전 대화
        // 문맥과 무관하게 완전히 새로 시작한다(아래 buildQuizReply 참고). 20단계:
        // 개수는 항상 사용자가 실제로 요청한 만큼만(기본값 1) - "하나만"이라고
        // 했는데 5문제가 나오던 문제의 원인이 바로 여기서 개수를 보지 않고
        // 고정값을 쓰던 것이었다.
        if (FeatureIntentClassifier.isQuizRequest(message)) {
            FeatureIntentClassifier.QuizSubject subject = FeatureIntentClassifier.matchQuizSubject(message);
            int requestedCount = FeatureIntentClassifier.parseQuizCount(message);
            if (subject == null) {
                chatSessionService.setPendingState(sessionId, QUIZ_WAITING_SUBJECT_PREFIX + requestedCount);
                return buildQuizClarificationReply(message, sessionId, userDetails);
            }
            return buildQuizReply(message, sessionId, userDetails, subject, requestedCount);
        }

        FeatureIntentClassifier.Match match = FeatureIntentClassifier.match(message);

        // "EASYS가 뭐야?"/"이지스가 뭐야?"/"여기 뭐하는 사이트야?"처럼 EASYS 서비스
        // 자체를 묻는 질문이면 EASYS_ABOUT으로 판단한다.
        if (match == null && FeatureIntentClassifier.isEasysIdentityQuestion(message)) {
            match = new FeatureIntentClassifier.Match("EASYS_ABOUT", "EASYS", false);
        }

        // "나도 누군가를 가르칠 수 있어?", "내가 잘하는 걸 가르쳐도 될까?"는
        // "멘토"/"멘토링"이라는 단어가 없어서 매칭되지 않았다. "가르치다" 계열
        // 표현도 멘토링으로 본다.
        if (match == null && FeatureIntentClassifier.isTeachIntent(message)) {
            match = new FeatureIntentClassifier.Match("MENTORING", "멘토링", false);
        }

        // "스터디 어디서 구함"처럼 그룹 스터디인지 카페(스터디룸) 예약인지 구분할
        // 단서가 전혀 없는 질문은, 이전 대화로도 주제를 특정할 수 없다면 AI가
        // 임의로 하나를 골라 답하지 않고 사용자에게 되물어야 한다.
        if (match != null && "STUDY".equals(match.category())
                && FeatureIntentClassifier.matchStudyTopic(message) == null) {
            List<ChatSessionService.ChatTurn> historyForClarify = chatSessionService.getHistory(sessionId);
            String previousUserMessage = findLastUserMessage(historyForClarify);
            FeatureIntentClassifier.StudyTopic fallbackTopic = previousUserMessage != null
                    ? FeatureIntentClassifier.matchStudyTopic(previousUserMessage)
                    : null;
            if (fallbackTopic == null) {
                return buildStudyClarificationReply(sessionId);
            }
        }

        // "나를 멘토링 페이지로 이동시켜줘"처럼 명백한 이동 요청에는 Qwen에게
        // 설명을 시키지 않고 짧게 안내만 한다 - 실제 이동은 actions로 처리한다.
        if (match != null && !match.typo() && FeatureIntentClassifier.isNavigationRequest(message)) {
            return buildNavigationReply(match, message, sessionId, userDetails);
        }

        // "반갑다", "안녕", "고마워"처럼 EASYS 지식이 전혀 필요 없는 대화는 EASYS
        // 소개가 없는 전용 프롬프트(CASUAL_PROMPT)로 짧고 자연스럽게 답한다.
        if (match == null && FeatureIntentClassifier.isCasualChat(message)) {
            return handleCasualChat(message, sessionId, userDetails);
        }

        // 20단계: "문제 하나만 내줘 → ②"에서 방금 낸 문제에 답하는 중인지 마지막에
        // 확인한다. 위의 모든 명확한 분기(개인화/퀴즈 출제 요청/멘토링/캘린더/
        // 스트리밍/스터디/이동/캐주얼)에 전혀 해당하지 않았고("명확한 새 의도
        // 없음"), 채점을 기다리는 문제가 있었으며, 이번 메시지가 실제로 "②"처럼
        // 답 입력으로 보일 때만 채점한다 - 그래야 "내 일정 보여줘"같은 새로운
        // 질문이 채점 대기 상태 때문에 막히지 않는다.
        if (pendingQuiz != null && match == null) {
            String userOption = FeatureIntentClassifier.matchQuizAnswerOption(message);
            if (userOption != null) {
                return buildQuizJudgeReply(message, sessionId, userDetails, pendingQuiz, userOption);
            }
            // 22단계 실제 브라우저 테스트에서 발견: "자바 문제 하나 내줘" 다음에
            // 완전히 무관한 새 질문("HTTP 상태코드 200이 뭐야?")을 해도, 보기
            // 번호가 없다는 이유만으로 무조건 "정답 보기 번호로 답해 주세요"라고
            // 답해버려서 새 질문 자체가 무시되는 문제가 있었다. "~는 뭐야?"처럼
            // 스스로 새로운 대상을 밝히는 질문이면 퀴즈 답변 시도로 보지 않고,
            // pendingQuiz를 되살리지 않은 채(=이번 미답변 문제는 포기) 아래
            // 일반 처리로 넘겨서 새 질문에 정상적으로 답하게 한다.
            if (!FeatureIntentClassifier.looksLikeNewQuestion(message)) {
                // 21단계 실제 브라우저 테스트에서 발견: 사용자가 보기 번호 없이
                // 자연어로만 답했을 때("...하면 되는거야?") 여기서 그냥 넘어가면
                // 아래 일반 Qwen 대화로 빠져서 AI가 채점 없이 "네, 맞아요" 식으로
                // 답하거나 마음대로 정답 코드를 만들어 알려주는 사고로 이어졌다.
                // 채점 대기 중에는 절대 Qwen 일반 대화로 넘기지 않고, 보기
                // 번호로 다시 답해달라고 서버가 직접(=Qwen 호출 없이) 안내한다.
                // 방금 읽으며 지운 pendingQuiz는 이번에 채점하지 못했으므로
                // 그대로 되살려서 사용자가 다시 시도할 수 있게 한다(TTL 갱신).
                chatSessionService.setPendingQuiz(sessionId, pendingQuiz);
                return buildQuizAnswerFormatNudgeReply(message, sessionId, userDetails);
            }
        }

        // 19단계: 위의 모든 명확한 분기(개인화/퀴즈 키워드/멘토링/캘린더/스트리밍/
        // 스터디/이동/캐주얼)에 전혀 해당하지 않았다면("명확한 새 의도 없음"이
        // 확인된 상태), 방금 "어떤 과목?"을 물어본 대기 상태가 있었는지 마지막으로
        // 확인한다. "java"/"http"처럼 그 자체로는 EASYS 카테고리와 매칭되지 않는
        // 짧은 단어도 여기서 과목으로 해석될 수 있다 - 상태가 있다고 해서 이 확인
        // 이전에 이미 명확한 다른 의도가 우선 처리되는 구조이므로, "내 일정
        // 보여줘"처럼 새로운 명확한 요청은 절대 이 단계까지 내려오지 않는다.
        if (pendingState != null && pendingState.startsWith(QUIZ_WAITING_SUBJECT_PREFIX) && match == null) {
            FeatureIntentClassifier.QuizSubject subject = FeatureIntentClassifier.matchQuizSubject(message);
            if (subject != null) {
                int requestedCount = parseCountFromPendingState(pendingState);
                return buildQuizReply(message, sessionId, userDetails, subject, requestedCount);
            }
            // 과목도 아니라면 대기 상태는 이미 위에서 소비(삭제)했으니, 무한 대기
            // 없이 그냥 아래 일반 흐름으로 자연스럽게 이어간다.
        }

        // 오타로 보이는 경우, Qwen에게는 사용자의 원문 대신 "실제로 무엇을 물어본 것인지"를
        // 명확히 알려줘서 엉뚱하거나 모호한 답을 하지 않도록 한다.
        String promptMessage = message;
        if (match != null && match.typo()) {
            promptMessage = "사용자가 \"" + message + "\"라고 질문했는데, 오타로 보이며 아마 \""
                    + match.canonicalKeyword() + "\"에 대한 질문 같습니다. \""
                    + match.canonicalKeyword() + "\" 기능을 어떻게 이용하는지만 간단히 안내해주세요.";
        }

        List<ChatSessionService.ChatTurn> history = chatSessionService.getHistory(sessionId);
        List<EasysKnowledge> knowledge = resolveKnowledge(message, match, history);
        String systemPrompt = buildSystemPrompt(message, knowledge);

        // 대화가 길어지면 system prompt(맨 앞)의 "지금 주제는 X" 지시를 무시하고
        // 대화 기록의 다른 주제 표현을 끌어오는 사례가 있었다. 생성 지점에 가장
        // 가까운 이번 사용자 메시지 바로 앞에 주제를 한 번 더 짧게 반복한다.
        String qwenMessage = withRecencyTopicReminder(promptMessage, knowledge);

        String reply = askQwen(history, qwenMessage, systemPrompt);
        reply = normalizeCjkPunctuation(reply);
        reply = fixEasysParticles(reply);
        reply = stripHallucinatedSentences(reply);
        if (!knowledge.isEmpty() && "streaming".equals(knowledge.get(0).category())) {
            reply = stripSentencesMatching(reply, CAFE_MENTION_IN_STREAMING_PATTERN,
                    "스트리밍 답변에 카페/스터디룸이 섞여 나와 해당 문장을 제거합니다: {}");
        }
        reply = guardAgainstForeignScript(reply, history, qwenMessage, systemPrompt);
        reply = guardAgainstRefundPeriodHallucination(reply);

        if (match != null && match.typo()) {
            reply = "혹시 '" + match.canonicalKeyword() + "'을(를) 말씀하시는 건가요?\n" + reply;
        }

        recordTurn(sessionId, userDetails, message, reply);

        // 19단계: "방송 뭐가 인기야? → 구경하고 싶어"에서 답변 내용은 knowledge의
        // 직전 주제 상속(fallback)으로 스트리밍 문맥을 잘 이어받는데, intent/
        // actions는 이번 메시지만 보는 match()(=null)로 계산돼서 비어버리던
        // 문제가 있었다. 답변에 실제로 쓴 지식(knowledge)과 같은 기준으로
        // intent/actions를 만들어서 둘이 서로 다른 결론을 내지 않게 한다.
        ActionTarget finalTarget = resolveFinalActionTarget(match, knowledge, message);
        String intent = match != null ? match.category() : (finalTarget != null ? finalTarget.target() : null);
        boolean confirmTypo = match != null && match.typo();
        List<ActionDto> actions = finalTarget != null ? finalTarget.toActionList() : List.of();
        return new AiChatResponseDto(reply, intent, confirmTypo, sessionId, actions);
    }

    // 18단계: 로그인 사용자의 대화는 Redis(단기 문맥)뿐 아니라 DB(AiChatMessage,
    // 영구 기록)에도 남긴다 - 로그아웃해도 지우지 않고, 같은 계정으로 다시
    // 로그인하면 이어서 볼 수 있어야 한다(단, 다른 사용자에게는 절대 보이면
    // 안 되므로 항상 member 기준으로만 저장/조회한다). 비로그인 사용자는 Redis에만
    // 남고 DB에는 기록되지 않는다(원래도 그랬던 동작 그대로 유지).
    private void recordTurn(String sessionId, CustomUserDetails userDetails, String userMessage, String modelReply) {
        chatSessionService.appendUserMessage(sessionId, userMessage);
        chatSessionService.appendModelMessage(sessionId, modelReply);

        if (userDetails != null) {
            Member member = userDetails.getMember();
            aiChatMessageRepository.save(new AiChatMessage(member, ChatSessionService.ROLE_USER, userMessage));
            aiChatMessageRepository.save(new AiChatMessage(member, ChatSessionService.ROLE_MODEL, modelReply));
        }
    }

    // 18단계: 로그인 사용자가 로그아웃 후 다시 로그인했을 때(또는 새로고침 시)
    // 이전 대화를 이어서 볼 수 있게 영구 기록을 돌려준다. 비로그인이면 빈 목록.
    @Transactional(readOnly = true)
    public List<AiChatHistoryItemDto> getHistory(CustomUserDetails userDetails) {
        if (userDetails == null) {
            return List.of();
        }
        List<AiChatMessage> messages = aiChatMessageRepository.findByMemberOrderByCreatedAtAsc(userDetails.getMember());
        return messages.stream()
                .map(m -> new AiChatHistoryItemDto(
                        ChatSessionService.ROLE_MODEL.equals(m.getRole()) ? "ai" : "user",
                        m.getContent(),
                        m.getCreatedAt()
                ))
                .toList();
    }

    // ===================== 18단계: 이름 기억 =====================

    private AiChatResponseDto buildNameReply(String message, String sessionId, CustomUserDetails userDetails) {
        String reply;
        if (userDetails == null) {
            reply = "로그인하시면 이름을 알려드릴 수 있어요. 먼저 로그인해 주세요.";
        } else {
            Member member = userDetails.getMember();
            String preferredName = aiUserMemoryService
                    .find(member, AiUserMemoryService.KEY_PREFERRED_NAME)
                    .orElse(member.getNickname());
            reply = preferredName + "님이에요.";
        }
        recordTurn(sessionId, userDetails, message, reply);
        return new AiChatResponseDto(reply, null, false, sessionId, List.of());
    }

    private AiChatResponseDto buildRememberNameReply(String message, String sessionId, CustomUserDetails userDetails,
                                                       String nameToRemember) {
        String reply;
        if (userDetails == null) {
            reply = "로그인하시면 이름을 기억해드릴 수 있어요. 먼저 로그인해 주세요.";
        } else {
            aiUserMemoryService.remember(userDetails.getMember(), AiUserMemoryService.KEY_PREFERRED_NAME, nameToRemember);
            reply = "네, '" + nameToRemember + "'라는 이름으로 기억해둘게요.";
        }
        recordTurn(sessionId, userDetails, message, reply);
        return new AiChatResponseDto(reply, null, false, sessionId, List.of());
    }

    private AiChatResponseDto buildForgetNameReply(String message, String sessionId, CustomUserDetails userDetails) {
        String reply;
        if (userDetails == null) {
            reply = "로그인 상태가 아니라서 기억해둔 이름이 없어요.";
        } else {
            boolean existed = aiUserMemoryService.forget(userDetails.getMember(), AiUserMemoryService.KEY_PREFERRED_NAME);
            reply = existed ? "네, 기억해둔 이름을 지웠어요." : "기억해둔 이름이 없었어요.";
        }
        recordTurn(sessionId, userDetails, message, reply);
        return new AiChatResponseDto(reply, null, false, sessionId, List.of());
    }

    // ===================== 18단계: 자유 메모 기억/잊기 =====================

    private static final Pattern REMEMBER_COMMAND_SUFFIX_PATTERN =
            Pattern.compile("(이거|이 내용|이것)?\\s*(기억해줘|기억해둬|기억해|저장해줘|저장해)[.!]?\\s*$");

    private AiChatResponseDto buildRememberNoteReply(String message, String sessionId, CustomUserDetails userDetails) {
        String reply;
        if (userDetails == null) {
            reply = "로그인하시면 메모를 기억해드릴 수 있어요. 먼저 로그인해 주세요.";
        } else {
            String noteContent = REMEMBER_COMMAND_SUFFIX_PATTERN.matcher(message).replaceFirst("").trim();
            if (noteContent.isEmpty()) {
                noteContent = message;
            }
            String key = "note_" + System.currentTimeMillis();
            aiUserMemoryService.remember(userDetails.getMember(), key, noteContent);
            reply = "네, 기억해둘게요.";
        }
        recordTurn(sessionId, userDetails, message, reply);
        return new AiChatResponseDto(reply, null, false, sessionId, List.of());
    }

    private AiChatResponseDto buildForgetGenericReply(String message, String sessionId, CustomUserDetails userDetails) {
        String reply;
        if (userDetails == null) {
            reply = "로그인 상태가 아니라서 기억해둔 내용이 없어요.";
        } else {
            Member member = userDetails.getMember();
            Optional<String> mostRecentKey = aiUserMemoryService.findMostRecentKey(member);
            if (mostRecentKey.isEmpty()) {
                reply = "기억해둔 내용이 없어요.";
            } else {
                aiUserMemoryService.forget(member, mostRecentKey.get());
                reply = "네, 방금 말씀하신 내용을 잊었어요.";
            }
        }
        recordTurn(sessionId, userDetails, message, reply);
        return new AiChatResponseDto(reply, null, false, sessionId, List.of());
    }

    // ===================== 18/20단계: 학습 문제 출제 =====================

    private int parseCountFromPendingState(String pendingState) {
        try {
            return Integer.parseInt(pendingState.substring(QUIZ_WAITING_SUBJECT_PREFIX.length()));
        } catch (Exception e) {
            return 1;
        }
    }

    private record ParsedQuiz(String questionText, String correctOption, String explanation) {
    }

    // 22단계: Qwen이 우리가 정의하지 않은 "<<<QUESTION>>>" 같은 마커를 문제
    // 중간 아무 데서나 스스로 만들어 붙이는 경우가 있었다(21단계에는 맨 앞에
    // 있을 때만 지웠는데, 서두 설명 문장 뒤에 나오면 못 잡았다). 이제 위치와
    // 무관하게 <<<ANSWER>>> 앞부분 어디서든 찾아서, 그 마커까지(서두 설명 포함)
    // 전부 버리고 마커 뒤부터를 진짜 문제 시작으로 본다.
    private static final Pattern STRAY_MARKER_PATTERN = Pattern.compile("<{2,3}[^<>\\n]{1,20}>{2,3}\\s*");

    // Qwen이 QUIZ_PROMPT_SINGLE의 마커 형식을 지켰는지 확인하고, 지켰다면 문제
    // 본문/정답/해설을 셋으로 나눈다. 마커가 없거나(형식을 안 지켰거나), 문제가
    // 중복 출제됐거나, 보기가 4개가 아니면 null을 반환한다 - 이 경우
    // buildQuizReply가 한 번 재시도하고, 그래도 안 되면 정규식 안전장치로
    // 한 번 더 걸러낸다.
    private ParsedQuiz parseSingleQuizReply(String rawReply) {
        if (rawReply == null) {
            return null;
        }
        int answerIdx = rawReply.indexOf(QUIZ_ANSWER_MARKER);
        if (answerIdx < 0) {
            return null;
        }
        String questionText = rawReply.substring(0, answerIdx).trim();

        Matcher strayMarker = STRAY_MARKER_PATTERN.matcher(questionText);
        if (strayMarker.find()) {
            questionText = questionText.substring(strayMarker.end()).trim();
        }

        // 22단계 실제 브라우저 테스트에서 발견: "Java 문제 하나만"을 요청했는데
        // Qwen이 같은 문제를 코드 블록째로 두 번(예: Java 다음에 Python 스타일로)
        // 반복해서 진술하는 사고가 있었다. 코드펜스(```)가 세 번째로 다시
        // 열리는 지점(=두 번째 코드 블록이 시작되는 지점)부터는 문제를 다시
        // 진술한 것으로 보고 잘라낸다.
        questionText = truncateDuplicateCodeBlock(questionText);

        // 다섯 번째 보기(⑤) 이상이 붙는 경우도 있었다 - "반드시 4지선다"라는
        // 지시를 어긴 것이므로, ⑤가 나오는 지점부터는 잘라내서 정확히 4개
        // 보기만 남긴다.
        int fifthOptionIdx = questionText.indexOf('⑤');
        if (fifthOptionIdx >= 0) {
            questionText = questionText.substring(0, fifthOptionIdx).trim();
        }

        String rest = rawReply.substring(answerIdx + QUIZ_ANSWER_MARKER.length());
        int explanationIdx = rest.indexOf(QUIZ_EXPLANATION_MARKER);
        String answerPart = explanationIdx >= 0 ? rest.substring(0, explanationIdx) : rest;
        String explanationPart = explanationIdx >= 0
                ? rest.substring(explanationIdx + QUIZ_EXPLANATION_MARKER.length()).trim()
                : "";

        String correctOption = extractOptionMarker(answerPart);
        if (correctOption == null || questionText.isEmpty() || !hasAllFourOptions(questionText)) {
            return null;
        }
        return new ParsedQuiz(questionText, correctOption, explanationPart);
    }

    private String truncateDuplicateCodeBlock(String questionText) {
        int firstOpen = questionText.indexOf("```");
        if (firstOpen < 0) {
            return questionText;
        }
        int firstClose = questionText.indexOf("```", firstOpen + 3);
        if (firstClose < 0) {
            return questionText;
        }
        int secondOpen = questionText.indexOf("```", firstClose + 3);
        if (secondOpen < 0) {
            return questionText;
        }
        return questionText.substring(0, secondOpen).trim();
    }

    // "반드시 4지선다 객관식으로만 내세요"라는 지시를 실제로 지켰는지 최종
    // 확인한다. 보기가 하나라도 빠진 문제(예: 보기 자체가 없는 경우, 재현
    // 테스트에서 실제로 관찰됨)를 사용자에게 그대로 보여주지 않기 위해서다.
    private boolean hasAllFourOptions(String text) {
        return text.contains("①") && text.contains("②") && text.contains("③") && text.contains("④");
    }

    private String extractOptionMarker(String text) {
        for (char c : text.toCharArray()) {
            if (c == '①' || c == '②' || c == '③' || c == '④') {
                return String.valueOf(c);
            }
        }
        Matcher digitMatcher = Pattern.compile("[1-4]").matcher(text);
        if (digitMatcher.find()) {
            char[] circled = {'①', '②', '③', '④'};
            return String.valueOf(circled[Integer.parseInt(digitMatcher.group()) - 1]);
        }
        return null;
    }

    private String appendQuizAnswerPrompt(String reply) {
        String trimmed = reply == null ? "" : reply.trim();
        if (trimmed.isEmpty()) {
            return QUIZ_ANSWER_PROMPT_LINE;
        }
        if (trimmed.endsWith(QUIZ_ANSWER_PROMPT_LINE)) {
            return trimmed;
        }
        return trimmed + "\n\n" + QUIZ_ANSWER_PROMPT_LINE;
    }

    private AiChatResponseDto buildQuizReply(String message, String sessionId, CustomUserDetails userDetails,
                                              FeatureIntentClassifier.QuizSubject subject, int count) {
        String subjectLabel = switch (subject) {
            case JAVA -> "Java";
            case DB_SQL -> "DB/SQL";
            case SPRING -> "Spring Boot";
            case REACT -> "React";
            case HTTP -> "HTTP";
        };

        // 새 문제를 내는 순간, 혹시 이전 문제에 대한 채점 대기가 남아있었다면
        // 무효화한다(이번에 낸 새 문제와 섞여서 채점되면 안 된다).
        chatSessionService.clearPendingQuiz(sessionId);

        // 이전 대화 문맥(history)을 의도적으로 전달하지 않는다 - "방송 보고 싶어"
        // 다음에 "자바 문제 내줘"를 물어도 스트리밍 얘기가 절대 섞이지 않도록,
        // 학습 문제 출제는 항상 완전히 새로 시작한다.
        String reply;
        if (count == 1) {
            // 20단계: "문제 하나만 내줘"의 기본/가장 흔한 경로. 정답을 마커로
            // 구조적으로 분리해서 사용자에게는 문제 본문만 보여주고, 정답/해설은
            // Redis(ChatSessionService.QuizPending)에 저장해뒀다가 사용자가 답을
            // 입력하면 그때 buildQuizJudgeReply가 꺼내 쓴다.
            String qwenMessage = subjectLabel + " 문제를 정확히 1개만 내주세요.";
            String rawReply = askQwen(List.of(), qwenMessage, QUIZ_PROMPT_SINGLE);
            rawReply = normalizeCjkPunctuation(rawReply);
            rawReply = guardAgainstForeignScript(rawReply, List.of(), qwenMessage, QUIZ_PROMPT_SINGLE);

            ParsedQuiz parsed = parseSingleQuizReply(rawReply);
            if (parsed == null) {
                // 22단계: 형식 위반(마커 누락/문제 중복/보기 개수 불일치)을 한 번만
                // 재시도한다 - 기존 guardAgainstForeignScript와 동일한 "같은 문맥으로
                // 교정 지시만 덧붙여 다시 물어본다" 패턴이다.
                log.warn("퀴즈 응답 형식이 올바르지 않아 재시도합니다: {}", rawReply);
                String retryReply = askQwen(List.of(), qwenMessage, QUIZ_PROMPT_SINGLE + QUIZ_FORMAT_RETRY_NOTE);
                retryReply = normalizeCjkPunctuation(retryReply);
                retryReply = guardAgainstForeignScript(retryReply, List.of(), qwenMessage, QUIZ_PROMPT_SINGLE);
                ParsedQuiz retryParsed = parseSingleQuizReply(retryReply);
                if (retryParsed != null) {
                    parsed = retryParsed;
                    rawReply = retryReply;
                }
            }
            if (parsed != null) {
                reply = parsed.questionText();
                chatSessionService.setPendingQuiz(sessionId, new ChatSessionService.QuizPending(
                        subjectLabel, parsed.correctOption(), parsed.explanation(), null));
            } else {
                // Qwen이 마커 형식을 지키지 않은 드문 경우 - 정답 노출을 절대
                // 허용할 수 없으므로, 답을 흘렸을 만한 문장을 정규식으로 제거하고
                // (2차 안전장치), 채점은 원문(사용자에게는 보여주지 않음)을 근거로
                // 사용자가 답한 뒤 한 번만 Qwen에게 다시 판정을 맡긴다.
                log.warn("퀴즈 응답에서 정답 마커를 찾지 못해 안전장치로 처리합니다: {}", rawReply);
                reply = stripSentencesMatching(rawReply, QUIZ_ANSWER_LEAK_PATTERN,
                        "퀴즈 응답에서 정답 노출 문장이 감지되어 제거합니다: {}");
                chatSessionService.setPendingQuiz(sessionId, new ChatSessionService.QuizPending(
                        subjectLabel, null, null, rawReply));
            }
            reply = appendQuizAnswerPrompt(reply);
        } else {
            // 사용자가 명시적으로 여러 문제("5문제 내줘" 등)를 요청한 경우에만
            // 여러 개를 낸다 - 이때는 문제별 채점 대기 상태를 만들지 않는다.
            String qwenMessage = subjectLabel + " 문제를 정확히 " + count + "개 내주세요.";
            reply = askQwen(List.of(), qwenMessage, QUIZ_PROMPT_MULTI);
            reply = normalizeCjkPunctuation(reply);
            reply = guardAgainstForeignScript(reply, List.of(), qwenMessage, QUIZ_PROMPT_MULTI);
            reply = stripSentencesMatching(reply, QUIZ_ANSWER_LEAK_PATTERN,
                    "퀴즈 응답에서 정답 노출 문장이 감지되어 제거합니다: {}");
        }

        recordTurn(sessionId, userDetails, message, reply);
        return new AiChatResponseDto(reply, null, false, sessionId, List.of());
    }

    // 20단계: "문제 하나만 내줘 → ② " 흐름에서 사용자가 답을 입력했을 때 채점한다.
    private AiChatResponseDto buildQuizJudgeReply(String message, String sessionId, CustomUserDetails userDetails,
                                                   ChatSessionService.QuizPending pendingQuiz, String userOption) {
        String reply;
        if (pendingQuiz.getCorrectOption() != null) {
            boolean correct = pendingQuiz.getCorrectOption().equals(userOption);
            String explanation = pendingQuiz.getExplanation();
            boolean hasExplanation = explanation != null && !explanation.isBlank();
            if (correct) {
                reply = "🎉 정답입니다!" + (hasExplanation ? " " + explanation : "");
            } else {
                reply = "아쉽지만 정답이 아니에요. 정답은 " + pendingQuiz.getCorrectOption() + "번이에요."
                        + (hasExplanation ? " " + explanation : "");
            }
        } else if (pendingQuiz.getRawModelReply() != null) {
            // 마커 파싱에 실패해 정답을 구조적으로 몰랐던 경우에만 여기로 온다 -
            // 문제를 낼 때 사용자에게 원문(rawModelReply)을 보여준 적이 없으므로,
            // 지금 이 판정 결과가 사용자가 처음 보는 정답 공개다.
            String judgePrompt = "다음은 방금 사용자에게 낸 " + pendingQuiz.getSubjectLabel()
                    + " 문제와 정답/해설입니다(사용자에게는 아직 보여주지 않았습니다):\n\n"
                    + pendingQuiz.getRawModelReply()
                    + "\n\n사용자가 고른 답은 \"" + userOption + "\"입니다. 정답인지 판정해 주세요.";
            reply = askQwen(List.of(), judgePrompt, QUIZ_JUDGE_PROMPT);
            reply = normalizeCjkPunctuation(reply);
            reply = guardAgainstForeignScript(reply, List.of(), judgePrompt, QUIZ_JUDGE_PROMPT);
        } else {
            reply = "죄송해요, 방금 낸 문제 정보를 찾을 수 없어요. 문제를 다시 내드릴까요?";
        }

        recordTurn(sessionId, userDetails, message, reply);
        return new AiChatResponseDto(reply, null, false, sessionId, List.of());
    }

    // 21단계: 채점 대기 중인데 보기 번호를 알아낼 수 없는 자연어 답변이 왔을 때
    // 쓴다. Qwen을 호출하지 않으므로 정답이 새어나갈 위험이 전혀 없다.
    private AiChatResponseDto buildQuizAnswerFormatNudgeReply(String message, String sessionId,
                                                               CustomUserDetails userDetails) {
        String reply = "정답 보기 번호로 답해 주세요. 예: ②";
        recordTurn(sessionId, userDetails, message, reply);
        return new AiChatResponseDto(reply, null, false, sessionId, List.of());
    }

    private AiChatResponseDto buildQuizClarificationReply(String message, String sessionId,
                                                            CustomUserDetails userDetails) {
        String reply = "어떤 과목의 문제를 원하시나요? Java, DB/SQL, Spring Boot, React, HTTP 중에서 "
                + "골라주시면 바로 내드릴게요.";
        recordTurn(sessionId, userDetails, message, reply);
        return new AiChatResponseDto(reply, null, false, sessionId, List.of());
    }

    // ===================== 20단계: 비로그인 무료 체험 소진 =====================

    private AiChatResponseDto buildGuestLimitReachedReply(String sessionId) {
        String reply = "더 공부해볼까요? 🎓\n\n"
                + "회원가입하면 AI에게 더 많은 질문을 하고\n"
                + "EASYS의 학습 기능을 계속 이용할 수 있어요.";
        List<ActionDto> actions = List.of(new ActionDto("NAVIGATION", "SIGNUP", "회원가입하기"));
        // 체험 소진 안내는 실제 질문/답변이 아니므로 대화 기록(Redis/DB)에 남기지
        // 않는다 - 다음에 로그인해서 다시 물어봐도 이 안내가 문맥으로 섞이지 않는다.
        return new AiChatResponseDto(reply, "SIGNUP_REQUIRED", false, sessionId, actions);
    }

    // ===================== 18단계: 실제 DB 기반 인기 방송 =====================

    private AiChatResponseDto buildPopularStreamReply(String message, String sessionId, CustomUserDetails userDetails) {
        List<StreamingStudio> studios = streamingStudioRepository.findAll();
        String reply;
        List<ActionDto> actions = List.of();

        if (studios.isEmpty()) {
            reply = "현재 라이브 중인 방송이 없어요.";
        } else {
            StreamingStudio top = studios.stream()
                    .max(Comparator.comparingInt(StreamingStudio::getViewers))
                    .orElseThrow();
            reply = "현재 EASYS에서 라이브 중인 방송 중 시청자 수가 가장 많은 방송은 "
                    + top.getHost() + "님의 '" + top.getTitle() + "'예요. 현재 시청자 수는 "
                    + top.getViewers() + "명이에요.";
            actions = List.of(new ActionDto("NAVIGATION", "STREAMING_ROOM", "방송 보러가기",
                    "roomId=" + top.getId()));
        }

        recordTurn(sessionId, userDetails, message, reply);
        return new AiChatResponseDto(reply, "STREAMING", false, sessionId, actions);
    }

    // ===================== 19단계: 실제 DB 기반 인기 게시글 =====================

    private AiChatResponseDto buildPopularPostReply(String message, String sessionId, CustomUserDetails userDetails) {
        // 좋아요 개수로 GROUP BY + ORDER BY까지 DB에서 직접 정렬한다(게시글을
        // 전부 메모리로 가져와 계산하지 않음). 좋아요가 하나도 없으면 결과 자체가
        // 없다 - 그 경우 "0개짜리 인기글"을 지어내지 않고 정직하게 없다고 답한다.
        List<CommunityPost> topPosts = postLikeRepository.findPostsOrderByLikeCountDesc(PageRequest.of(0, 1));
        String reply;
        List<ActionDto> actions = List.of(new ActionDto("NAVIGATION", "COMMUNITY", "커뮤니티 바로가기"));

        if (topPosts.isEmpty()) {
            reply = "아직 좋아요가 눌린 게시글이 없어요.";
        } else {
            CommunityPost top = topPosts.get(0);
            long likeCount = postLikeRepository.countByCommunityPostId(top.getId());
            reply = "현재 좋아요가 가장 많은 글은 \"" + top.getTitle() + "\"이고, 좋아요는 "
                    + likeCount + "개예요.";
        }

        recordTurn(sessionId, userDetails, message, reply);
        return new AiChatResponseDto(reply, "COMMUNITY", false, sessionId, actions);
    }

    // ===================== 19단계: 실제 DB 기반 "내가 등록한 멘토링" =====================

    private static final int MENTORING_LIST_LIMIT = 5;

    // "등록한"이라는 말의 뜻이 사용자에 따라 다르다 - 멘토로 등록한 사람에게는
    // 자신이 만든 멘토링(MentoringOffering)이고, 멘토가 아닌 사람에게는 그런
    // 데이터 자체가 없으므로 신청한 멘토링(MentoringReservation)으로 자연스럽게
    // 안내한다. 둘 중 하나를 추측해서 지어내지 않고, 실제 DB에 어떤 데이터가
    // 있는지로 결정한다.
    private AiChatResponseDto buildMyMentoringReply(String message, String sessionId, CustomUserDetails userDetails) {
        String reply;
        List<ActionDto> actions = List.of(new ActionDto("NAVIGATION", "MENTORING", "멘토링 둘러보기"));

        if (userDetails == null) {
            reply = "로그인하시면 확인할 수 있어요. 먼저 로그인해 주세요.";
        } else {
            Member member = userDetails.getMember();
            Optional<MentorProfile> mentorProfile = mentorProfileRepository.findByMember(member);

            if (mentorProfile.isPresent()) {
                List<MentoringOffering> offerings = mentoringOfferingRepository
                        .findByMentorOrderByCreatedAtDesc(mentorProfile.get());
                if (offerings.isEmpty()) {
                    reply = "멘토로 등록은 되어 있지만, 아직 등록하신 멘토링은 없어요.";
                } else {
                    StringBuilder sb = new StringBuilder("회원님이 멘토로 등록한 멘토링은 총 ")
                            .append(offerings.size()).append("개예요.\n");
                    for (MentoringOffering offering : offerings.stream().limit(MENTORING_LIST_LIMIT).toList()) {
                        sb.append("- ").append(offering.getTitle()).append(" (1회 ")
                                .append(offering.getPrice()).append("원)\n");
                    }
                    reply = sb.toString().trim();
                }
            } else {
                List<MentoringReservation> reservations = mentoringReservationRepository
                        .findByMemberOrderByCreatedAtDesc(member);
                if (reservations.isEmpty()) {
                    reply = "아직 멘토로 등록하지 않으셨고, 신청하신 멘토링도 없어요.";
                } else {
                    StringBuilder sb = new StringBuilder(
                            "멘토로 등록하신 멘토링은 없지만, 신청하신 멘토링은 다음과 같아요.\n");
                    for (MentoringReservation reservation : reservations.stream().limit(MENTORING_LIST_LIMIT).toList()) {
                        String title = reservation.getOffering() != null
                                ? reservation.getOffering().getTitle() : "(삭제된 멘토링)";
                        sb.append("- ").append(title).append(" (")
                                .append(reservation.getReservationDate()).append(" ")
                                .append(reservation.getReservationTime()).append(", ")
                                .append(reservationStatusLabel(reservation.getStatus())).append(")\n");
                    }
                    reply = sb.toString().trim();
                }
            }
        }

        recordTurn(sessionId, userDetails, message, reply);
        return new AiChatResponseDto(reply, "MENTORING", false, sessionId, actions);
    }

    private String reservationStatusLabel(MentoringReservationStatus status) {
        return switch (status) {
            case PENDING -> "승인 대기중";
            case APPROVED -> "승인됨";
            case REJECTED -> "거절됨";
            case COMPLETED -> "완료됨";
        };
    }

    // ===================== 19단계: 대화 기록 삭제(확인 → 실제 삭제) =====================

    // "지금까지 대화 다 지워줘"에 바로 지우지 않고 먼저 확인 Action을 준다.
    // 기존 NAVIGATION과는 성격이 다른 action이라, 타입을 "CONFIRM"으로 새로
    // 추가했다(프론트가 NAVIGATION은 <Link>로, CONFIRM은 실제 삭제 API를 부르는
    // <button>으로 구분해서 렌더링한다).
    private AiChatResponseDto buildDeleteConfirmationReply(String message, String sessionId,
                                                             CustomUserDetails userDetails) {
        String reply;
        List<ActionDto> actions;
        if (userDetails == null) {
            reply = "로그인하시면 대화 기록을 삭제할 수 있어요. 먼저 로그인해 주세요.";
            actions = List.of();
        } else {
            reply = "지금까지의 대화 기록을 모두 삭제할까요?";
            actions = List.of(
                    new ActionDto("CONFIRM", "DELETE_CHAT_HISTORY", "대화 기록 삭제"),
                    new ActionDto("CONFIRM", "CANCEL", "취소")
            );
        }
        recordTurn(sessionId, userDetails, message, reply);
        return new AiChatResponseDto(reply, null, false, sessionId, actions);
    }

    // 19단계: 프론트가 "대화 기록 삭제" 버튼을 눌렀을 때 DELETE /api/ai/chat/history로
    // 호출한다(확인 전에는 절대 삭제하지 않음). 항상 로그인한 사용자 본인 기준으로만
    // 지운다 - 다른 사용자의 Redis 세션/영구 기록에는 접근하지 않는다.
    @Transactional
    public void deleteHistory(CustomUserDetails userDetails, String sessionId) {
        if (userDetails == null) {
            return;
        }
        aiChatMessageRepository.deleteByMember(userDetails.getMember());
        if (sessionId != null && !sessionId.isBlank()) {
            chatSessionService.deleteHistory(sessionId);
        }
    }

    // ===================== 18단계: 실제 DB 기반 개인 일정(날짜 필터링) =====================

    private static final DateTimeFormatter SCHEDULE_TIME_FORMAT = DateTimeFormatter.ofPattern("MM/dd HH:mm");
    private static final int SCHEDULE_LIST_LIMIT = 5;

    private AiChatResponseDto buildPersonalScheduleReply(String message, String sessionId,
                                                          CustomUserDetails userDetails) {
        if (userDetails == null) {
            String reply = "내 일정은 로그인 후에 확인할 수 있어요. 로그인하시면 실제로 등록된 일정을 "
                    + "바로 보여드릴게요.";
            recordTurn(sessionId, userDetails, message, reply);
            return new AiChatResponseDto(reply, "CALENDAR", false, sessionId, List.of());
        }

        Member member = userDetails.getMember();
        FeatureIntentClassifier.ScheduleRange range = FeatureIntentClassifier.matchScheduleRange(message);
        LocalDateTime now = LocalDateTime.now();

        List<PersonalSchedule> filtered;
        String foundPrefix;
        String emptyMessage;

        switch (range) {
            case RECENT_CREATED -> {
                filtered = personalScheduleService.getMySchedulesByCreatedAtDesc(member).stream()
                        .limit(SCHEDULE_LIST_LIMIT)
                        .toList();
                foundPrefix = "가장 최근에 등록하신 일정은 다음과 같아요.";
                emptyMessage = "최근에 등록하신 일정이 없어요.";
            }
            case PAST -> {
                filtered = personalScheduleService.getMySchedules(member).stream()
                        .filter(s -> s.getEndAt().isBefore(now))
                        .sorted(Comparator.comparing(PersonalSchedule::getStartAt).reversed())
                        .limit(SCHEDULE_LIST_LIMIT)
                        .toList();
                foundPrefix = "지난 일정은 다음과 같아요.";
                emptyMessage = "지난 일정이 없어요.";
            }
            case TODAY -> {
                filtered = personalScheduleService.getMySchedules(member).stream()
                        .filter(s -> s.getStartAt().toLocalDate().equals(now.toLocalDate()))
                        .limit(SCHEDULE_LIST_LIMIT)
                        .toList();
                foundPrefix = "오늘 일정은 다음과 같아요.";
                emptyMessage = "오늘은 등록된 일정이 없어요.";
            }
            case THIS_WEEK -> {
                LocalDateTime weekEnd = now.plusDays(7);
                filtered = personalScheduleService.getMySchedules(member).stream()
                        .filter(s -> !s.getStartAt().isBefore(now) && s.getStartAt().isBefore(weekEnd))
                        .limit(SCHEDULE_LIST_LIMIT)
                        .toList();
                foundPrefix = "이번 주 다가오는 일정은 다음과 같아요.";
                emptyMessage = "이번 주에는 다가오는 일정이 없어요.";
            }
            default -> {
                // 18단계: "내 일정"이라고만 물었을 때 기본값은 "다가오는 일정"이다.
                // 지난 일정을 Qwen에게 아무거나 골라잡게 하지 않고, 서버가 현재
                // 시각(now) 기준으로 결정적으로 걸러낸다.
                filtered = personalScheduleService.getMySchedules(member).stream()
                        .filter(s -> s.getEndAt().isAfter(now))
                        .limit(SCHEDULE_LIST_LIMIT)
                        .toList();
                foundPrefix = "다가오는 일정은 다음과 같아요.";
                emptyMessage = "다가오는 일정이 없어요.";
            }
        }

        String reply;
        if (filtered.isEmpty()) {
            reply = emptyMessage;
        } else {
            StringBuilder sb = new StringBuilder(foundPrefix).append("\n");
            for (PersonalSchedule schedule : filtered) {
                sb.append("- ").append(schedule.getTitle()).append(" (")
                        .append(schedule.getStartAt().format(SCHEDULE_TIME_FORMAT)).append(" ~ ")
                        .append(schedule.getEndAt().format(SCHEDULE_TIME_FORMAT)).append(")\n");
            }
            reply = sb.toString().trim();
        }

        recordTurn(sessionId, userDetails, message, reply);
        return new AiChatResponseDto(reply, "CALENDAR", false, sessionId,
                List.of(new ActionDto("NAVIGATION", "CALENDAR", "캘린더 바로가기")));
    }

    private AiChatResponseDto buildBestMentorReply(String sessionId) {
        Optional<MentorProfileResponseDto> best = mentorProfileService.findBestMentor();

        if (best.isEmpty()) {
            return new AiChatResponseDto(
                    "아직 후기가 등록된 멘토가 없어서 최고의 멘토를 추천해드리기 어려워요. 조금만 기다려주세요!",
                    null,
                    false,
                    sessionId
            );
        }

        MentorProfileResponseDto mentor = best.get();
        String reply = String.format(
                "현재 EASYS에서 가장 좋은 평가를 받고 있는 멘토는 %s님이에요! 평균 %.1f점, 후기 %d개로 좋은 평가를 받고 있어요.",
                mentor.getNickname(),
                mentor.getAverageRating(),
                mentor.getReviewCount()
        );
        return new AiChatResponseDto(reply, "BEST_MENTOR", false, sessionId,
                List.of(new ActionDto("NAVIGATION", "MENTORING", "멘토링 둘러보기")));
    }

    private AiChatResponseDto buildLearningExplorationReply(String message, String sessionId,
                                                              CustomUserDetails userDetails) {
        String reply = "괜찮아요, 처음부터 정할 필요는 없어요. 어떤 분야에 관심이 있으신지 편하게 "
                + "말씀해 주시면 관련된 멘토링이나 스터디를 같이 찾아볼게요. 예를 들면 프로그래밍/"
                + "개발, 디자인, 외국어, 자격증처럼 큰 분야만 알려주셔도 좋아요.";

        recordTurn(sessionId, userDetails, message, reply);
        return new AiChatResponseDto(reply, null, false, sessionId, List.of());
    }

    // 이 질문/답변은 Redis 대화 기록에 남기지 않는다 - 기록에 남으면 다음에 물어본
    // 완전히 다른 주제에도 "카페 스터디룸"이라는 단어가 계속 오염되어 나오는
    // 문제가 실제로 있었다.
    private AiChatResponseDto buildStudyClarificationReply(String sessionId) {
        String reply = "스터디 관련해서 궁금하신 게, 함께 공부할 사람을 찾는 그룹 스터디인가요, "
                + "아니면 공부할 공간(카페 스터디룸)을 예약하려는 건가요?";

        return new AiChatResponseDto(reply, null, false, sessionId, List.of());
    }

    private AiChatResponseDto buildNavigationReply(FeatureIntentClassifier.Match match, String message,
                                                    String sessionId, CustomUserDetails userDetails) {
        ActionTarget target = resolveActionTarget(match.category(), message);
        String reply = target != null
                ? target.navigationAck()
                : "네, 안내해 드릴게요!";

        recordTurn(sessionId, userDetails, message, reply);

        List<ActionDto> actions = target != null ? target.toActionList() : List.of();
        return new AiChatResponseDto(reply, match.category(), false, sessionId, actions);
    }

    private AiChatResponseDto handleCasualChat(String message, String sessionId, CustomUserDetails userDetails) {
        List<ChatSessionService.ChatTurn> history = chatSessionService.getHistory(sessionId);
        String reply = askQwen(history, message, CASUAL_PROMPT);
        reply = normalizeCjkPunctuation(reply);
        reply = fixEasysParticles(reply);
        reply = guardAgainstForeignScript(reply, history, message, CASUAL_PROMPT);

        recordTurn(sessionId, userDetails, message, reply);
        return new AiChatResponseDto(reply, null, false, sessionId, List.of());
    }

    // category(+필요하면 studyTopic/streamingIntent)를 실제 EASYS 기능 바로가기로
    // 바꾼다. 실제 <Route path>는 여기서 만들지 않는다 - target 코드만 정하고,
    // React가 App.jsx에 있는 실제 경로로 바꾼다.
    private ActionTarget resolveActionTarget(String category, String rawMessage) {
        if (category == null) {
            return null;
        }
        if ("STUDY".equals(category)) {
            FeatureIntentClassifier.StudyTopic topic = FeatureIntentClassifier.matchStudyTopic(rawMessage);
            if (topic == FeatureIntentClassifier.StudyTopic.CAFE_RESERVATION) {
                return new ActionTarget("STUDY_RESERVATION", "스터디룸 예약 바로가기",
                        "네, 스터디룸 예약 페이지로 안내해 드릴게요!");
            }
            if (topic == FeatureIntentClassifier.StudyTopic.GROUP_STUDY) {
                return new ActionTarget("STUDY_GROUP", "스터디 둘러보기",
                        "네, 스터디 페이지로 안내해 드릴게요!");
            }
            return null;
        }
        if ("STREAMING".equals(category)) {
            return resolveStreamingActionTarget(rawMessage);
        }
        return switch (category) {
            case "MENTORING", "BEST_MENTOR" -> new ActionTarget("MENTORING", "멘토링 둘러보기",
                    "네, 멘토링 페이지로 안내해 드릴게요!");
            case "CALENDAR" -> new ActionTarget("CALENDAR", "캘린더 바로가기",
                    "네, 캘린더 페이지로 안내해 드릴게요!");
            case "COMMUNITY" -> new ActionTarget("COMMUNITY", "커뮤니티 바로가기",
                    "네, 커뮤니티 페이지로 안내해 드릴게요!");
            default -> null;
        };
    }

    // 18단계: "방송 보고 싶어"(시청)와 "방송 만들고 싶어"(생성)는 실제로 서로
    // 다른 페이지다(/streaming 목록 vs /streaming/cam 생성). resolveActionTarget과
    // resolveFinalActionTarget(19단계, knowledge 기반 경로) 양쪽에서 같은 판단을
    // 쓰기 위해 공용 메서드로 뺐다.
    private ActionTarget resolveStreamingActionTarget(String rawMessage) {
        FeatureIntentClassifier.StreamingIntent streamingIntent =
                FeatureIntentClassifier.matchStreamingIntent(rawMessage);
        if (streamingIntent == FeatureIntentClassifier.StreamingIntent.CREATE) {
            return new ActionTarget("STREAMING_CREATE", "방송 시작하기",
                    "네, 방송을 시작할 수 있는 페이지로 안내해 드릴게요!");
        }
        return new ActionTarget("STREAMING_VIEW", "스트리밍 보러가기",
                "네, 스트리밍 페이지로 안내해 드릴게요!");
    }

    // 19단계: match()가 이번 메시지만 보고 null을 반환했더라도, 답변에 실제로
    // 쓴 knowledge(직전 주제 상속 포함)가 있다면 그 knowledge를 기준으로
    // action을 만든다 - 답변 내용과 intent/actions가 서로 다른 결론을 내지
    // 않도록 하나의 기준으로 통일한다.
    private ActionTarget resolveFinalActionTarget(FeatureIntentClassifier.Match match,
                                                    List<EasysKnowledge> knowledge, String rawMessage) {
        if (match != null) {
            return resolveActionTarget(match.category(), rawMessage);
        }
        if (knowledge.isEmpty()) {
            return null;
        }
        String category = knowledge.get(0).category();
        return switch (category) {
            case "mentoring" -> new ActionTarget("MENTORING", "멘토링 둘러보기",
                    "네, 멘토링 페이지로 안내해 드릴게요!");
            case "calendar" -> new ActionTarget("CALENDAR", "캘린더 바로가기",
                    "네, 캘린더 페이지로 안내해 드릴게요!");
            case "community" -> new ActionTarget("COMMUNITY", "커뮤니티 바로가기",
                    "네, 커뮤니티 페이지로 안내해 드릴게요!");
            case "group_study" -> new ActionTarget("STUDY_GROUP", "스터디 둘러보기",
                    "네, 스터디 페이지로 안내해 드릴게요!");
            case "cafe_reservation" -> new ActionTarget("STUDY_RESERVATION", "스터디룸 예약 바로가기",
                    "네, 스터디룸 예약 페이지로 안내해 드릴게요!");
            case "streaming" -> resolveStreamingActionTarget(rawMessage);
            default -> null; // about, payment는 별도 바로가기가 어울리지 않음
        };
    }

    private List<EasysKnowledge> resolveKnowledge(String rawMessage, FeatureIntentClassifier.Match match,
                                                   List<ChatSessionService.ChatTurn> history) {
        List<EasysKnowledge> knowledge = easysKnowledgeService.search(rawMessage, match);

        boolean weak = knowledge.isEmpty()
                || (knowledge.size() == 1 && "payment".equals(knowledge.get(0).category()));

        // "라디스가 뭐야?"처럼 완전히 새로운(그리고 EASYS와 무관한) 용어를 물었는데,
        // 검색 결과가 없다는 이유만으로 직전 대화의 지식을 그대로 물려받는 사례가
        // 있었다. 이 fallback은 "그럼 승인하면?"처럼 주어가 없는 후속 질문을 위한
        // 것이지, "X가 뭐야?"처럼 스스로 새로운 대상을 밝히는 질문에는 적용하면
        // 안 된다.
        boolean asksWhatSomethingIs = rawMessage != null && rawMessage.contains("뭐");

        // 19단계: "내가 등록한 멘토링은? → java"에서 "java"까지 멘토링 문맥으로
        // 강제 처리되던 문제. "java"/"http"/"spring"처럼 EASYS 도메인과 전혀
        // 무관한 완전히 새로운 단어는, 그 자체로는 어떤 카테고리에도 안 걸려서
        // (match==null) 예전 로직으로는 무조건 직전 주제를 물려받았다. 이제는
        // 이번 입력에 스트리밍 시청/생성, 스터디 그룹/카페 같은 EASYS 도메인
        // 신호가 조금이라도 있거나("구경하고 싶어"의 "구경"처럼 정식 카테고리
        // 별칭은 아니지만 의미가 있는 표현), "그럼"/"그거"/"되면"처럼 이전
        // 대화를 이어받는 게 명백한 연결 표현이 있을 때만 직전 주제를 물려받는다.
        // 둘 다 없는 완전히 새로운 단어는 일반 지식 질문으로 그대로 둔다(Qwen이
        // 일반 지식으로 답하도록 - EASYS_PROMPT_COMMON만으로도 이미 잘 처리됨).
        boolean hasEasysDomainSignal = FeatureIntentClassifier.matchStreamingIntent(rawMessage) != null
                || FeatureIntentClassifier.matchStudyTopic(rawMessage) != null
                || FeatureIntentClassifier.looksLikeContextContinuation(rawMessage);

        if (weak && !asksWhatSomethingIs && hasEasysDomainSignal) {
            String previousUserMessage = findLastUserMessage(history);
            if (previousUserMessage != null) {
                List<EasysKnowledge> previousKnowledge = easysKnowledgeService.search(
                        previousUserMessage, FeatureIntentClassifier.match(previousUserMessage)
                );
                if (!previousKnowledge.isEmpty()) {
                    knowledge = previousKnowledge;
                }
            }
        }

        return knowledge;
    }

    private String buildSystemPrompt(String rawMessage, List<EasysKnowledge> knowledge) {
        if (knowledge.isEmpty()) {
            return EASYS_PROMPT_COMMON;
        }

        StringBuilder knowledgeBlock = new StringBuilder("EASYS 관련 참고 지식:\n");
        for (EasysKnowledge item : knowledge) {
            knowledgeBlock.append("- ").append(item.title()).append(": ").append(item.content()).append("\n");
        }
        knowledgeBlock.append("이 참고 지식을 기반으로 답변하고, 참고 지식에 없는 내용을 임의로 만들어내지 마세요.");

        knowledgeBlock.append("\n지금 질문의 주제는 \"").append(knowledge.get(0).title())
                .append("\"입니다. 이전 대화에서 나온 다른 기능(멘토링, 그룹 스터디, 카페 예약, ")
                .append("캘린더, 스트리밍, 커뮤니티 등)의 절차나 표현을 이번 답변에 섞지 말고, ")
                .append("지금 주제에만 집중해서 답하세요.");

        boolean isPaymentKnowledge = knowledge.stream().anyMatch(item -> "payment".equals(item.category()));
        if (isPaymentKnowledge) {
            knowledgeBlock.append("\n환불에 대해 위 참고 지식에 적혀 있는 내용만 그대로 전달하세요. ")
                    .append("위에 적혀 있지 않은 기간, 절차, 연락 방법은 언급하지 마세요.");
        }

        boolean isStreamingKnowledge = knowledge.stream().anyMatch(item -> "streaming".equals(item.category()));
        if (isStreamingKnowledge) {
            FeatureIntentClassifier.StreamingIntent streamingIntent =
                    FeatureIntentClassifier.matchStreamingIntent(rawMessage);
            if (streamingIntent == FeatureIntentClassifier.StreamingIntent.VIEW) {
                knowledgeBlock.append("\n사용자는 방송을 \"시청\"하고 싶어합니다. 방송을 만드는 ")
                        .append("방법이 아니라 시청하는 방법을 설명하세요.");
            } else if (streamingIntent == FeatureIntentClassifier.StreamingIntent.CREATE) {
                knowledgeBlock.append("\n사용자는 방송을 직접 \"만들고\" 싶어합니다. 시청 방법이 ")
                        .append("아니라 방송을 만드는 방법을 설명하세요.");
            }
            knowledgeBlock.append("\n스트리밍은 카페(스터디룸) 예약과 관련이 없는 별도의 기능입니다. ")
                    .append("스터디룸에서 스트리밍을 시작한다는 식으로 섞지 마세요.");
        }

        return EASYS_PROMPT_COMMON + "\n\n" + knowledgeBlock;
    }

    private String withRecencyTopicReminder(String message, List<EasysKnowledge> knowledge) {
        if (knowledge.isEmpty()) {
            return message;
        }
        return "[지금 답변할 주제: " + knowledge.get(0).title() + " - 다른 기능 얘기는 섞지 마세요]\n" + message;
    }

    private String normalizeCjkPunctuation(String reply) {
        if (reply == null) {
            return null;
        }
        StringBuilder sb = new StringBuilder(reply.length());
        for (int i = 0; i < reply.length(); i++) {
            char c = reply.charAt(i);
            String replacement = CJK_PUNCTUATION_REPLACEMENTS.get(c);
            sb.append(replacement != null ? replacement : c);
        }
        return sb.toString();
    }

    private String fixEasysParticles(String reply) {
        if (reply == null) {
            return null;
        }
        String fixed = reply;
        for (Map.Entry<String, String> entry : EASYS_PARTICLE_FIXES.entrySet()) {
            fixed = fixed.replace(entry.getKey(), entry.getValue());
        }
        return fixed;
    }

    private String stripHallucinatedSentences(String reply) {
        reply = stripSentencesMatching(reply, INVENTED_CONTACT_CHANNEL_PATTERN,
                "존재하지 않는 문의 창구(고객센터 등) 언급이 감지되어 해당 문장을 제거합니다: {}");
        reply = stripSentencesMatching(reply, EASYS_WEBSITE_ACCESS_PATTERN,
                "'EASYS 웹사이트로 접속하세요' 언급이 감지되어 해당 문장을 제거합니다: {}");
        reply = stripSentencesMatching(reply, OTHER_SITE_RECOMMENDATION_PATTERN,
                "다른 사이트 추천 문구가 감지되어 해당 문장을 제거합니다: {}");
        reply = stripSentencesMatching(reply, EASYS_ABBREVIATION_HALLUCINATION_PATTERN,
                "'이지스는 EASYS의 약어' 같은 근거 없는 문장이 감지되어 제거합니다: {}");
        return reply;
    }

    private String stripSentencesMatching(String reply, Pattern pattern, String warnMessage) {
        if (reply == null || !pattern.matcher(reply).find()) {
            return reply;
        }
        log.warn(warnMessage, reply);

        String[] sentences = reply.split("(?<=[.!?])\\s*");
        StringBuilder sb = new StringBuilder();
        for (String sentence : sentences) {
            if (pattern.matcher(sentence).find()) {
                continue;
            }
            if (sb.length() > 0) {
                sb.append(" ");
            }
            sb.append(sentence);
        }
        String cleaned = sb.toString().trim();
        return cleaned.isEmpty() ? FOREIGN_SCRIPT_SAFE_REPLY : cleaned;
    }

    private String guardAgainstForeignScript(String reply, List<ChatSessionService.ChatTurn> history,
                                              String promptMessage, String systemPrompt) {
        if (reply == null || !FOREIGN_SCRIPT_PATTERN.matcher(reply).find()) {
            return reply;
        }

        log.warn("응답에 한자/일본어 문자가 감지되어 재시도합니다: {}", reply);
        String retried = normalizeCjkPunctuation(
                askQwen(history, promptMessage, systemPrompt + FOREIGN_SCRIPT_RETRY_NOTE)
        );
        if (!FOREIGN_SCRIPT_PATTERN.matcher(retried).find()) {
            return retried;
        }

        log.warn("재시도한 응답에도 한자/일본어 문자가 감지되어 안전 답변으로 대체: {}", retried);
        return FOREIGN_SCRIPT_SAFE_REPLY;
    }

    private String guardAgainstRefundPeriodHallucination(String reply) {
        if (reply != null && REFUND_PERIOD_HALLUCINATION_PATTERN.matcher(reply).find()) {
            log.warn("환불 기간 hallucination 감지, 안전 답변으로 대체: {}", reply);
            return REFUND_SAFE_REPLY;
        }
        return reply;
    }

    private String findLastUserMessage(List<ChatSessionService.ChatTurn> history) {
        for (int i = history.size() - 1; i >= 0; i--) {
            ChatSessionService.ChatTurn turn = history.get(i);
            if (ChatSessionService.ROLE_USER.equals(turn.getRole())) {
                return turn.getContent();
            }
        }
        return null;
    }

    private String askQwen(List<ChatSessionService.ChatTurn> history, String message, String systemPrompt) {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        for (ChatSessionService.ChatTurn turn : history) {
            String role = ChatSessionService.ROLE_MODEL.equals(turn.getRole()) ? "assistant" : "user";
            messages.add(Map.of("role", role, "content", turn.getContent()));
        }
        messages.add(Map.of("role", "user", "content", message));

        return customLlmClient.ask(messages);
    }
}
