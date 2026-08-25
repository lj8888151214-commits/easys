import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const rtcConfig = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
    ],
};

function VideoCard({ label, isLocal, stream, onStartCam, onStartScreen, onStop, shareMode, isSttActive, toggleStt }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream || null;
        }
    }, [stream]);

    return (
        <div className="cam-card">
            <div className="cam-card-title">
                <span className={`cam-badge ${isLocal ? (stream ? "badge-local" : "badge-empty") : (stream ? "badge-remote" : "badge-empty")}`}>
                    ● {isLocal ? (stream ? "내 화면 송출중" : "내 슬롯") : (stream ? "화면 수신중" : "대기중")}
                </span>
                <h4>{label}</h4>
            </div>

            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal}
                onLoadedMetadata={(e) => {
                    e.target.play().catch((err) => console.log("재생 대기:", err));
                }}
                className={`cam-stream-img ${!stream ? "cam-empty-view" : ""}`}
            />

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

    const [remoteUsers, setRemoteUsers] = useState([]);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState({});
    const [shareMode, setShareMode] = useState("idle");
    const [isSttActive, setIsSttActive] = useState(false);

    const [messages, setMessages] = useState([
        { id: 1, text: "스터디룸에 입장했습니다.", isSystem: true }
    ]);
    const [inputMessage, setInputMessage] = useState("");

    const [nickname] = useState(() => {
        const saved = localStorage.getItem("userNickname") || localStorage.getItem("userEmail");
        if (saved) return saved.includes("@") ? saved.split("@")[0] : saved;
        return "게스트";
    });

    const isMember = nickname !== "게스트";
    const chatBottomRef = useRef(null);

    // ==========================================
    // 🎙️ 음성 인식 (STT) 설정
    // ==========================================
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
            recognition.lang = "ko-KR"; // 한국어 인식
            recognition.continuous = true; // 끊기지 않고 계속 듣기
            recognition.interimResults = false; // 문장이 완성되었을 때 전송

            recognition.onresult = (event) => {
                const lastResult = event.results[event.results.length - 1];
                if (lastResult.isFinal) {
                    const transcript = lastResult[0].transcript.trim();
                    console.log("🎤 음성 감지:", transcript);
                    sendSpeechChat(transcript);
                }
            };

            recognition.onerror = (e) => {
                console.error("음성 인식 오류:", e.error);
            };

            recognition.onend = () => {
                // STT가 켜져있는 상태면 음성 인식을 계속 유지
                if (isSttActive) {
                    try { recognition.start(); } catch (err) {}
                }
            };

            recognition.start();
            recognitionRef.current = recognition;
            setIsSttActive(true);
        }
    };

    // RTCPeerConnection 생성
    const createPeerConnection = (targetPeerId) => {
        if (pcsRef.current[targetPeerId]) {
            pcsRef.current[targetPeerId].close();
        }

        const pc = new RTCPeerConnection(rtcConfig);
        pcsRef.current[targetPeerId] = pc;
        candidateQueueRef.current[targetPeerId] = [];

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
            } catch (e) {
                console.error("Candidate 처리 에러:", e);
            }
        }
    };

    const sendOfferToPeer = async (targetPeerId) => {
        if (!localStreamRef.current) return;
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

    useEffect(() => {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = `${window.location.hostname}:8080`;
        const ws = new WebSocket(`${protocol}//${host}/signal`);
        socketRef.current = ws;

        let allUsersCache = [];

        const updateRemoteList = (newUsers) => {
            if (!myIdRef.current) return;
            const others = newUsers.filter((id) => id !== myIdRef.current);
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

        ws.onopen = () => console.log(">>> [WebSocket] 시그널링 서버 연결 완료!");

        ws.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === "init") {
                    myIdRef.current = data.myId;
                    updateRemoteList(allUsersCache);
                }
                else if (data.type === "userList") {
                    allUsersCache = data.users || [];
                    updateRemoteList(allUsersCache);
                }
                else if (data.type === "request-stream") {
                    if (localStreamRef.current && data.senderId !== myIdRef.current) {
                        sendOfferToPeer(data.senderId);
                    }
                }
                else if (data.type === "offer") {
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
                }
                else if (data.type === "answer") {
                    if (data.target && data.target !== myIdRef.current) return;
                    const pc = pcsRef.current[data.senderId];
                    if (pc) {
                        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                        await processQueuedCandidates(data.senderId, pc);
                    }
                }
                else if (data.type === "candidate") {
                    if (data.target && data.target !== myIdRef.current) return;
                    const pc = pcsRef.current[data.senderId];

                    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                        } catch (e) {
                            console.error("Candidate 등록 실패:", e);
                        }
                    } else {
                        if (!candidateQueueRef.current[data.senderId]) {
                            candidateQueueRef.current[data.senderId] = [];
                        }
                        candidateQueueRef.current[data.senderId].push(data.candidate);
                    }
                }
                else if (data.type === "stream-stopped") {
                    if (pcsRef.current[data.senderId]) {
                        pcsRef.current[data.senderId].close();
                        delete pcsRef.current[data.senderId];
                    }
                    setRemoteStreams((prev) => {
                        const updated = { ...prev };
                        delete updated[data.senderId];
                        return updated;
                    });
                }
                else if (data.type === "chat") {
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
            } catch (e) {
                console.error("WS 처리 에러:", e);
            }
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

            for (const peerId of remoteUsersRef.current) {
                sendOfferToPeer(peerId);
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

                    setMessages((prev) => [...prev, { id: Date.now() + 1, ...sysMsg, isMe: true }]);
                    if (socketRef.current?.readyState === WebSocket.OPEN) {
                        socketRef.current.send(JSON.stringify(sysMsg));
                    }
                } else {
                    const err = await res.text();
                    console.error("모임 캘린더 등록 실패:", err);
                }
            } catch (err) {
                console.error("모임 캘린더 통신 에러:", err);
            }
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("이미지 용량은 5MB 이하만 전송할 수 있습니다.");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const base64Data = reader.result;
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

            const msgData = {
                type: "chat",
                senderId: myIdRef.current,
                nickname: nickname,
                text: "",
                image: base64Data,
                time: timeStr
            };

            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify(msgData));
            }

            setMessages((prev) => [...prev, { id: Date.now(), ...msgData, isMe: true }]);
        };

        reader.readAsDataURL(file);
        e.target.value = "";
    };

    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const totalUsers = 1 + remoteUsers.length;

    return (
        <>
            <style>{`
        .cam-study-container { max-width: 1600px; margin: 0 auto; padding: 90px 20px 40px; box-sizing: border-box; }
        .cam-header { text-align: center; margin-bottom: 20px; }
        .cam-header h2 { font-weight: 800; color: #243329; font-size: 26px; }
        .cam-main-layout { display: flex; gap: 20px; align-items: stretch; }

        .cam-grid {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 16px;
          background: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 16px;
          padding: 20px;
          min-height: 480px;
          align-content: start;
        }

        .cam-card {
          display: flex;
          flex-direction: column;
          background: #fafafa;
          border: 1px solid #ececec;
          border-radius: 12px;
          padding: 12px;
        }
        .cam-card-title { width: 100%; margin-bottom: 8px; }
        .cam-card-title h4 { margin: 4px 0 0; font-size: 14px; font-weight: 700; color: #222; }
        .cam-badge { display: inline-block; color: white; padding: 2px 8px; font-size: 10px; font-weight: bold; border-radius: 20px; }
        .badge-local { background-color: #ff4757; }
        .badge-remote { background-color: #3742fa; }
        .badge-empty { background-color: #a4b0be; }

        .cam-stream-img {
          width: 100%;
          height: 240px;
          border-radius: 8px;
          object-fit: cover;
          border: 2px solid #333;
          background-color: #000;
        }
        .cam-empty-view { background-color: #1a1a1a; }

        .cam-btn-group { display: flex; gap: 6px; margin-top: 10px; width: 100%; }
        .btn-custom { flex: 1; padding: 7px 0; font-size: 12px; font-weight: 700; border-radius: 6px; cursor: pointer; border: none; color: #fff; }
        .btn-primary-cam { background-color: #0d6efd; }
        .btn-desktop-cam { background-color: #6c5ce7; }
        .btn-stt-on { background-color: #00b894; animation: pulse-green 1.5s infinite; }
        .btn-stt-off { background-color: #636e72; }
        .btn-disconnect-cam { background-color: #dc3545; }
        .btn-custom:disabled { opacity: 0.4; cursor: not-allowed; }

        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(0, 184, 148, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(0, 184, 148, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 184, 148, 0); }
        }

        .cam-chat-panel {
          width: 360px;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 16px;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }
        .chat-header {
          padding: 16px 20px;
          background: #243329;
          color: white;
          font-size: 15px;
          font-weight: 700;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .chat-user-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .chat-user-badge.member {
          background-color: rgba(46, 213, 115, 0.2);
          color: #2ed573;
          border: 1px solid #2ed573;
        }
        .chat-user-badge.guest {
          background-color: rgba(255, 255, 255, 0.15);
          color: #e0e0e0;
          border: 1px solid #777;
        }
        .chat-messages-container { flex: 1; height: 480px; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; background: #f8faf8; }
        .chat-bubble-row { display: flex; flex-direction: column; }
        .chat-bubble-row.me { align-items: flex-end; }
        .chat-bubble-row.other { align-items: flex-start; }
        .chat-bubble { max-width: 80%; padding: 8px 12px; border-radius: 12px; font-size: 13px; word-break: break-word; }
        .chat-bubble-row.me .chat-bubble { background-color: #243329; color: #ffffff; }
        .chat-bubble-row.other .chat-bubble { background-color: #ffffff; color: #222; border: 1px solid #e2e8e2; }
        .chat-system-msg { font-size: 11px; color: #243329; background: #e2f0e4; border: 1px solid #b8dabf; padding: 5px 12px; border-radius: 14px; align-self: center; font-weight: 600; }

        .chat-input-form { display: flex; gap: 8px; background: #fff; border: 1px solid #dce2dd; border-radius: 30px; padding: 6px 8px 6px 14px; margin-top: 16px; align-items: center; }
        .chat-clip-btn { background: none; border: none; font-size: 18px; cursor: pointer; padding: 0 4px; line-height: 1; }
        .chat-text-input { flex: 1; border: none; outline: none; font-size: 14px; }
        .chat-send-btn { padding: 10px 24px; border-radius: 24px; border: none; background: #243329; color: white; font-weight: 700; cursor: pointer; }
      `}</style>

            <div className="cam-study-container">
                <div className="cam-header">
                    <h2>👥 실시간 스터디룸 (접속자: {totalUsers}명)</h2>
                </div>

                <div className="cam-main-layout">
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

                        {remoteUsers.map((peerId, idx) => (
                            <VideoCard
                                key={peerId}
                                label={`참가자 ${idx + 1} (${peerId.substring(0, 4)})`}
                                isLocal={false}
                                stream={remoteStreams[peerId] || null}
                                shareMode="idle"
                            />
                        ))}
                    </div>

                    <div className="cam-chat-panel">
                        <div className="chat-header">
                            <span>💬 실시간 채팅</span>
                            <span className={`chat-user-badge ${isMember ? "member" : "guest"}`}>
                                {isMember ? `👤 ${nickname}` : "👤 게스트"}
                            </span>
                        </div>
                        <div className="chat-messages-container">
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
                                            </div>
                                            <span style={{ fontSize: "10px", color: "#999" }}>{msg.time}</span>
                                        </>
                                    )}
                                </div>
                            ))}
                            <div ref={chatBottomRef} />
                        </div>
                    </div>
                </div>

                <form className="chat-input-form" onSubmit={handleSendMessage}>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleImageUpload}
                    />

                    <button
                        type="button"
                        className="chat-clip-btn"
                        title="이미지 첨부"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        📎
                    </button>

                    <input
                        type="text"
                        className="chat-text-input"
                        placeholder="메시지 또는 'ㅋ 25' 입력..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                    />
                    <button type="submit" className="chat-send-btn">전송</button>
                </form>
            </div>
        </>
    );
}