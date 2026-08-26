import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CamPage.css";

const KAKAO_JS_KEY = "f7d216c9253bd3d4d3cf2eaf836373f8";

const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" }
  ],
};

function VideoCard({ label, nickname, isLocal, stream, onStartCam, onStartScreen, onStop, shareMode, isSttActive, toggleStt }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream || null;
      if (stream) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [stream]);

  // 3초마다 송출 화면이 멈췄거나 안 잡히는지 감지하고 강제 재생(Reload) 시도
  useEffect(() => {
    if (isLocal || !stream) return;

    const interval = setInterval(() => {
      if (videoRef.current) {
        const video = videoRef.current;
        if (video.paused && video.srcObject) {
          video.play().catch((e) => {});
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [stream, isLocal]);

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

  const isMember = nickname !== "게스트";

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

  const shareKakao = () => {
    if (!window.Kakao || !window.Kakao.isInitialized()) {
      alert("카카오 SDK를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    const currentUrl = window.location.href;
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: `👥 ${nickname}님의 실시간 화상 스터디 초대`,
        description: "지금 바로 스터디룸에 입장하여 화면 공유 및 실시간 대화에 참여해보세요!",
        imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop",
        link: {
          mobileWebUrl: currentUrl,
          webUrl: currentUrl,
        },
      },
      buttons: [
        {
          title: "스터디룸 입장하기",
          link: {
            mobileWebUrl: currentUrl,
            webUrl: currentUrl,
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
      return `${currentYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
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
        const res = await fetch("/api/study-groups", {
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
            description: `화상 채팅 단축 명령어로 등록된 모임 (개설자: ${nickname})`,
            memberCount: 1,
            maxMembers: 6,
            currentMembers: 1,
            status: "RECRUITING"
          })
        });

        if (res.ok) {
          const sysMsg = {
            type: "chat",
            text: `👥 [모임 캘린더] ${targetDate} 스터디 일정이 성공적으로 등록되었습니다!`,
            isSystem: true,
            time: timeStr
          };

          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(sysMsg));
          }
        }
      } catch (err) {}
    }
  };

  const processFileUpload = (file) => {
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("파일 용량은 15MB 이하만 전송할 수 있습니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result;
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const isImg = file.type.startsWith("image/");

      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;

      const msgData = {
        type: "chat",
        senderId: myIdRef.current,
        nickname: nickname,
        text: "",
        image: isImg ? base64Data : null,
        file: isImg ? null : {
          name: file.name,
          size: sizeStr,
          data: base64Data
        },
        time: timeStr
      };

      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(msgData));
      }
    };

    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFileUpload(file);
    }
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFileUpload(file);
    }
  };

  const handleDownload = (fileObj) => {
    const link = document.createElement("a");
    link.href = fileObj.data;
    link.download = fileObj.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const totalUsers = 1 + remoteUsers.length;

  return (
    <main className="cam-study-container">
      <div className="cam-header">
        <h2>👥 실시간 스터디룸 (접속자: {totalUsers}명)</h2>
        <button type="button" className="btn-kakao-invite" onClick={shareKakao}>
          💬 카카오톡 초대
        </button>
      </div>

      <div className="cam-main-layout">
        <div className="cam-grid">
          <VideoCard
            label={`나 (${nickname})`}
            nickname={nickname}
            isLocal={true}
            stream={localStream}
            onStartCam={() => handleStartMedia("camera")}
            onStartScreen={() => handleStartMedia("screen")}
            onStop={stopStream}
            shareMode={shareMode}
            isSttActive={isSttActive}
            toggleStt={toggleStt}
          />

          {remoteUsers.map((peerId) => {
            const userNick = remoteNicknames[peerId] || "참가자";
            return (
              <VideoCard
                key={peerId}
                label={`참가자 (${userNick})`}
                nickname={userNick}
                isLocal={false}
                stream={remoteStreams[peerId] || null}
                shareMode="idle"
              />
            );
          })}
        </div>

        <div
          className="cam-chat-panel"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="chat-header">
            <div className="chat-header-left">
              <span>💬 실시간 채팅</span>
              <span className="chat-user-count-badge">● {totalUsers}명 참여중</span>
            </div>
            <span className={`chat-user-badge ${isMember ? "member" : "guest"}`}>
              {isMember ? `👤 ${nickname}` : "👤 게스트"}
            </span>
          </div>

          {isDragging && (
            <div className="chat-drag-overlay">
              <span>📥</span>
              <span>여기에 파일을 놓아 전송하세요</span>
            </div>
          )}

          <div className="chat-messages-container" ref={chatContainerRef}>
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-bubble-row ${msg.isSystem ? "system" : msg.isMe ? "me" : "other"}`}>
                {msg.isSystem ? (
                  <span className="chat-system-msg">{msg.text}</span>
                ) : (
                  <>
                    <span style={{ fontSize: "11px", color: "#777", marginBottom: "3px" }}>
                      {msg.nickname || "게스트"}
                    </span>
                    <div className="chat-bubble">
                      {msg.text && <div>{msg.text}</div>}

                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="전송 이미지"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "200px",
                            borderRadius: "8px",
                            marginTop: msg.text ? "6px" : "0",
                            cursor: "pointer",
                            display: "block"
                          }}
                          onClick={() => window.open(msg.image, "_blank")}
                        />
                      )}

                      {msg.file && (
                        <div
                          className="chat-file-card"
                          onClick={() => handleDownload(msg.file)}
                          title="클릭하여 파일 다운로드"
                        >
                          <span className="chat-file-icon">📄</span>
                          <div className="chat-file-info">
                            <span className="chat-file-name">{msg.file.name}</span>
                            <span className="chat-file-size">{msg.file.size}</span>
                          </div>
                          <span className="chat-file-download-btn">⬇️</span>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: "10px", color: "#999" }}>{msg.time}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileInputChange}
        />

        <button
          type="button"
          className="chat-clip-btn"
          title="파일 / 이미지 첨부"
          onClick={() => fileInputRef.current?.click()}
        >
          📎
        </button>

        <input
          type="text"
          className="chat-text-input"
          placeholder="메시지 입력 또는 파일을 드래그하세요..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
        />
        <button type="submit" className="chat-send-btn">전송</button>
      </form>
    </main>
  );
}