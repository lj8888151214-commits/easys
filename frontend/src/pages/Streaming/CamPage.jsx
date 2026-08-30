import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./CamPage.css";

import { MiniCalendar } from "./MiniCalendar";

// Leaflet 기본 마커 이미지 경로 설정 오류 방지
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const KAKAO_JS_KEY = "f7d216c9253bd3d4d3cf2eaf836373f8"; // 🌟 누락되었던 JS 키 추가

// 지도 중심 이동용 헬퍼 컴포넌트
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

// 개별 비디오 카드 컴포넌트
export function VideoCard({
                            peerId,
                            label,
                            isLocal,
                            stream,
                            onStartCam,
                            onStartScreen,
                            onStop,
                            shareMode,
                            isSttActive,
                            toggleStt,
                            onOpenWhisper
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

// 카카오 SDK 동적 로드 보장
  useEffect(() => {
    if (window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_JS_KEY);
      }
      return;
    }

    const scriptId = "kakao-sdk-script";
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js";
      script.async = true;
      script.onload = () => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
          window.Kakao.init(KAKAO_JS_KEY);
        }
      };
      document.head.appendChild(script);
    }
  }, []);

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
        <div className="cam-card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4>{label}</h4>
          {!isLocal && peerId && (
              <button
                  type="button"
                  onClick={() => onOpenWhisper(peerId)}
                  style={{
                    background: "#4f46e5",
                    color: "#fff",
                    border: "none",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    cursor: "pointer"
                  }}
              >
                🔒 비밀대화
              </button>
          )}
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

          <button
              type="button"
              className="btn-custom btn-expand-cam"
              onClick={handleCardFullScreen}
              title="확대하기"
          >
            ⛶ 확대하기
          </button>
        </div>
      </div>
  );
}

const KAKAO_REST_KEY = "128822f9bfdfb4b70d794c947ef21231"; // 장소 검색용 카카오 REST API 유지

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

  const [remoteUsers, setRemoteUsers] = useState([]);
  const [remoteNicknames, setRemoteNicknames] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [shareMode, setShareMode] = useState("idle");
  const [isSttActive, setIsSttActive] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // 1:1 비밀 대화 관련 상태
  const [activeWhisperId, setActiveWhisperId] = useState(null);
  const [whisperMessages, setWhisperMessages] = useState({});
  const [whisperInput, setWhisperInput] = useState("");

  // 지도 및 검색 관련 상태
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchPlaces, setSearchPlaces] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: 37.4563, lng: 126.7052 });

  const handleSearchPlaces = async () => {
    if (!searchKeyword.trim()) {
      alert("검색할 지역이나 상호명을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(searchKeyword)}&y=${mapCenter.lat}&x=${mapCenter.lng}&radius=5000`,
        {
          headers: {
            Authorization: `KakaoAK ${KAKAO_REST_KEY}`
          }
        }
      );
      const data = await response.json();

      if (data.documents && data.documents.length > 0) {
        const places = data.documents.map((item, index) => ({
          id: item.id || index,
          name: item.place_name,
          lat: parseFloat(item.y),
          lng: parseFloat(item.x),
          address: item.road_address_name || item.address_name,
          phone: item.phone || "번호 없음"
        }));

        setSearchPlaces(places);
        setMapCenter({ lat: places[0].lat, lng: places[0].lng });
      } else {
        alert("검색 결과가 없습니다. 다른 검색어를 입력해 보세요.");
        setSearchPlaces([]);
      }
    } catch (err) {
      console.error("장소 검색 실패:", err);
      alert("검색 중 오류가 발생했습니다.");
    }
  };

  // 'ㄷㄹ' 단축키로 캘린더 토글 기능
  useEffect(() => {
    let keyBuffer = [];
    let timer = null;

    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
        return;
      }

      const isD = e.code === "KeyE" || e.key === "ㄷ" || e.key === "e" || e.key === "E";
      const isR = e.code === "KeyF" || e.key === "ㄹ" || e.key === "f" || e.key === "F";

      if (!isD && !isR) return;

      if (isD) keyBuffer.push("ㄷ");
      if (isR) keyBuffer.push("ㄹ");

      const lastTwo = keyBuffer.slice(-2).join("");
      if (lastTwo === "ㄷㄹ") {
        setIsCalendarOpen((prev) => !prev);
        keyBuffer = [];
      }

      clearTimeout(timer);
      timer = setTimeout(() => {
        keyBuffer = [];
      }, 700);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, []);

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

  const handleKakaoInvite = () => {
      if (!window.Kakao) {
        alert("카카오 SDK가 아직 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_JS_KEY);
      }

      const urlParams = new URLSearchParams(window.location.search);
      const roomId = urlParams.get("roomId") || "default-room";
      const inviteUrl = `${window.location.origin}/streaming/cam?roomId=${roomId}`;

      window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: "👥 [이지스] 실시간 화상 스터디 초대",
          description: `${nickname}님이 화상 스터디룸으로 초대했습니다. 함께 참여해 주세요!`,
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
      alert("현재 브라우저는 음성 인식을 지원하지 않습니다.");
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
      } catch (e) {}
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
    } catch (e) {}
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

      const others = Array.from(new Set(newUsers)).filter(
          (id) => id && typeof id === "string" && id !== myIdRef.current
      );

      remoteUsersRef.current = others;
      setRemoteUsers(others);

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
          if (localStreamRef.current && data.senderId && data.senderId !== myIdRef.current) {
            sendOfferToPeer(data.senderId);
          }
        } else if (data.type === "offer") {
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
        } else if (data.type === "whisper") {
          const senderId = data.senderId;
          const senderNick = data.nickname || senderId.substring(0, 4);

          setRemoteNicknames((prev) => ({ ...prev, [senderId]: senderNick }));

          setWhisperMessages((prev) => {
            const list = prev[senderId] || [];
            return {
              ...prev,
              [senderId]: [...list, { sender: "other", text: data.text, time: data.time }]
            };
          });

          setActiveWhisperId(senderId);
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
      alert("카메라 또는 화면 공유 권한을 허용해주세요.");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const currentText = inputMessage.trim();

    if (currentText === "ㄷㄹ" || currentText === "달력") {
      setIsCalendarOpen((prev) => !prev);
      setInputMessage("");
      return;
    }

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

  const handleSendWhisper = (e) => {
    e.preventDefault();
    if (!whisperInput.trim() || !activeWhisperId) return;

    const currentText = whisperInput.trim();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const whisperData = {
      type: "whisper",
      senderId: myIdRef.current,
      targetId: activeWhisperId,
      nickname: nickname,
      text: currentText,
      time: timeStr
    };

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(whisperData));
    }

    setWhisperMessages((prev) => {
      const list = prev[activeWhisperId] || [];
      return {
        ...prev,
        [activeWhisperId]: [...list, { sender: "me", text: currentText, time: timeStr }]
      };
    });
    setWhisperInput("");
  };

  const openWhisperChat = (peerId) => {
    setActiveWhisperId(peerId);
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
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" className="btn-kakao-invite" onClick={handleKakaoInvite}>
              <span>💬 카카오톡 초대</span>
            </button>
            <button
                type="button"
                className="btn-kakao-invite"
                style={{ background: "#059669", color: "#fff" }}
                onClick={() => setIsMapOpen((prev) => !prev)}
            >
              <span>🗺️ {isMapOpen ? "지도 닫기" : "지도 보기"}</span>
            </button>
          </div>
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
                    peerId={peerId}
                    label={`참가자 (${remoteNicknames[peerId] || peerId.substring(0, 4)})`}
                    isLocal={false}
                    stream={remoteStreams[peerId] || null}
                    shareMode="idle"
                    onOpenWhisper={openWhisperChat}
                />
            ))}
          </div>

          <div className="cam-right-sidebar" style={{ position: "relative", overflow: "visible", display: "flex", flexDirection: "column", gap: "12px", width: "360px", flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "row", gap: "10px", alignItems: "flex-start" }}>
              <div className="cam-chat-panel" style={{ height: "540px", width: "360px", flexShrink: 0, display: "flex", flexDirection: "column" }}>
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
                  <div ref={chatBottomRef} />
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

              {activeWhisperId && (
                  <div className="ai-sub-chat-panel" style={{ height: "540px", width: "320px", flexShrink: 0, display: "flex", flexDirection: "column", border: "2px solid #4f46e5" }}>
                    <div className="chat-header" style={{ background: "#4f46e5" }}>
                      <span>🔒 귓속말 ({remoteNicknames[activeWhisperId] || activeWhisperId.substring(0, 4)})</span>
                      <button
                          type="button"
                          onClick={() => setActiveWhisperId(null)}
                          style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="chat-messages-container" style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {(whisperMessages[activeWhisperId] || []).map((msg, idx) => (
                          <div key={idx} className={`chat-bubble-row ${msg.sender === "me" ? "me" : "other"}`}>
                            <div className="chat-bubble">
                              {msg.text}
                            </div>
                          </div>
                      ))}
                    </div>

                    <form onSubmit={handleSendWhisper} style={{ padding: "8px 12px", background: "#fff", borderTop: "1px solid #e0e0e0" }}>
                      <div className="chat-input-form" style={{ margin: 0 }}>
                        <input
                            type="text"
                            className="chat-text-input"
                            placeholder="비밀 메시지 입력..."
                            value={whisperInput}
                            onChange={(e) => setWhisperInput(e.target.value)}
                        />
                        <button type="submit" className="chat-send-btn">전송</button>
                      </div>
                    </form>
                  </div>
              )}
            </div>

            {/* Leaflet 미니맵 패널 */}
            {isMapOpen && (
                <div style={{ width: "100%", height: "260px", background: "#fff", border: "2px solid #ef4444", borderRadius: "16px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ background: "#ef4444", color: "#fff", padding: "8px 14px", fontSize: "12px", fontWeight: "700", display: "flex", justifyContent: "space-between" }}>
                    <span>🗺️ 스터디 위치 (오픈맵)</span>
                    <button type="button" onClick={() => setIsMapModalOpen(true)} style={{ background: "#fff", color: "#ef4444", border: "none", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>🔍 크게 보기</button>
                  </div>
                  <div style={{ width: "100%", height: "200px" }}>
                    <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={14} style={{ width: "100%", height: "100%" }} zoomControl={false} attributionControl={false}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <MapRecenter center={[mapCenter.lat, mapCenter.lng]} />
                      {searchPlaces.map((p) => (
                        <Marker key={p.id} position={[p.lat, p.lng]}>
                          <Popup>{p.name}</Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>
                </div>
            )}

            {/* Leaflet 크게 보기 모달 */}
            {isMapModalOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "85vw", height: "85vh", background: "#fff", borderRadius: "16px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,0.3)" }}>
                    <div style={{ background: "#ef4444", color: "#fff", padding: "14px 20px", fontSize: "16px", fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                      <span>🗺️ 볕자리 찾기 - 스터디 카페 & 장소 검색</span>
                      <button type="button" onClick={() => setIsMapModalOpen(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: "18px", fontWeight: "bold", cursor: "pointer" }}>✕ 닫기</button>
                    </div>
                    <div style={{ display: "flex", flex: 1, width: "100%", height: "calc(100% - 56px)", overflow: "hidden", position: "relative" }}>
                      <div style={{ width: "340px", background: "#f9fafb", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", padding: "16px", gap: "12px", overflowY: "auto", zIndex: 2, flexShrink: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "#1f2937" }}>📍 지역 및 장소 검색</div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <input
                              type="text"
                              placeholder="예: 구월동 스터디카페"
                              value={searchKeyword}
                              onChange={(e) => setSearchKeyword(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") handleSearchPlaces(); }}
                              style={{ flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }}
                          />
                          <button
                              type="button"
                              onClick={handleSearchPlaces}
                              style={{ background: "#ef4444", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                          >
                            검색
                          </button>
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                          {searchPlaces.length > 0 ? `검색된 추천 공간 (${searchPlaces.length}개)` : "원하는 지역이나 상호명을 검색해보세요."}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {searchPlaces.map((place) => (
                            <div
                              key={place.id}
                              onClick={() => setMapCenter({ lat: place.lat, lng: place.lng })}
                              style={{ background: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid #e5e7eb", cursor: "pointer" }}
                            >
                              <div style={{ fontWeight: "700", fontSize: "13px", color: "#111827" }}>{place.name}</div>
                              <div style={{ fontSize: "11px", color: "#4b5563", marginTop: "2px" }}>{place.address}</div>
                              <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>📞 {place.phone}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ flex: 1, position: "relative", height: "100%" }}>
                        <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={14} style={{ width: "100%", height: "100%" }}>
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <MapRecenter center={[mapCenter.lat, mapCenter.lng]} />
                          {searchPlaces.map((p) => (
                            <Marker key={p.id} position={[p.lat, p.lng]}>
                              <Popup>{p.name}</Popup>
                            </Marker>
                          ))}
                        </MapContainer>
                      </div>
                    </div>
                  </div>
                </div>
            )}

            <MiniCalendar
                calendarDate={calendarDate}
                groupSchedules={groupSchedules}
                isCalendarOpen={isCalendarOpen}
                moveMiniMonth={moveMiniMonth}
                setIsCalendarOpen={setIsCalendarOpen}
            />
          </div>
        </section>
      </main>
  );
}