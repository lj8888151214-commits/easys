import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CamPage.css";
import 'leaflet/dist/leaflet.css';

import { MiniCalendar } from "./MiniCalendar";

// 개별 비디오 카드 컴포넌트
export function VideoCard({
  label,
  isLocal,
  stream,
  onStartCam,
  onStartScreen,
  onStop,
  shareMode,
  isSttActive,
  toggleStt
}) {
  const cardRef = useRef(null);
  const videoRef = useRef(null);

  const handleCardFullScreen = () => {
    if (!cardRef.current) return;
    if (!document.fullscreenElement) {
      cardRef.current.requestFullscreen().catch((err) => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (stream) {
      videoElement.srcObject = stream;
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (err.name !== "AbortError") console.log("비디오 재생 실패:", err);
        });
      }
    } else {
      videoElement.srcObject = null;
    }
  }, [stream]);

  return (
    <div className="cam-card" ref={cardRef}>
      <div className="cam-card-title">
        <h4>{label}</h4>
      </div>

      <div className="cam-stream-box">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className="cam-stream-img"
          />
        ) : (
          <div className="cam-placeholder">
            <span>미디어가 꺼져 있습니다</span>
          </div>
        )}
      </div>

      <div className="cam-btn-group">
        {isLocal && (
          <>
            <button
              type="button"
              className={`btn-custom btn-primary-cam ${shareMode === "camera" ? "active" : ""}`}
              onClick={onStartCam}
            >
              📷 캠 켜기
            </button>
            <button
              type="button"
              className={`btn-custom btn-desktop-cam ${shareMode === "screen" ? "active" : ""}`}
              onClick={onStartScreen}
            >
              🖥️ 화면 공유
            </button>
            <button
              type="button"
              className={`btn-custom ${isSttActive ? "btn-stt-on" : "btn-stt-off"}`}
              onClick={toggleStt}
            >
              {isSttActive ? "🎙️ STT 켜짐" : "🎙️ STT 꺼짐"}
            </button>
            {shareMode !== "idle" && (
              <button
                type="button"
                className="btn-custom btn-disconnect-cam"
                onClick={onStop}
                style={{ background: "#ef4444" }}
              >
                ⏹️ 중지하기
              </button>
            )}
          </>
        )}

        <button type="button" onClick={handleCardFullScreen} title="확대하기">
          ⛶ 확대하기
        </button>
      </div>
    </div>
  );
}

const KAKAO_JS_KEY = "f7d216c9253bd3d4d3cf2eaf836373f8";

const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ],
};

export default function CamPage() {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const myIdRef = useRef("");
  const remoteUsersRef = useRef([]);
  const localStreamRef = useRef(null);
  const pcsRef = useRef({});
  const candidateQueueRef = useRef({});
  const recognitionRef = useRef(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [remoteUsers, setRemoteUsers] = useState([]);
  const [remoteNicknames, setRemoteNicknames] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [shareMode, setShareMode] = useState("idle");
  const [isSttActive, setIsSttActive] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // 미니 캘린더 날짜 상태 및 계산 로직
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 7, 27));
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();

  const moveMiniMonth = (amount) => {
    setCalendarDate(new Date(calYear, calMonth + amount, 1));
  };

  const [groupSchedules, setGroupSchedules] = useState([]);
  const [messages, setMessages] = useState([
    { id: 1, text: "스터디룸에 입장했습니다.", isSystem: true }
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const [nickname, setNickname] = useState(() => {
    const nick = localStorage.getItem("userNickname");
    const email = localStorage.getItem("userEmail");
    if (nick && nick.trim()) return nick.trim();
    if (email && email.trim()) return email.includes("@") ? email.split("@")[0] : email.trim();
    return "게스트";
  });

  // 카카오 SDK 초기화
  useEffect(() => {
    const scriptId = "kakao-js-sdk";
    let script = document.getElementById(scriptId);

    const initKakao = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_JS_KEY);
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://t1.daumcdn.net/kakaotalk/resource/tmpl/default/friends.png";
      script.async = true;
      script.onload = initKakao;
      document.head.appendChild(script);
    } else {
      initKakao();
    }
  }, []);

  const handleKakaoInvite = () => {
    if (!window.Kakao) {
      alert("카카오 SDK가 초기화되지 않았습니다.");
      return;
    }

    const inviteUrl = `${window.location.origin}/login?redirect=${encodeURIComponent("/streaming/cam")}`;

    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: "👥 [이지스] 실시간 화상 스터디 초대",
        description: `${nickname}님이 화상 스터디룸으로 초대했습니다. 로그인 후 참여해 주세요!`,
        imageUrl: "https://t1.daumcdn.net/kakaotalk/resource/tmpl/default/friends.png",
        link: {
          mobileWebUrl: inviteUrl,
          webUrl: inviteUrl,
        },
      },
      buttons: [
        {
          title: "스터디룸 입장하기",
          link: {
            mobileWebUrl: inviteUrl,
            webUrl: inviteUrl,
          },
        },
      ],
    });
  };

  // 서버에서 모임 일정 데이터 가져오기
  useEffect(() => {
    const fetchGroupSchedules = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/study-groups", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setGroupSchedules(Array.isArray(data) ? data : []);
        }
      } catch (err) {}
    };
    fetchGroupSchedules();
  }, []);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/member/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const realNick = data.nickname || (data.email ? data.email.split("@")[0] : "");
          if (realNick) {
            setNickname(realNick);
            localStorage.setItem("userNickname", realNick);
            if (data.email) localStorage.setItem("userEmail", data.email);

            if (socketRef.current?.readyState === WebSocket.OPEN) {
              socketRef.current.send(JSON.stringify({
                type: "join",
                nickname: realNick
              }));
            }
          }
        }
      } catch (err) {}
    };
    fetchMe();
  }, []);

  const sendSpeechChat = (transcriptText) => {
    if (!transcriptText.trim()) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const msgData = {
      type: "chat",
      senderId: myIdRef.current,
      nickname: nickname,
      text: `🎙️ ${transcriptText}`,
      image: null,
      time: timeStr
    };

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msgData));
    }

    setMessages((prev) => [...prev, { id: Date.now(), ...msgData, isMe: true }]);
  };

  const toggleStt = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("현재 브라우저는 음성 인식을 지원하지 않습니다. Chrome 또는 Edge를 사용해 주세요.");
      return;
    }

    if (isSttActive) {
      recognitionRef.current?.stop();
      setIsSttActive(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.lang = "ko-KR";
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.trim();
          sendSpeechChat(transcript);
        }
      };

      recognition.onend = () => {
        if (isSttActive) {
          try { recognition.start(); } catch (err) {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsSttActive(true);
    }
  };

  const createPeerConnection = (targetPeerId) => {
    if (pcsRef.current[targetPeerId]) {
      pcsRef.current[targetPeerId].close();
    }

    const pc = new RTCPeerConnection(rtcConfig);
    pcsRef.current[targetPeerId] = pc;
    candidateQueueRef.current[targetPeerId] = [];

pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];

        // 🌟 트랙 종료 시 자동 제거 핸들러 추가
        stream.getTracks().forEach(track => {
          track.onended = () => {
            setRemoteStreams((prev) => {
              const updated = { ...prev };
              delete updated[targetPeerId];
              return updated;
            });
          };
        });

        setRemoteStreams((prev) => ({
          ...prev,
          [targetPeerId]: stream
        }));
      }
    };
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "candidate",
          senderId: myIdRef.current,
          target: targetPeerId,
          candidate: event.candidate
        }));
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    return pc;
  };

  const processQueuedCandidates = async (peerId, pc) => {
    const queue = candidateQueueRef.current[peerId] || [];
    while (queue.length > 0) {
      const candidate = queue.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("Candidate 처리 에러:", e);
      }
    }
  };

  const sendOfferToPeer = async (targetPeerId) => {
    try {
      const pc = createPeerConnection(targetPeerId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current?.send(JSON.stringify({
        type: "offer",
        senderId: myIdRef.current,
        target: targetPeerId,
        offer: offer
      }));
    } catch (e) {
      console.error("Offer 전송 에러:", e);
    }
  };

  useEffect(() => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${hostname}:8080/signal`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    let allUsersCache = [];

    const updateRemoteList = (newUsers) => {
          if (!myIdRef.current) return;

          // 1. null, undefined, 빈 문자열 및 내 ID를 엄격하게 제거하고 고유 유저만 추출
          const others = Array.from(new Set(newUsers)).filter(
            (id) => id && typeof id === "string" && id !== myIdRef.current
          );

          // 2. 필터링 없이 서버가 준 참가자 목록을 그대로 반영하여 카드 슬롯 확보
          remoteUsersRef.current = others;
          setRemoteUsers(others);

          // 나간 유저의 피어 커넥션 및 스트림 확실하게 정리
          Object.keys(pcsRef.current).forEach((peerId) => {
            if (!others.includes(peerId)) {
              pcsRef.current[peerId]?.close();
              delete pcsRef.current[peerId];
              delete candidateQueueRef.current[peerId];
            }
          });

          setRemoteStreams((prev) => {
            const updated = { ...prev };
            Object.keys(updated).forEach((peerId) => {
              if (!others.includes(peerId)) {
                delete updated[peerId];
              }
            });
            return updated;
          });

          setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
              others.forEach((targetId, index) => {
                // 동시 요청 폭주 방지를 위한 순차 딜레이
                setTimeout(() => {
                  ws.send(JSON.stringify({
                    type: "request-stream",
                    senderId: myIdRef.current,
                    target: targetId
                  }));
                }, index * 200);
              });
            }
          }, 500);
        };

    ws.onopen = () => {
      const currentNick = localStorage.getItem("userNickname") || nickname;
      if (currentNick) {
        ws.send(JSON.stringify({ type: "join", nickname: currentNick }));
      }
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "init") {
          myIdRef.current = data.myId;
          updateRemoteList(allUsersCache);
        } else if (data.type === "userList") {
          const rawUsers = data.users || [];
          const distinctPeerIds = [];
          const nickMap = {};

          for (let i = 0; i < rawUsers.length; i++) {
            const item = rawUsers[i];
            let id = typeof item === "string" ? item : (item?.id || "");
            let nick = typeof item === "string" ? item : (item?.nickname || "참가자");
            if (!id || id === myIdRef.current) continue;
            if (!distinctPeerIds.includes(id)) {
              distinctPeerIds.push(id);
            }
            nickMap[id] = nick;
          }

          allUsersCache = distinctPeerIds;
          setRemoteNicknames((prev) => ({ ...prev, ...nickMap }));
          updateRemoteList(allUsersCache);
        } else if (data.type === "request-stream") {
                  // 상대방이 내 스트림을 요청하거나 내가 켜졌을 때 오퍼 전송
                  if (localStreamRef.current && data.senderId && data.senderId !== myIdRef.current) {
                    sendOfferToPeer(data.senderId);
                  }
            }else if (data.type === "offer") {
          if (data.target && data.target !== myIdRef.current) return;

          const pc = createPeerConnection(data.senderId);
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          await processQueuedCandidates(data.senderId, pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          ws.send(JSON.stringify({
            type: "answer",
            senderId: myIdRef.current,
            target: data.senderId,
            answer: answer
          }));
        } else if (data.type === "answer") {
          if (data.target && data.target !== myIdRef.current) return;
          const pc = pcsRef.current[data.senderId];

          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            await processQueuedCandidates(data.senderId, pc);
          }
        } else if (data.type === "candidate") {
          if (data.target && data.target !== myIdRef.current) return;
          const pc = pcsRef.current[data.senderId];

          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (e) {}
          } else {
            if (!candidateQueueRef.current[data.senderId]) {
              candidateQueueRef.current[data.senderId] = [];
            }
            candidateQueueRef.current[data.senderId].push(data.candidate);
          }
        } else if (data.type === "stream-stopped") {
          if (pcsRef.current[data.senderId]) {
            pcsRef.current[data.senderId].close();
            delete pcsRef.current[data.senderId];
          }
          delete candidateQueueRef.current[data.senderId];

          setRemoteStreams((prev) => {
            const updated = { ...prev };
            delete updated[data.senderId];
            return updated;
          });
        } else if (data.type === "chat") {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              nickname: data.nickname,
              text: data.text,
              image: data.image,
              time: data.time,
              isSystem: data.isSystem || false,
              isMe: false
            }
          ]);
        }
      } catch (e) {}
    };

    return () => {
      stopStream();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      ws.close();
    };
  }, []);

  const stopStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setShareMode("idle");

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsSttActive(false);
    }

    Object.values(pcsRef.current).forEach((pc) => pc.close());
    pcsRef.current = {};
    candidateQueueRef.current = {};

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "stream-stopped",
        senderId: myIdRef.current
      }));
    }
  };

  const handleStartMedia = async (type) => {
      stopStream();
      try {
        let stream = null;
        if (type === "camera") {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } else {
          stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        setShareMode(type);

        stream.getVideoTracks()[0].onended = () => stopStream();

        // 🌟 내가 미디어를 켰음을 모든 참가자에게 알림
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          remoteUsersRef.current.forEach((peerId, index) => {
            setTimeout(() => {
              socketRef.current.send(JSON.stringify({
                type: "request-stream",
                senderId: myIdRef.current,
                target: peerId
              }));
            }, index * 200);
          });
        }
      } catch (err) {
        console.error("미디어 권한 에러:", err);
        alert("카메라 또는 화면 공유 권한을 허용해주세요.");
      }
    };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const currentText = inputMessage.trim();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const msgData = {
      type: "chat",
      senderId: myIdRef.current,
      nickname: nickname,
      text: currentText,
      image: null,
      time: timeStr
    };

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msgData));
    }

    setMessages((prev) => [...prev, { id: Date.now(), ...msgData, isMe: true }]);
    setInputMessage("");
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const totalUsers = 1 + remoteUsers.length;
  const chatBottomRef = useRef(null);

  return (
    <main className="cam-study-container">
      <section className="cam-header">
        <h2>👥 실시간 스터디룸 (접속자: {totalUsers}명)</h2>
        <button type="button" className="btn-kakao-invite" onClick={handleKakaoInvite}>
          <span>💬 카카오톡 초대</span>
        </button>
        <button type="button" className="btn-kakao-invite" onClick={handleFullScreen} style={{ background: "#4f46e5" }}>
          <span>⛶ 전체 화면 모드</span>
        </button>
      </section>

      <section className="cam-main-layout">
        <div className="cam-grid">
          <VideoCard
            label={`나 (${nickname})`}
            isLocal={true}
            stream={localStream}
            onStartCam={() => handleStartMedia("camera")}
            onStartScreen={() => handleStartMedia("screen")}
            onStop={stopStream}
            shareMode={shareMode}
            isSttActive={isSttActive}
            toggleStt={toggleStt}
          />

          {remoteUsers.map((peerId) => (
                      <VideoCard
                        key={peerId}
                        label={`참가자 (${remoteNicknames[peerId] || peerId.substring(0, 4)})`}
                        isLocal={false}
                        stream={remoteStreams[peerId] || null} // 🌟 해당 유저의 스트림이 없으면 null로 내려서 플레이스홀더 표시
                        shareMode="idle"
                      />
                    ))}
        </div>

        <div className="cam-right-sidebar" style={{ position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div className="cam-chat-panel" style={{ height: "540px", flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="chat-header">
              <div className="chat-header-left">
                <span>실시간 채팅</span>
                <span className="chat-user-count-badge">{totalUsers}명 참여중</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCalendarOpen((prev) => !prev)}
                style={{ background: "#4f46e5", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
              >
                {isCalendarOpen ? "채팅 보기" : "📅 모임 캘린더"}
              </button>
            </div>

            <div className="chat-messages-container" ref={chatContainerRef} style={{ flex: 1, overflowY: "auto" }}>
              {messages.map((msg) =>
                msg.isSystem ? (
                  <div key={msg.id} className="chat-system-msg">{msg.text}</div>
                ) : (
                  <div key={msg.id} className={`chat-bubble-row ${msg.isMe ? "me" : "other"}`}>
                    <div className="chat-bubble">
                      {!msg.isMe && <strong style={{ display: "block", fontSize: "10px", color: "#666", marginBottom: "2px" }}>{msg.nickname}</strong>}
                      {msg.text}
                    </div>
                  </div>
                )
              )}
            </div>

            <form className="chat-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="chat-text-input"
                placeholder='메시지 입력...'
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
              />
              <button type="submit" className="chat-send-btn">전송</button>
            </form>
          </div>

          <MiniCalendar
            isCalendarOpen={isCalendarOpen}
            setIsCalendarOpen={setIsCalendarOpen}
            calendarDate={calendarDate}
            moveMiniMonth={moveMiniMonth}
            groupSchedules={groupSchedules}
          />
        </div>
      </section>
    </main>
  );
}

function handleFullScreen() {
  const elem = document.querySelector(".cam-study-container");
  if (!elem) return;
  if (!document.fullscreenElement) {
    elem.requestFullscreen().catch((err) => {});
  } else {
    document.exitFullscreen();
  }
}