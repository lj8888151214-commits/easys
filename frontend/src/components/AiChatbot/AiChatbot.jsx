import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./AiChatbot.css";

import aiIconDefault from "../../assets/images/AI_LLM1.png";
import aiIconHover from "../../assets/images/AI_LLM2.png";

// 18단계: 챗봇 답변에 붙일 EASYS 기능 바로가기 버튼. 경로는 App.jsx의 실제
// <Route path>를 그대로 가져온 것이다 - Qwen도, 여기 프론트도 URL을 직접 만들지
// 않는다. 백엔드(AiChatService)가 답변마다 관련된 action(들)을 target 코드로
// 내려주고, 여기서는 그 코드를 실제 경로로만 연결한다.
//
// STUDY_GROUP(그룹 스터디, /study)과 STUDY_RESERVATION(카페 스터디룸 예약,
// /study-reservation), STREAMING_VIEW(방송 목록/시청, /streaming)와
// STREAMING_CREATE(방송 시작하기, /streaming/cam)를 분리했다 - 실제로 서로 다른
// 페이지인데도 하나로 묶여서 시청 의도인데 생성 페이지로 안내되던 문제가 있었다.
// STREAMING_ROOM은 "지금 제일 인기있는 방송" 같은 실제 데이터 응답에서, 그 방으로
// 바로 들어갈 수 있게 action.query(예: "roomId=5")를 경로 뒤에 붙인다.
const ACTION_ROUTES = {
  MENTORING: { label: "멘토링 바로가기", path: "/mentor" },
  CALENDAR: { label: "캘린더 바로가기", path: "/calendar" },
  STREAMING_VIEW: { label: "스트리밍 보러가기", path: "/streaming" },
  STREAMING_CREATE: { label: "방송 시작하기", path: "/streaming/cam" },
  STREAMING_ROOM: { label: "방송 보러가기", path: "/streaming/cam" },
  STUDY_GROUP: { label: "스터디 바로가기", path: "/study" },
  STUDY_RESERVATION: { label: "스터디룸 예약 바로가기", path: "/study-reservation" },
  COMMUNITY: { label: "커뮤니티 바로가기", path: "/community" },
  // 20단계: 비로그인 무료 체험을 다 쓰면 회원가입 페이지(App.jsx의 "/member")로
  // 안내한다. 다른 회원가입 경로를 새로 만들지 않고 기존 라우트를 그대로 쓴다.
  SIGNUP: { label: "회원가입하기", path: "/member" },
};

// 20단계: 비로그인 사용자의 무료 체험 횟수를 서버(Redis)가 세려면 "이 브라우저"를
// 구분할 식별자가 하나 필요하다. 이 값 자체에는 "몇 번 남았는지" 같은 정보를
// 전혀 담지 않는다 - 실제 남은 횟수 판단은 항상 서버가 한다. sessionId(대화 세션)는
// 새로고침하면 사라지지만, 이 guestId는 같은 브라우저에서 계속 재사용된다.
const GUEST_ID_STORAGE_KEY = "easys_ai_guest_id";

function getOrCreateGuestId() {
  try {
    let guestId = localStorage.getItem(GUEST_ID_STORAGE_KEY);
    if (!guestId) {
      guestId = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(GUEST_ID_STORAGE_KEY, guestId);
    }
    return guestId;
  } catch (err) {
    // localStorage를 쓸 수 없는 환경(프라이빗 모드 등)이면 매 요청마다 새
    // guestId를 쓰게 되어 무료 체험 제한이 정확하지 않을 수 있지만, 채팅 자체는
    // 계속 동작해야 하므로 null을 반환해 서버가 sessionId로 대신 식별하게 한다.
    return null;
  }
}

// 백엔드가 내려준 actions(0개 이상)를 실제 경로가 있는 것만 걸러서 버튼 목록으로
// 바꾼다. 관련 없는 기능 버튼을 전부 보여주지 않기 위해, 백엔드가 이번 질문과
// 관련된 것만 골라 내려준 것을 그대로 믿고 쓴다. type이 "NAVIGATION"인 것만
// 대상으로 한다 - "CONFIRM"(19단계, 대화 삭제 확인/취소)은 페이지 이동이 아니라
// 버튼 클릭 자체가 동작이라 별도로 처리한다(아래 confirmActionsFromActions).
function shortcutsFromActions(actions) {
  if (!Array.isArray(actions) || actions.length === 0) return [];
  return actions
    .filter((action) => action?.type === "NAVIGATION")
    .map((action) => {
      const route = ACTION_ROUTES[action?.target];
      if (!route) return null;
      const path = action.query ? `${route.path}?${action.query}` : route.path;
      return { path, label: action.label || route.label };
    })
    .filter(Boolean);
}

// 19단계: "지금까지 대화 다 지워줘" 확인 단계에서 내려오는 action들.
// NAVIGATION과 달리 페이지 이동이 아니라 실제 삭제 API 호출(또는 취소)이므로
// <Link> 대신 <button>으로 렌더링한다.
function confirmActionsFromActions(actions) {
  if (!Array.isArray(actions)) return [];
  return actions.filter((action) => action?.type === "CONFIRM");
}

const HISTORY_ENDPOINT_PATH = "/api/ai/history";

// EASYS AI 챗봇 (1단계: Gemini API 연결 + 질문/답변).
// 채팅창이 열려있는지(isOpen)는 App.jsx가 소유한다 - PC의 플로팅 버튼(이 컴포넌트)과
// 모바일의 Header AI 아이콘이 같은 상태를 공유해 같은 채팅창을 열고 닫아야 하기
// 때문이다(둘은 형제 컴포넌트라 상태를 직접 공유할 수 없어 부모로 끌어올렸다).
// 일반적인 웹 개발/학습 질문은 로그인 없이 누구나 사용할 수 있다. 개인 데이터
// (캘린더/예약 등)를 다루는 기능이 추가되면, 그 기능을 실행하는 시점에 별도로
// 로그인 여부를 확인하도록 설계한다 (지금은 그런 기능이 없어 여기서 확인하지 않음).
export default function AiChatbot({ isOpen, onToggle, onClose }) {
  const [isHovered, setIsHovered] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 서버(Redis)에 저장된 이전 대화와 이어가기 위한 세션 ID. 처음엔 아직 모르니 null로
  // 보내고, 서버가 응답에 실어주는 sessionId를 저장해뒀다가 다음 질문부터 그대로
  // 다시 보낸다 - 그래야 서버가 "같은 대화의 다음 질문"이라는 걸 알 수 있다.
  const [sessionId, setSessionId] = useState(null);

  // 메시지 목록 자동 스크롤용. 사용자가 과거 메시지를 읽으려고 위로 스크롤해둔
  // 상태라면(shouldAutoScroll = false) 새 답변이 와도 강제로 끌어내리지 않는다.
  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 80;
  };

  // 새 메시지가 추가되거나(사용자 질문/AI 답변), AI가 답변을 준비 중일 때도
  // 아래쪽에 있었다면 계속 최신 위치를 따라가도록 한다.
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el || !shouldAutoScrollRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isLoading, isOpen]);

  // 18단계: 로그인 사용자는 로그아웃해도 채팅 기록이 지워지지 않고, 다시 로그인하면
  // 이어서 볼 수 있어야 한다. 서버(GET /api/ai/history)가 "이 계정의 영구 채팅
  // 기록"을 항상 member 기준으로만 돌려주므로(비로그인/다른 계정이면 빈 배열),
  // 그 결과를 그대로 믿고 messages를 채운다 - 다른 사용자의 기록이 섞여 보일
  // 위험은 서버 쪽에서 이미 막혀 있다.
  //
  // 페이지를 처음 열 때 한 번, 그리고 채팅창을 다시 열 때마다(로그인/로그아웃
  // 상태가 바뀌었을 수 있으므로) 다시 불러온다. 서버가 빈 배열을 주면(비로그인,
  // 또는 아직 대화한 적 없는 계정) 지금 화면에 있는 대화(비로그인 사용자의
  // 진행 중인 대화 등)를 그대로 둔다 - 있는 기록을 함부로 지우지 않는다.
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    (async () => {
      try {
        const backendHost = window.location.hostname;
        const response = await fetch(`http://${backendHost}:8080${HISTORY_ENDPOINT_PATH}`, {
          credentials: "include",
        });
        if (!response.ok || cancelled) return;

        const history = await response.json();
        if (cancelled || !Array.isArray(history) || history.length === 0) return;

        setMessages(
            history.map((item) => ({
              role: item.role === "ai" ? "ai" : "user",
              text: item.text,
            }))
        );
      } catch (err) {
        // 기록 복원은 부가 기능이라 실패해도 새 대화를 막지 않는다.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // 18단계: action 버튼(예: "멘토링 둘러보기 →")을 눌렀을 때, <Link>가 실제로는
  // 정상적으로 페이지를 이동시키지만 채팅창이 position:fixed로 화면 위에 계속
  // 떠 있어서(모바일에서는 거의 전체 화면) 이동한 것이 눈에 잘 보이지 않는
  // 문제가 있었다. 버튼을 누르면 이동과 동시에 채팅창을 닫아서, 이동한 페이지가
  // 확실히 보이게 한다.
  const handleShortcutClick = () => {
    onClose();
  };

  // 19단계: "대화 기록 삭제"/"취소" 버튼 클릭 처리. 삭제는 사용자가 이 버튼을
  // 직접 눌렀을 때만 실행된다(확인 질문 자체는 아무것도 지우지 않는다).
  // 삭제 API(DELETE /api/ai/chat/history)는 항상 로그인한 사용자 본인 기준으로만
  // 지우므로, 여기서는 그냥 호출하고 화면(이 브라우저에 보이는 대화)을 비운다.
  const handleConfirmAction = async (action) => {
    if (action.target !== "DELETE_CHAT_HISTORY") {
      // 취소: 서버를 호출하지 않고, 기록은 그대로 둔 채 안내만 보여준다.
      setMessages((prev) => [...prev, { role: "ai", text: "네, 취소했어요. 대화 기록은 그대로 남아있어요." }]);
      return;
    }

    try {
      const backendHost = window.location.hostname;
      const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
      await fetch(`http://${backendHost}:8080${HISTORY_ENDPOINT_PATH}${query}`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch (err) {
      // 네트워크 오류가 나도 화면은 아래에서 비운다 - 사용자가 다시 "대화
      // 지워줘"를 요청하면 서버에도 다시 삭제를 시도하게 된다.
    }

    setMessages([{ role: "ai", text: "네, 지금까지의 대화 기록을 모두 삭제했어요." }]);
    setSessionId(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // 내가 방금 보낸 메시지는 과거 스크롤 위치와 무관하게 항상 보여준다.
    shouldAutoScrollRef.current = true;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setErrorMessage("");
    setIsLoading(true);

    try {
      // 상대경로("/api/ai/chat")는 Vite 개발 서버 프록시가 "/api"를 떼고
      // 백엔드로 넘겨서 AiChatController(/api/ai/chat)와 매칭이 안 됐다.
      // CamPage.jsx 등 이 프로젝트의 다른 절대경로 호출과 동일하게 맞춘다.
      const backendHost = window.location.hostname;
      const response = await fetch(`http://${backendHost}:8080/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: trimmed, sessionId, guestId: getOrCreateGuestId() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "AI 응답을 가져오지 못했어요. 잠시 후 다시 시도해주세요.");
        return;
      }

      // 바로가기/확인 버튼은 Qwen이 만든 게 아니라 백엔드(AiChatService)가
      // 판단한 actions로 정한다.
      const shortcuts = shortcutsFromActions(data.actions);
      const confirmActions = confirmActionsFromActions(data.actions);
      setMessages((prev) => [...prev, { role: "ai", text: data.reply, shortcuts, confirmActions }]);
      setSessionId(data.sessionId);
    } catch (err) {
      setErrorMessage("네트워크 오류로 답변을 받지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-chatbot">
      {isOpen && (
        <div className="ai-chatbot-window">
          <div className="ai-chatbot-header">
            <div className="ai-chatbot-header-title">
              <img src={aiIconDefault} alt="" className="ai-chatbot-avatar" />
              <span>EASYS AI 챗봇</span>
            </div>
            <button type="button" className="ai-chatbot-close" onClick={onClose}>
              ✕
            </button>
          </div>

          <div
            className="ai-chatbot-messages"
            ref={messagesContainerRef}
            onScroll={handleMessagesScroll}
          >
            {messages.length === 0 && (
              <div className="ai-chatbot-empty">
                <p>EASYS AI에게 무엇이든 물어보세요.</p>
                <p>학습 중 궁금한 개념부터 EASYS 이용 방법까지 편하게 질문해보세요.</p>
              </div>
            )}

            {messages.map((msg, index) => (
              <Fragment key={index}>
                <div
                  className={`ai-chatbot-message-row ${msg.role === "user" ? "user" : "ai"}`}
                >
                  {msg.role === "ai" && (
                    <img src={aiIconDefault} alt="" className="ai-chatbot-avatar" />
                  )}
                  <div className={`ai-chatbot-message ${msg.role === "user" ? "user" : "ai"}`}>
                    {msg.text}
                  </div>
                </div>

                {msg.shortcuts?.map((shortcut, shortcutIndex) => (
                  <Link
                    key={shortcutIndex}
                    to={shortcut.path}
                    className="ai-chatbot-shortcut"
                    onClick={handleShortcutClick}
                  >
                    {shortcut.label} →
                  </Link>
                ))}

                {msg.confirmActions?.length > 0 && (
                  <div className="ai-chatbot-confirm-row">
                    {msg.confirmActions.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        type="button"
                        className="ai-chatbot-shortcut ai-chatbot-confirm-button"
                        onClick={() => handleConfirmAction(action)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </Fragment>
            ))}

            {isLoading && (
              <div className="ai-chatbot-message-row ai">
                <img src={aiIconDefault} alt="" className="ai-chatbot-avatar" />
                <div className="ai-chatbot-message ai ai-chatbot-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="ai-chatbot-error">{errorMessage}</div>
            )}
          </div>

          <form className="ai-chatbot-input-area" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="궁금한 걸 물어보세요"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()}>
              전송
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="ai-chatbot-toggle"
        onClick={onToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="EASYS AI 챗봇"
      >
        <img src={isHovered ? aiIconHover : aiIconDefault} alt="EASYS AI 챗봇" />
      </button>
    </div>
  );
}
