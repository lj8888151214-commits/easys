import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./CamPage.css";

import { MiniCalendar } from "./MiniCalendar";

const KAKAO_JS_KEY = "f7d216c9253bd3d4d3cf2eaf836373f8";

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
                            onOpenWhisper,
                            isAudioActive,
                            onToggleAudio,
                            isLayoutSwapped,
                            onToggleLayout,
                            isPipVisible,
                            onTogglePip
                          }) {
  const cardRef = useRef(null);
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

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
      <div
        className="cam-card"
        ref={cardRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ position: "relative", overflow: "hidden" }}
      >
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

        <div className="cam-stream-box" style={{ background: "#111", minHeight: "240px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          {stream ? (
              <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted={isLocal}
                  className="cam-stream-img"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
          ) : (
              <div className="cam-placeholder" style={{ color: "#888", fontSize: "13px" }}>
                <span>미디어가 꺼져 있습니다</span>
              </div>
          )}
        </div>

        <div
          className="cam-btn-group"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "linear-gradient(transparent, rgba(0, 0, 0, 0.8))",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: isHovered ? 1 : 0,
            visibility: isHovered ? "visible" : "hidden",
            transition: "opacity 0.2s ease, visibility 0.2s ease",
            zIndex: 10
          }}
        >
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {isLocal && (
                <>
                  <button
                      type="button"
                      title={shareMode === "camera" ? "캠 끄기" : "캠 켜기"}
                      onClick={onStartCam}
                      style={{ background: shareMode === "camera" ? "#4f46e5" : "rgba(255,255,255,0.2)", color: "#fff", border: "none", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}
                  >
                    📷
                  </button>

                  <button
                      type="button"
                      title="화면 공유"
                      onClick={onStartScreen}
                      style={{ background: shareMode === "screen" ? "#4f46e5" : "rgba(255,255,255,0.2)", color: "#fff", border: "none", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}
                  >
                    🖥️
                  </button>

                  {shareMode === "screen" && (
                      <>
                        <button
                            type="button"
                            title={isLayoutSwapped ? "화면 크게 보기" : "캠 크게 보기"}
                            onClick={onToggleLayout}
                            style={{ background: isLayoutSwapped ? "#ef4444" : "rgba(255,255,255,0.2)", color: "#fff", border: "none", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}
                        >
                          🔄
                        </button>
                        <button
                            type="button"
                            title={isPipVisible ? "작은 화면 숨기기" : "작은 화면 보이기"}
                            onClick={onTogglePip}
                            style={{ background: isPipVisible ? "#059669" : "rgba(255,255,255,0.2)", color: "#fff", border: "none", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}
                        >
                          👁️
                        </button>
                      </>
                  )}

                  <button
                      type="button"
                      title={isAudioActive ? "마이크 켜짐" : "마이크 꺼짐"}
                      onClick={onToggleAudio}
                      style={{ background: isAudioActive ? "#4f46e5" : "rgba(255,255,255,0.2)", color: "#fff", border: "none", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}
                  >
                    {isAudioActive ? "🎙️" : "🔇"}
                  </button>

                  <button
                      type="button"
                      title={isSttActive ? "목소리 채팅 켜짐" : "목소리 채팅 꺼짐"}
                      onClick={toggleStt}
                      style={{ background: isSttActive ? "#4f46e5" : "rgba(255,255,255,0.2)", color: "#fff", border: "none", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}
                  >
                    💬
                  </button>

                  {shareMode !== "idle" && (
                      <button
                          type="button"
                          title="중지하기"
                          onClick={onStop}
                          style={{ background: "#ef4444", color: "#fff", border: "none", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}
                      >
                        ⏹️
                      </button>
                  )}
                </>
            )}
          </div>

          <div>
            <button
                type="button"
                title="전체 화면"
                onClick={handleCardFullScreen}
                style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}
            >
              ⛶
            </button>
          </div>
        </div>
      </div>
  );
}

const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ],
};

export default function CamPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const socketRef = useRef(null);
  const myIdRef = useRef("");
  const remoteUsersRef = useRef([]);
  const localStreamRef = useRef(null);
  const pcsRef = useRef({});
  const candidateQueueRef = useRef({});
  const recognitionRef = useRef(null);
  const chatContainerRef = useRef(null);
  const chatBottomRef = useRef(null);

  const canvasStreamRef = useRef(null);
  const animFrameRef = useRef(null);
  const pipCamStreamRef = useRef(null);
  const pipScreenStreamRef = useRef(null);

  const [isLayoutSwapped, setIsLayoutSwapped] = useState(false);
  const isLayoutSwappedRef = useRef(false);

  const [isPipVisible, setIsPipVisible] = useState(true);
  const isPipVisibleRef = useRef(true);

  const handleToggleLayout = () => {
    setIsLayoutSwapped((prev) => {
      const next = !prev;
      isLayoutSwappedRef.current = next;
      return next;
    });
  };

  const handleTogglePip = () => {
    setIsPipVisible((prev) => {
      const next = !prev;
      isPipVisibleRef.current = next;
      return next;
    });
  };

  const isIntentionalLeaveRef = useRef(false);

  const [remoteUsers, setRemoteUsers] = useState([]);
  const [remoteNicknames, setRemoteNicknames] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [shareMode, setShareMode] = useState("idle");
  const [isSttActive, setIsSttActive] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const [isHost, setIsHost] = useState(() => {
    if (location.state?.isHost !== undefined) {
      return location.state.isHost;
    }
    return false;
  });

  const [roomInfo, setRoomInfo] = useState({
    title: "실시간 스터디룸",
    description: "함께 공부하고 소통하는 공간입니다.",
    host: ""
  });

  const executeLeaveRoom = async () => {
    if (!isIntentionalLeaveRef.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("roomId");

    if (isHost && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "stream-ended"
      }));
    }

    if (roomId && isHost) {
      try {
        const backendHost = window.location.hostname;
        await fetch(`http://${backendHost}:8080/api/streams/${roomId}`, {
          method: "DELETE",
          credentials: "include",
          keepalive: true,
        });
      } catch (err) {
        console.error("방 삭제 요청 실패:", err);
      }
    }
  };

  const handleLeaveRoom = async () => {
    isIntentionalLeaveRef.current = true;
    await executeLeaveRoom();
    navigate("/streaming");
  };

  useEffect(() => {
    const handlePopState = async () => {
      isIntentionalLeaveRef.current = true;
      if (isHost) {
        await executeLeaveRoom();
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (isHost && isIntentionalLeaveRef.current) {
        executeLeaveRoom();
      }
    };
  }, [isHost]);

  useEffect(() => {
    if (location.state && location.state.roomInfo) {
      const { title, description, host } = location.state.roomInfo;
      setRoomInfo({
        title: title || "실시간 스터디룸",
        description: description || "등록된 설명이 없습니다.",
        host: host || ""
      });
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("roomId");
    if (roomId) {
      const backendHost = window.location.hostname;
      fetch(`http://${backendHost}:8080/api/streams`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const found = data.find(item => String(item.id) === String(roomId));
            if (found) {
              setRoomInfo({
                title: found.title || "실시간 스터디룸",
                description: found.description || "등록된 설명이 없습니다.",
                host: found.host || ""
              });
            }
          }
        })
        .catch((e) => console.error("방 정보 조회 실패:", e));
    }
  }, [location]);

  const [isAudioActive, setIsAudioActive] = useState(false);
  const audioStreamRef = useRef(null);

  const handleToggleAudio = async () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !audioTracks[0].enabled;
        audioTracks[0].enabled = nextState;
        setIsAudioActive(nextState);
        return;
      }
    }

    if (isAudioActive) {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
      setIsAudioActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        audioStreamRef.current = stream;

        if (localStreamRef.current) {
          stream.getAudioTracks().forEach(track => {
            localStreamRef.current.addTrack(track);
          });
        } else {
          localStreamRef.current = stream;
          setLocalStream(stream);
        }

        setIsAudioActive(true);

        Object.values(pcsRef.current).forEach((pc) => {
          stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
          });
        });

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
        alert("마이크 권한을 허용해주세요.");
      }
    }
  };

  const [activeWhisperId, setActiveWhisperId] = useState(null);
  const [whisperMessages, setWhisperMessages] = useState({});
  const [whisperInput, setWhisperInput] = useState("");

  const [searchPlaces, setSearchPlaces] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: 37.517236, lng: 127.047325 });

  const [miniMapInstance, setMiniMapInstance] = useState(null);
  const [modalMapInstance, setModalMapInstance] = useState(null);

  // 🌟 DB 연동 스터디룸 위치 데이터 가져오기
  const fetchStudyRoomsFromDB = async () => {
    try {
      const backendHost = window.location.hostname;
      const response = await fetch(`http://${backendHost}:8080/api/study-rooms/locations`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        const rooms = data.map((room) => ({
          id: room.studyRoomId,
          name: room.name,
          lat: parseFloat(room.latitude),
          lng: parseFloat(room.longitude),
          address: room.address,
          description: room.description,
          pricePerHour: room.pricePerHour,
          imageUrl: room.imageUrl
        }));
        setSearchPlaces(rooms);
        if (rooms.length > 0) {
          setMapCenter({ lat: rooms[0].lat, lng: rooms[0].lng });
        }
      }
    } catch (err) {
      console.error("DB 스터디룸 조회 실패:", err);
    }
  };

  useEffect(() => {
    const scriptId = "kakao-map-script";
    if (document.getElementById(scriptId)) {
      fetchStudyRoomsFromDB();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        fetchStudyRoomsFromDB();
      });
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isMapOpen || !window.kakao || !window.kakao.maps) return;

    window.kakao.maps.load(() => {
      const container = document.getElementById("kakao-mini-map");
      if (!container) return;
      const options = {
        center: new window.kakao.maps.LatLng(mapCenter.lat, mapCenter.lng),
        level: 5,
      };
      const map = new window.kakao.maps.Map(container, options);
      setMiniMapInstance(map);
    });
  }, [isMapOpen]);

  useEffect(() => {
    if (!isMapModalOpen || !window.kakao || !window.kakao.maps) return;

    window.kakao.maps.load(() => {
      const container = document.getElementById("kakao-modal-map");
      if (!container) return;
      const options = {
        center: new window.kakao.maps.LatLng(mapCenter.lat, mapCenter.lng),
        level: 5,
      };
      const map = new window.kakao.maps.Map(container, options);
      setModalMapInstance(map);
    });
  }, [isMapModalOpen]);

  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) return;
    const moveLatLon = new window.kakao.maps.LatLng(mapCenter.lat, mapCenter.lng);

    if (miniMapInstance) {
      miniMapInstance.setCenter(moveLatLon);
    }
    if (modalMapInstance) {
      modalMapInstance.setCenter(moveLatLon);
      modalMapInstance.relayout();
    }
  }, [mapCenter, miniMapInstance, modalMapInstance]);

  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) return;

    const renderMarkers = (mapInstance) => {
      if (!mapInstance) return;
      searchPlaces.forEach((place) => {
        const markerPosition = new window.kakao.maps.LatLng(place.lat, place.lng);
        const marker = new window.kakao.maps.Marker({ position: markerPosition });
        marker.setMap(mapInstance);

        // 🌟 마커 클릭 시 스터디룸 이름 표시 및 예약 연동 안내
        window.kakao.maps.event.addListener(marker, 'click', () => {
          setMapCenter({ lat: place.lat, lng: place.lng });
        });
      });
    };

    renderMarkers(miniMapInstance);
    renderMarkers(modalMapInstance);
  }, [searchPlaces, miniMapInstance, modalMapInstance]);

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
        e.preventDefault();
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

    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("roomId") || "default-room";

    const wsUrl = `${protocol}//${hostname}:8080/signal?roomId=${roomId}`;
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
        } else if (data.type === "stream-ended") {
          alert("방장이 스트리밍을 종료했습니다.");
          navigate("/streaming");
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
  }, [location.search]);

  const stopStream = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (pipCamStreamRef.current) {
      pipCamStreamRef.current.getTracks().forEach((track) => track.stop());
      pipCamStreamRef.current = null;
    }

    if (pipScreenStreamRef.current) {
      pipScreenStreamRef.current.getTracks().forEach((track) => track.stop());
      pipScreenStreamRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setLocalStream(null);
    setShareMode("idle");
    setIsAudioActive(false);
    setIsLayoutSwapped(false);
    isLayoutSwappedRef.current = false;
    setIsPipVisible(true);
    isPipVisibleRef.current = true;

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
    try {
      let stream = null;

      if (type === "camera") {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        if (pipScreenStreamRef.current) {
          pipScreenStreamRef.current.getTracks().forEach(t => t.stop());
          pipScreenStreamRef.current = null;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        setShareMode(type);
        setIsAudioActive(true);

        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        Object.values(pcsRef.current).forEach((pc) => {
          const senders = pc.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === 'video');
          const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
          if (videoSender && videoTrack) videoSender.replaceTrack(videoTrack);
          if (audioSender && audioTrack) audioSender.replaceTrack(audioTrack);
        });

      } else if (type === "screen") {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        pipScreenStreamRef.current = screenStream;
        pipCamStreamRef.current = camStream;

        const screenVideo = document.createElement("video");
        screenVideo.srcObject = screenStream;
        screenVideo.muted = true;
        await screenVideo.play();

        const camVideo = document.createElement("video");
        camVideo.srcObject = camStream;
        camVideo.muted = true;
        await camVideo.play();

        const canvas = document.createElement("canvas");
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext("2d");

        const drawCanvas = () => {
          const swapped = isLayoutSwappedRef.current;
          const showPip = isPipVisibleRef.current;

          if (!swapped) {
            ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

            if (showPip) {
              const pipW = 320, pipH = 180;
              const pipX = canvas.width - pipW - 30;
              const pipY = canvas.height - pipH - 30;

              ctx.save();
              ctx.strokeStyle = "#4f46e5";
              ctx.lineWidth = 4;
              ctx.strokeRect(pipX, pipY, pipW, pipH);
              ctx.drawImage(camVideo, pipX, pipY, pipW, pipH);
              ctx.restore();
            }
          } else {
            ctx.drawImage(camVideo, 0, 0, canvas.width, canvas.height);

            if (showPip) {
              const pipW = 320, pipH = 180;
              const pipX = canvas.width - pipW - 30;
              const pipY = canvas.height - pipH - 30;

              ctx.save();
              ctx.strokeStyle = "#ef4444";
              ctx.lineWidth = 4;
              ctx.strokeRect(pipX, pipY, pipW, pipH);
              ctx.drawImage(screenVideo, pipX, pipY, pipW, pipH);
              ctx.restore();
            }
          }

          animFrameRef.current = requestAnimationFrame(drawCanvas);
        };
        drawCanvas();

        const mixedStream = canvas.captureStream(30);
        camStream.getAudioTracks().forEach((track) => mixedStream.addTrack(track));

        canvasStreamRef.current = mixedStream;
        localStreamRef.current = mixedStream;
        setLocalStream(mixedStream);
        setShareMode("screen");
        setIsAudioActive(true);

        const mixedVideoTrack = mixedStream.getVideoTracks()[0];
        const micAudioTrack = mixedStream.getAudioTracks()[0];

        Object.values(pcsRef.current).forEach((pc) => {
          const senders = pc.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === 'video');
          const audioSender = senders.find(s => s.track && s.track.kind === 'audio');
          if (videoSender && mixedVideoTrack) videoSender.replaceTrack(mixedVideoTrack);
          if (audioSender && micAudioTrack) audioSender.replaceTrack(micAudioTrack);
        });

        screenStream.getVideoTracks()[0].onended = () => handleStartMedia("camera");
      }

      if (socketRef.current?.readyState === WebSocket.OPEN && Object.keys(pcsRef.current).length === 0) {
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

  const processAndSendFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      alert("이미지 파일만 전송할 수 있습니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Image = uploadEvent.target.result;
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      const msgData = {
        type: "chat",
        senderId: myIdRef.current,
        nickname: nickname,
        text: `📷 [이미지 전송]`,
        image: base64Image,
        time: timeStr
      };

      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(msgData));
      }

      setMessages((prev) => [...prev, { id: Date.now(), ...msgData, isMe: true }]);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processAndSendFile(files[0]);
    }
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

  return (
      <main className="cam-study-container">
        <section className="cam-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
              👥 {roomInfo?.title || "실시간 스터디룸"}

              {(roomInfo?.host === nickname || isHost) && (
                <span style={{ fontSize: "12px", background: "#fef3c7", color: "#d97706", padding: "2px 8px", borderRadius: "12px", fontWeight: "600" }}>
                  host ({nickname})
                </span>
              )}

              <span style={{ fontSize: "12px", background: "#e0e7ff", color: "#4f46e5", padding: "2px 8px", borderRadius: "12px", fontWeight: "600" }}>
                접속자: {totalUsers}명
              </span>
            </h2>
            {roomInfo?.description && (
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                📝 {roomInfo.description}
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {isHost && (
              <>
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
              </>
            )}

            <button
              type="button"
              className="btn-kakao-invite"
              style={{ background: "#ef4444", color: "#fff" }}
              onClick={handleLeaveRoom}
            >
              <span>🚪 스트리밍 종료 / 뒤로 가기를 누르지 말아주세요.</span>
            </button>
          </div>
        </section>

        <section className="cam-main-layout">
          <div className="cam-grid">
           <VideoCard
               label={isHost ? `👑 호스트 (${nickname})` : `나 (${nickname})`}
               isLocal={true}
               stream={localStream}
               onStartCam={() => handleStartMedia("camera")}
               onStartScreen={() => handleStartMedia("screen")}
               onStop={stopStream}
               shareMode={shareMode}
               isSttActive={isSttActive}
               toggleStt={toggleStt}
               isAudioActive={isAudioActive}
               onToggleAudio={handleToggleAudio}
               isLayoutSwapped={isLayoutSwapped}
               onToggleLayout={handleToggleLayout}
               isPipVisible={isPipVisible}
               onTogglePip={handleTogglePip}
           />

            {remoteUsers.map((peerId) => {
              const currentPeerNick = remoteNicknames[peerId] || peerId.substring(0, 4);

              const roomHost = roomInfo?.host ? String(roomInfo.host).trim() : "";
              const peerNick = String(currentPeerNick).trim();
              const isThisUserHost = roomHost && (roomHost === peerNick || peerNick.includes(roomHost));

              return (
                <div key={peerId} style={{ display: "flex", flexDirection: "column", gap: "10px", width: "480px" }}>
                  <VideoCard
                      peerId={peerId}
                      label={isThisUserHost ? `👑 호스트 (${currentPeerNick})` : `참가자 (${currentPeerNick})`}
                      isLocal={false}
                      stream={remoteStreams[peerId] || null}
                      shareMode="idle"
                      onOpenWhisper={openWhisperChat}
                  />

                  {activeWhisperId === peerId && (
                      <div className="ai-sub-chat-panel" style={{ height: "240px", width: "100%", display: "flex", flexDirection: "column", border: "2px solid #4f46e5", borderRadius: "12px", background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                        <div className="chat-header" style={{ background: "#4f46e5", padding: "8px 12px" }}>
                          <span>🔒 귓속말 ({currentPeerNick})</span>
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

                        <form onSubmit={handleSendWhisper} style={{ padding: "6px 10px", background: "#fff", borderTop: "1px solid #e0e0e0" }}>
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
              );
            })}
          </div>

          <div className="cam-right-sidebar" style={{ position: "relative", overflow: "visible", display: "flex", flexDirection: "column", gap: "12px", width: "360px", flexShrink: 0 }}>
              <div style={{ display: "flex", flexDirection: "row", gap: "10px", alignItems: "flex-start" }}>
                <div
                    className="cam-chat-panel"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    style={{ height: "540px", width: "360px", flexShrink: 0, display: "flex", flexDirection: "column" }}
                >

                  <div className="chat-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <div className="chat-header-left" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: "700", fontSize: "14px", color: "#1e293b" }}>실시간 채팅</span>
                      <span className="chat-user-count-badge" style={{ fontSize: "11px", background: "#e0e7ff", color: "#4f46e5", padding: "2px 6px", borderRadius: "10px", fontWeight: "600" }}>{totalUsers}명 참여중</span>
                    </div>
                    {isHost && (
                      <button
                          type="button"
                          onClick={() => setIsCalendarOpen((prev) => !prev)}
                          style={{ background: "#4f46e5", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: "600" }}
                      >
                        {isCalendarOpen ? "채팅 보기" : "📅 모임 캘린더"}
                      </button>
                    )}
                  </div>

                  <div className="chat-messages-container" ref={chatContainerRef} style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {messages.map((msg) =>
                        msg.isSystem ? (
                            <div key={msg.id} className="chat-system-msg" style={{ textAlign: "center", fontSize: "12px", color: "#64748b", background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px" }}>{msg.text}</div>
                        ) : (
                            <div key={msg.id} className={`chat-bubble-row ${msg.isMe ? "me" : "other"}`} style={{ display: "flex", justifyContent: msg.isMe ? "flex-end" : "flex-start" }}>
                              <div className="chat-bubble" style={{ maxWidth: "80%", background: msg.isMe ? "#4f46e5" : "#f1f5f9", color: msg.isMe ? "#fff" : "#1e293b", padding: "8px 12px", borderRadius: "8px", fontSize: "13px" }}>
                                {!msg.isMe && <strong style={{ display: "block", fontSize: "10px", color: "#64748b", marginBottom: "2px" }}>{msg.nickname}</strong>}
                                {msg.text}
                                {msg.image && (
                                    <div style={{ marginTop: "6px" }}>
                                      <img src={msg.image} alt="전송된 이미지" style={{ maxWidth: "100%", borderRadius: "6px", maxHeight: "150px", objectFit: "cover" }} />
                                    </div>
                                )}
                              </div>
                            </div>
                        )
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  <form className="chat-input-form" onSubmit={handleSendMessage} style={{ display: "flex", padding: "10px", borderTop: "1px solid #e2e8f0", background: "#fff", gap: "6px", alignItems: "center" }}>
                    <input
                        type="text"
                        className="chat-text-input"
                        placeholder='메시지 입력 또는 이미지 드래그...'
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        style={{ flex: 1, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", outline: "none" }}
                    />
                    <button type="submit" className="chat-send-btn" style={{ background: "#4f46e5", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>전송</button>
                  </form>
                </div>
              </div>

              {isHost && isMapOpen && (
                  <div style={{ width: "100%", height: "260px", background: "#fff", border: "2px solid #ef4444", borderRadius: "16px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <div style={{ background: "#ef4444", color: "#fff", padding: "8px 14px", fontSize: "12px", fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>🗺️ DB 등록 스터디룸 위치 (카카오맵)</span>
                      <button type="button" onClick={() => setIsMapModalOpen(true)} style={{ background: "#fff", color: "#ef4444", border: "none", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>🔍 크게 보기</button>
                    </div>
                    <div id="kakao-mini-map" style={{ width: "100%", height: "200px" }} />
                  </div>
              )}

              {isMapModalOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "85vw", height: "85vh", background: "#fff", borderRadius: "16px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,0.3)" }}>

                    <div style={{ background: "#ef4444", color: "#fff", padding: "14px 20px", fontSize: "15px", fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span>🗺️ 볕자리 찾기 - DB 등록 스터디룸 목록</span>
                        <button
                          type="button"
                          onClick={() => navigate("/study-reservation")}
                          style={{ background: "#059669", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          📅 제휴 스터디 카페 예약 및 결제하기 →
                        </button>
                      </div>
                      <button type="button" onClick={() => setIsMapModalOpen(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: "18px", fontWeight: "bold", cursor: "pointer" }}>✕ 닫기</button>
                    </div>

                    <div style={{ display: "flex", flex: 1, width: "100%", height: "calc(100% - 56px)", overflow: "hidden", position: "relative" }}>
                      <div style={{ width: "340px", background: "#f9fafb", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", padding: "16px", gap: "12px", overflowY: "auto", zIndex: 2, flexShrink: 0 }}>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "#1f2937" }}>📍 등록된 스터디룸 목록</div>
                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "-4px" }}>
                          {searchPlaces.length > 0 ? `총 ${searchPlaces.length}개 공간` : "등록된 스터디룸이 없습니다."}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {searchPlaces.map((place) => (
                            <div
                              key={place.id}
                              onClick={() => setMapCenter({ lat: place.lat, lng: place.lng })}
                              style={{ background: "#fff", padding: "12px", borderRadius: "8px", border: "1px solid #e5e7eb", cursor: "pointer", display: "flex", flexDirection: "column", gap: "6px" }}
                            >
                              <div style={{ fontWeight: "700", fontSize: "13px", color: "#111827" }}>{place.name}</div>
                              <div style={{ fontSize: "11px", color: "#4b5563" }}>{place.address}</div>


                            </div>
                          ))}
                        </div>
                      </div>
                      <div id="kakao-modal-map" style={{ flex: 1, position: "relative", height: "100%" }} />
                    </div>
                  </div>
                </div>
            )}

              {isHost && (
                <MiniCalendar
                    calendarDate={calendarDate}
                    groupSchedules={groupSchedules}
                    isCalendarOpen={isCalendarOpen}
                    moveMiniMonth={moveMiniMonth}
                    setIsCalendarOpen={setIsCalendarOpen}
                />
              )}
            </div>
        </section>
      </main>
  );
}