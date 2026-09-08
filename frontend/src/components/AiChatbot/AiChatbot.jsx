import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./AiChatbot.css";

import aiIconDefault from "../../assets/images/AI_LLM1.png";
import aiIconHover from "../../assets/images/AI_LLM2.png";

// 질문에 EASYS 기능 관련 키워드가 있으면 그 기능 페이지로 가는 바로가기를 답변
// 아래에 붙여준다. 경로는 App.jsx의 실제 <Route path>를 그대로 가져온 것이다 -
// Gemini가 URL을 만들게 하지 않고, 여기서 미리 정해둔 경로만 사용한다.
// 순서가 우선순위다(위에서부터 먼저 매칭되는 걸 사용) - "멘토링 예약"처럼 여러
// 키워드가 겹칠 수 있는 질문은 "멘토"가 먼저 걸리게 멘토링을 위에 둔다.
const FEATURE_SHORTCUTS = [
  { category: "MENTORING", label: "멘토링 바로가기", path: "/mentor", keywords: ["멘토"] },
  { category: "CALENDAR", label: "캘린더 바로가기", path: "/calendar", keywords: ["캘린더", "일정"] },
  { category: "STREAMING", label: "스트리밍 바로가기", path: "/streaming", keywords: ["스트리밍", "방송"] },
  { category: "STUDY", label: "스터디 예약 바로가기", path: "/study-reservation", keywords: ["스터디", "카페"] },
  { category: "COMMUNITY", label: "커뮤니티 바로가기", path: "/community", keywords: ["커뮤니티"] },
];

function detectFeatureShortcut(question) {
  return FEATURE_SHORTCUTS.find((item) => item.keywords.some((kw) => question.includes(kw))) || null;
}

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
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "AI 응답을 가져오지 못했어요. 잠시 후 다시 시도해주세요.");
        return;
      }

      // 바로가기는 Gemini 답변이 아니라 "사용자가 한 질문"의 키워드로 판단한다
      // (질문 원문 그대로 판단해야 "멘토링은 어떻게 신청해?" 같은 질문이 확실히 걸린다).
      const shortcut = detectFeatureShortcut(trimmed);
      setMessages((prev) => [...prev, { role: "ai", text: data.reply, shortcut }]);
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
                자바, 스프링부트, 리액트처럼 웹 개발 공부하다 궁금한 걸 편하게 물어보세요!
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

                {msg.shortcut && (
                  <Link to={msg.shortcut.path} className="ai-chatbot-shortcut">
                    {msg.shortcut.label} →
                  </Link>
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
