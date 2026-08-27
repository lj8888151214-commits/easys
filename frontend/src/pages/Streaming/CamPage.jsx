import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "./CamPage.css";
import 'leaflet/dist/leaflet.css';

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

function MapRefresher() {
  const map = useMap();
  useEffect(() => {
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }
  }, [map]);
  return null;
}

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const KAKAO_JS_KEY = "f7d216c9253bd3d4d3cf2eaf836373f8";

const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" }
  ],
};

// 🌟 참가자별 개별 지도가 포함된 VideoCard 컴포넌트
function VideoCard({ label, nickname, isLocal, stream, position, onStartCam, onStartScreen, onStop, shareMode, isSttActive, toggleStt }) {
  const videoRef = useRef(null);
  const currentPos = position && position.length === 2 ? position : [37.4563, 126.7052];

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream || null;
      if (stream) {
        videoRef.current.play().catch((err) => {
          console.log("비디오 재생 재시도:", err);
        });
      }
    }
  }, [stream]);

  useEffect(() => {
    if (!stream) return;

    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stream]);

  return (
    <div className="cam-card">
      <div className="cam-card-title">
        <span className={`cam-badge ${isLocal ? (stream ? "badge-local" : "badge-empty") : (stream ? "badge-remote" : "badge-empty")}`}>
          ● {isLocal ? (stream ? "내 화면 송출중" : "내 슬롯") : (stream ? "화면 수신중" : "대기중")}
        </span>
        <h4>{label}</h4>
      </div>

      <div className="cam-video-wrapper">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          onLoadedMetadata={(e) => {
            e.target.play().catch(() => {});
          }}
          className={`cam-stream-img ${!stream ? "cam-empty-view" : ""}`}
        />

        <div className="cam-video-nickname-overlay">
          👤 {nickname || "참가자"}
        </div>
      </div>

      {/* 🌟 각 사용자 카드 하단에 들어갈 개별 미니 지도 영역 */}
      <div className="card-mini-map-wrapper" style={{ marginTop: "10px" }}>
        <div style={{ fontSize: "11px", fontWeight: "700", color: "#444", marginBottom: "4px" }}>
          📍 위치: {nickname}
        </div>
        <div className="card-mini-map-container" style={{ height: "110px", position: "relative", borderRadius: "8px", overflow: "hidden", background: "#eef2ef" }}>
          <MapContainer
            key={`map-${nickname}-${currentPos[0]}-${currentPos[1]}`}
            center={currentPos}
            zoom={13}
            style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
            zoomControl={false}
            dragging={false}
            scrollWheelZoom={false}
          >
            <MapRefresher />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={currentPos}>
              <Popup>{nickname}님의 위치</Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>

      {isLocal && (
        <div className="cam-btn-group">
          <button
            type="button"
            className={`btn-custom btn-primary-cam ${shareMode === "camera" ? "active" : ""}`}
            onClick={onStartCam}
          >
            📷 웹캠
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
            title="말하는 내용이 채팅창에 자동 타이핑됩니다"
          >
            {isSttActive ? "🎙️ 자막 ON" : "🎙️ 자막 OFF"}
          </button>
          <button
            type="button"
            className="btn-custom btn-disconnect-cam"
            onClick={onStop}
            disabled={shareMode === "idle"}
          >
            🔌 끄기
          </button>
        </div>
      )}
    </div>
  );
}

export default function CamPage() {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const myIdRef = useRef("");
  const remoteUsersRef = useRef([]);
  const localStreamRef = useRef(null);
  const pcsRef = useRef({});
  const candidateQueueRef = useRef({});
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatContainerRef = useRef(null);

  const [remoteUsers, setRemoteUsers] = useState([]);
  const [remoteNicknames, setRemoteNicknames] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [shareMode, setShareMode] = useState("idle");
  const [isSttActive, setIsSttActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // 내 위치 상태 (기본값: 인천 좌표)
  const [myPosition, setMyPosition] = useState([37.4563, 126.7052]);
  // 상대방들의 위치를 담을 상태 (peerId별 { lat, lng, nickname })
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
      script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js";
      script.async = true;
      script.onload = initKakao;
      document.head.appendChild(script);
    } else {
      initKakao();
    }
  }, []);

  // 🌟 카카오톡 초대 메시지 공유 함수 추가
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

    const sendJoin = () => {
      if (ws.readyState === WebSocket.OPEN && nickname) {
        ws.send(JSON.stringify({
          type: "join",
          nickname: nickname
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
          sendJoin();
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
          const rawUsers = data.users || [];
          const seenNicknames = new Set();
          const distinctPeerIds = [];
          const nickMap = {};

          if (nickname && nickname !== "게스트") {
            seenNicknames.add(nickname);
          }

          for (let i = rawUsers.length - 1; i >= 0; i--) {
            const item = rawUsers[i];
            let id = "";
            let nick = "";

            if (typeof item === "string") {
              id = item;
              nick = item.length > 4 ? item.substring(0, 4) : item;
            } else if (item && typeof item === "object") {
              id = item.id || "";
              nick = item.nickname || "";
            }

            if (!id || id === myIdRef.current || nick === nickname) {
              continue;
            }

            if (nick && nick !== "게스트") {
              if (seenNicknames.has(nick)) {
                continue;
              }
              seenNicknames.add(nick);
            }

            distinctPeerIds.unshift(id);
            nickMap[id] = nick;
          }

          Object.keys(pcsRef.current).forEach((oldId) => {
            if (!distinctPeerIds.includes(oldId)) {
              try { pcsRef.current[oldId].close(); } catch (e) {}
              delete pcsRef.current[oldId];
              setRemoteStreams((prev) => {
                const updated = { ...prev };
                delete updated[oldId];
                return updated;
              });
            }
          });

          remoteUsersRef.current = distinctPeerIds;
          setRemoteUsers(distinctPeerIds);
          setRemoteNicknames((prev) => ({ ...prev, ...nickMap }));

          distinctPeerIds.forEach((targetId) => {
            if (localStreamRef.current) {
              sendOfferToPeer(targetId);
            }
            if (socketRef.current?.readyState === WebSocket.OPEN) {
              socketRef.current.send(JSON.stringify({
                type: "request-stream",
                senderId: myIdRef.current,
                target: targetId
              }));
            }
          });
        } else if (data.type === "request-stream") {
          if (localStreamRef.current && data.senderId !== myIdRef.current) {
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
  }, [nickname]);

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

      for (const peerId of remoteUsersRef.current) {
        const pc = createPeerConnection(peerId);
        const senders = pc.getSenders();

        newStream.getTracks().forEach((track) => {
          const sender = senders.find((s) => s.track && s.track.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track);
          } else {
            pc.addTrack(track, newStream);
          }
        });

        await sendOfferToPeer(peerId);
      }
    } catch (err) {
      alert("카메라 또는 화면 공유 권한을 허용해주세요.");
    }
  };

  const parseCalendarCommand = (text) => {
    const hasTrigger = /(?:^|\s)(?:ㅋ|캘린더|일정|스케줄)(?:\s|$)/.test(text) || text.startsWith("ㅋ");
    if (!hasTrigger) return null;

    const now = new Date();
    const currentYear = now.getFullYear();
    let targetMonth = now.getMonth() + 1;
    let targetDay = null;

    const monthDayMatch = text.match(/(\d{1,2})월\s*(\d{1,2})일?/);
    const slashMatch = text.match(/(\d{1,2})\/(\d{1,2})/);
    const dayOnlyMatch = text.match(/(?:ㅋ|캘린더|일정)?\s*(\d{1,2})(?:일|\b)/);

    if (monthDayMatch) {
      targetMonth = parseInt(monthDayMatch[1], 10);
      targetDay = parseInt(monthDayMatch[2], 10);
    } else if (slashMatch) {
      targetMonth = parseInt(slashMatch[1], 10);
      targetDay = parseInt(slashMatch[2], 10);
    } else if (dayOnlyMatch) {
      targetDay = parseInt(dayOnlyMatch[1], 10);
    }

    if (targetDay && targetDay >= 1 && targetDay <= 31) {
      const formattedMonth = String(targetMonth).padStart(2, '0');
      const formattedDay = String(targetDay).padStart(2, '0');
      return `${currentYear}-${formattedMonth}-${formattedDay}`;
    }
    return null;
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
      file: null,
      time: timeStr
    };

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msgData));
    }

    setInputMessage("");

    const targetDate = parseCalendarCommand(currentText);
    if (targetDate) {
      try {
        await fetch("/api/study-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: `정기 화상 스터디 (${nickname})`,
            targetDate: targetDate,
            studyDate: targetDate,
            meetingDate: targetDate,
            meetingTime: "19:00",
            time: "19:00",
            category: "SPRING BOOT",
            description: `화상 채팅 단축 명령어(${currentText})로 등록된 모임 (개설자: ${nickname})`,
            startAt: `${targetDate}T19:00:00`,
            endAt: `${targetDate}T21:00:00`,
            memberCount: 1,
            maxMembers: 6,
            currentMembers: 1,
            status: "RECRUITING"
          })
        });

        const sysMsg = {
          type: "chat",
          senderId: "system",
          nickname: "시스템",
          text: `👥 [모임 캘린더 자동등록] ${targetDate} 스터디 일정이 그룹 캘린더에 요청되었습니다!`,
          image: null,
          file: null,
          time: timeStr,
          isSystem: true
        };

        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify(sysMsg));
        }
      } catch (err) {
        console.error("모임 캘린더 단축 등록 오류:", err);
      }
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const totalUsers = 1 + remoteUsers.length;

  return (
    <main className="cam-study-container">
      {/* 상단 헤더 */}
      <section className="cam-header">
        <h2>👥 실시간 스터디룸 (접속자: {totalUsers}명)</h2>
        {/* 🌟 카카오톡 초대 버튼에 handleKakaoInvite 함수 연결 완료 */}
        <button type="button" className="btn-kakao-invite" onClick={handleKakaoInvite}>
          <span>💬 카카오톡 초대</span>
        </button>
      </section>

      {/* 메인 레이아웃 */}
      <section className="cam-main-layout">

        {/* 좌측 영상 송출 영역 (참가자별 카드마다 개별 미니 지도 포함) */}
        <div className="cam-grid">
          {/* 내 카드 */}
          <VideoCard
            label={`나 (${nickname})`}
            nickname={nickname}
            isLocal={true}
            stream={localStream}
            position={myPosition}
            onStartCam={() => handleStartMedia("camera")}
            onStartScreen={() => handleStartMedia("screen")}
            onStop={stopStream}
            shareMode={shareMode}
            isSttActive={isSttActive}
            toggleStt={toggleStt}
          />

          {/* 상대방들 카드 */}
          {remoteUsers.map((peerId) => {
            const peerInfo = peerLocations[peerId];
            const peerPos = peerInfo ? [peerInfo.lat, peerInfo.lng] : [37.4563, 126.7052];
            const peerNick = remoteNicknames[peerId] || peerInfo?.nickname || "Viewer";

            return (
              <VideoCard
                key={peerId}
                label={`참가자 (${peerNick})`}
                nickname={peerNick}
                isLocal={false}
                stream={remoteStreams[peerId]}
                position={peerPos}
              />
            );
          })}
        </div>

        {/* 우측 사이드바 (실시간 채팅 패널만 단독 배치) */}
        <div className="cam-right-sidebar">
          <div className="cam-chat-panel" style={{ height: "540px" }}>
            <div className="chat-header">
              <div className="chat-header-left">
                <span>실시간 채팅</span>
                <span className="chat-user-count-badge">{totalUsers}명 참여중</span>
              </div>
            </div>

            <div className="chat-messages-container" ref={chatContainerRef}>
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
                placeholder="메시지를 입력하세요..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
              />
              <button type="submit" className="chat-send-btn">전송</button>
            </form>
          </div>
        </div>

      </section>
    </main>
  );
}