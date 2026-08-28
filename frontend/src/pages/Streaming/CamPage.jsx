import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CamPage.css";
import 'leaflet/dist/leaflet.css';

import { VideoCard } from "./VideoCard";
import { MiniCalendar } from "./MiniCalendar";

const KAKAO_JS_KEY = "f7d216c9253bd3d4d3cf2eaf836373f8";

const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" }
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
  const calFirstDay = new Date(calYear, calMonth, 1).getDay();
  const calLastDate = new Date(calYear, calMonth + 1, 0).getDate();

  const moveMiniMonth = (amount) => {
    setCalendarDate(new Date(calYear, calMonth + amount, 1));
  };

  const [groupSchedules, setGroupSchedules] = useState([]);
  const [myPosition, setMyPosition] = useState([37.4563, 126.7052]);
  const [peerLocations, setPeerLocations] = useState({});

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
      } catch (err) {
        console.error("모임 일정 조회 오류:", err);
      }
    };
    fetchGroupSchedules();
  }, []);

  // 브라우저 위치 정보 가져오기 및 서버 전송
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const pos = [latitude, longitude];
          setMyPosition(pos);

          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: "location-update",
              senderId: myIdRef.current,
              nickname: nickname,
              lat: latitude,
              lng: longitude
            }));
          }
        },
        (error) => {
          console.error("위치 정보를 가져오지 못했습니다.", error);
        }
      );
    }
  }, [nickname]);

  useEffect(() => {
    Object.values(pcsRef.current).forEach((pc) => {
      try { pc.close(); } catch (e) {}
    });
    pcsRef.current = {};
    candidateQueueRef.current = {};
    setRemoteStreams({});
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
      file: null,
      time: timeStr
    };

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msgData));
    }
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

      recognition.onerror = () => {};
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
      const existingPc = pcsRef.current[targetPeerId];
      if (existingPc.signalingState !== "closed") {
        return existingPc;
      }
      delete pcsRef.current[targetPeerId];
    }

    const pc = new RTCPeerConnection(rtcConfig);
    pcsRef.current[targetPeerId] = pc;
    candidateQueueRef.current[targetPeerId] = [];

    pc.addTransceiver("video", { direction: "sendrecv" });
    pc.addTransceiver("audio", { direction: "sendrecv" });

    pc.onconnectionstatechange = async () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        try {
          const offer = await pc.createOffer({ iceRestart: true });
          await pc.setLocalDescription(offer);
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: "offer",
              senderId: myIdRef.current,
              target: targetPeerId,
              offer: offer
            }));
          }
        } catch (e) {}
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStreams((prev) => ({
          ...prev,
          [targetPeerId]: event.streams[0]
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
      } catch (e) {}
    }
  };

  const sendOfferToPeer = async (targetPeerId) => {
    try {
      const pc = createPeerConnection(targetPeerId);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);

      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "offer",
          senderId: myIdRef.current,
          target: targetPeerId,
          offer: offer
        }));
      }
    } catch (e) {}
  };

  useEffect(() => {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${hostname}:8080/signal`;
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      // 🌟 1. 캐시와 리스트 갱신 함수 추가
      let allUsersCache = [];

      const updateRemoteList = (newUsers) => {
        if (!myIdRef.current) return;
        // 중복 방지를 위해 Set으로 고유 ID만 추출
        const uniqueUsers = Array.from(new Set(newUsers));
        const others = uniqueUsers.filter((id) => id !== myIdRef.current);

        remoteUsersRef.current = others;
        setRemoteUsers(others);

        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            others.forEach((targetId) => {
              ws.send(JSON.stringify({
                type: "request-stream",
                senderId: myIdRef.current,
                target: targetId
              }));
            });
          }
        }, 300);
      };

      const sendJoin = () => {
        const currentNick = localStorage.getItem("userNickname") || nickname;
        if (ws.readyState === WebSocket.OPEN && currentNick) {
          ws.send(JSON.stringify({
            type: "join",
            nickname: currentNick
          }));
        }
      };

      ws.onopen = () => {
        sendJoin();
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "init") {
            myIdRef.current = data.myId;
            // 🌟 2. 초기화 완료 시 캐시된 리스트 반영
            updateRemoteList(allUsersCache);
          } else if (data.type === "location-update") {
            if (data.senderId && data.senderId !== myIdRef.current) {
              setPeerLocations((prev) => ({
                ...prev,
                [data.senderId]: {
                  lat: data.lat,
                  lng: data.lng,
                  nickname: data.nickname || "참가자"
                }
              }));
            }
          } else if (data.type === "userList") {
            // 🌟 3. 유저 리스트 수신 시 캐시에 담고 함수 호출
            const rawUsers = data.users || [];
            const distinctPeerIds = [];
            const nickMap = {};

            for (let i = 0; i < rawUsers.length; i++) {
              const item = rawUsers[i];
              let id = "";
              let nick = "";

              if (typeof item === "string") {
                id = item;
                nick = item;
              } else if (item && typeof item === "object") {
                id = item.id || "";
                nick = item.nickname || "참가자";
              }

              if (!id) continue;

              distinctPeerIds.push(id);
              nickMap[id] = nick;
            }

            allUsersCache = distinctPeerIds;
            setRemoteNicknames((prev) => ({ ...prev, ...nickMap }));
            updateRemoteList(allUsersCache);

          } else if (data.type === "request-stream") {
            if (localStreamRef.current && data.senderId && data.senderId !== myIdRef.current) {
              sendOfferToPeer(data.senderId);
            }
          } else if (data.type === "offer") {
            if (data.target && data.target !== myIdRef.current) return;

            const pc = createPeerConnection(data.senderId);
            if (pc.signalingState !== "stable") {
              return;
            }

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

            if (pc && pc.signalingState === "have-local-offer") {
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
              try { pcsRef.current[data.senderId].close(); } catch (e) {}
              delete pcsRef.current[data.senderId];
            }
            setRemoteStreams((prev) => {
              const updated = { ...prev };
              delete updated[data.senderId];
              return updated;
            });
          } else if (data.type === "chat") {
            if (data.senderId && data.nickname) {
              setRemoteNicknames((prev) => ({
                ...prev,
                [data.senderId]: data.nickname
              }));
            }

            const isMine = data.senderId === myIdRef.current;

            setMessages((prev) => {
              const isDuplicate = prev.slice(-3).some(
                (m) => m.text === data.text && m.nickname === data.nickname && m.time === data.time
              );

              if (isDuplicate) {
                return prev;
              }

              return [
                ...prev,
                {
                  id: Date.now() + Math.random(),
                  nickname: data.nickname,
                  text: data.text,
                  image: data.image,
                  file: data.file,
                  time: data.time,
                  isSystem: data.isSystem || false,
                  isMe: isMine
                }
              ];
            });
          }
        } catch (e) {}
      };

      return () => {
        stopStream();
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    }, []);

  const stopStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setShareMode("idle");

    window.activeSharedStream = null;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsSttActive(false);
    }

    Object.values(pcsRef.current).forEach((pc) => {
      try { pc.close(); } catch (e) {}
    });
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
    try {
      let newStream = null;
      if (type === "camera") {
        newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } else {
        newStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      localStreamRef.current = newStream;
      setLocalStream(newStream);
      setShareMode(type);

      window.activeSharedStream = newStream;
      newStream.getVideoTracks()[0].onended = () => stopStream();

      // 내 미디어가 켜진 순간 모든 리모트 유저에게 Offer를 즉시 날려 내 화면을 송출합니다.
      for (const peerId of remoteUsersRef.current) {
        await sendOfferToPeer(peerId);
      }
    } catch (err) {
      alert("카메라 또는 화면 공유 권한을 허용해주세요.");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const currentText = inputMessage.trim();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    if (currentText === "ㄷㄹ") {
      setIsCalendarOpen((prev) => !prev);
      setInputMessage("");
      return;
    }

    const msgData = {
      type: "chat",
      senderId: myIdRef.current,
      nickname: nickname,
      text: currentText,
      image: null,
      file: null,
      time: timeStr
    };

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msgData));
    }

    setInputMessage("");
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const totalUsers = 1 + remoteUsers.length;

  return (
    <main className="cam-study-container">
      <section className="cam-header">
        <h2>👥 실시간 스터디룸 (접속자: {totalUsers}명)</h2>
        <button type="button" className="btn-kakao-invite" onClick={handleKakaoInvite}>
          <span>💬 카카오톡 초대</span>
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

             {/* 스트림이 수신되고 있는 참가자만 필터링하여 렌더링 (빈 대기 카드 제거) */}
             {remoteUsers.filter(peerId => remoteStreams[peerId]).map((peerId, idx) => (
                 <VideoCard
                     key={peerId}
                     label={`참가자 (${peerId.substring(0, 4)})`}
                     isLocal={false}
                     stream={remoteStreams[peerId]}
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
                placeholder='메시지 입력 ("ㄷㄹ" 입력 시 캘린더 토글)...'
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