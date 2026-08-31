import React, { useEffect, useRef, useState } from "react";
<<<<<<< Updated upstream
import { useNavigate, useLocation } from "react-router-dom";
import "./CamPage.css";
=======
import { useNavigate } from "react-router-dom";

import "./Base.css";
import "./BroadCast.css";
import 'leaflet/dist/leaflet.css';
>>>>>>> Stashed changes

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

  // 개별 카드 모니터 전체 화면 (True Fullscreen) 안정화
  const handleCardFullScreen = () => {
    if (!cardRef.current) return;

    if (!document.fullscreenElement) {
      cardRef.current.requestFullscreen().catch((err) => {
        console.error("전체 화면 전환 실패:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // 전체 화면 해제 시 스트림 및 DOM 강제 유지를 위한 이벤트 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [stream]);

  // stream 연결 처리
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
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
            {shareMode === "idle" ? (
              <>
                <button type="button" onClick={onStartCam}>캠 켜기</button>
                <button type="button" onClick={onStartScreen}>화면 공유</button>
              </>
            ) : (
              <button type="button" onClick={onStop} style={{ background: "#ef4444" }}>
                중지하기
              </button>
            )}
            <button type="button" onClick={toggleStt} style={{ background: isSttActive ? "#10b981" : "#6b7280" }}>
              {isSttActive ? "🎙️ STT 켜짐" : "🎙️ STT 꺼짐"}
            </button>
          </>
        )}

        {/* 전체 화면 버튼 */}
        <button type="button" onClick={handleCardFullScreen} title="전체 화면">
          ⛶ 전체 화면
        </button>
      </div>
    </div>
  );
}

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
                            onToggleAudio
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
                   className={`btn-custom ${isAudioActive ? "btn-stt-on" : "btn-stt-off"}`}
                   onClick={onToggleAudio}
               >
                 {isAudioActive ? "🎙️ 마이크 켜짐" : "🔇 마이크 꺼짐"}
               </button>
                <button
                    type="button"
                    className={`btn-custom ${isSttActive ? "btn-stt-on" : "btn-stt-off"}`}
                    onClick={toggleStt}
                >
                  {isSttActive ? "🎙️ 목소리로 채팅 켜짐" : "🎙️ 목소리로 채팅 꺼짐"}
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

const KAKAO_REST_KEY = "128822f9bfdfb4b70d794c947ef21231";

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

  const [remoteUsers, setRemoteUsers] = useState([]);
  const [remoteNicknames, setRemoteNicknames] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [shareMode, setShareMode] = useState("idle");
  const [isSttActive, setIsSttActive] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // 방 제목 및 설명 상태
  const [roomInfo, setRoomInfo] = useState({
    title: "실시간 스터디룸",
    description: "함께 공부하고 소통하는 공간입니다."
  });

  useEffect(() => {
    if (location.state && location.state.roomInfo) {
      const { title, description } = location.state.roomInfo;
      setRoomInfo({
        title: title || "실시간 스터디룸",
        description: description || "등록된 설명이 없습니다."
      });
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("roomId");
    if (roomId) {
      const saved = localStorage.getItem("myCreatedStreams");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const found = parsed.find(item => String(item.id) === String(roomId));
          if (found) {
            setRoomInfo({
              title: found.title,
              description: found.description
            });
          }
        } catch (e) {}
      }
    }
  }, [location]);

  const [isAudioActive, setIsAudioActive] = useState(false);
  const audioStreamRef = useRef(null);

  const handleToggleAudio = async () => {
      // 1. 이미 로컬 스트림(캠 또는 화면공유)이 존재하고 오디오 트랙이 있는 경우
      if (localStreamRef.current) {
        const audioTracks = localStreamRef.current.getAudioTracks();
        if (audioTracks.length > 0) {
          const nextState = !audioTracks[0].enabled;
          audioTracks[0].enabled = nextState;
          setIsAudioActive(nextState);
          return;
        }
      }

      // 2. 캠이 안 켜져 있거나 오디오 트랙이 없을 때 단독 마이크 켜기/끄기
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

          // 기존 비디오 스트림이 있다면 오디오 트랙만 추가
          if (localStreamRef.current) {
            stream.getAudioTracks().forEach(track => {
              localStreamRef.current.addTrack(track);
            });
          } else {
            localStreamRef.current = stream;
            setLocalStream(stream);
          }

          setIsAudioActive(true);

          // 피어 커넥션들에 마이크 트랙 전송
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

  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchPlaces, setSearchPlaces] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: 37.4563, lng: 126.7052 });

  const miniMapRef = useRef(null);
  const modalMapRef = useRef(null);
  const [miniMapInstance, setMiniMapInstance] = useState(null);
  const [modalMapInstance, setModalMapInstance] = useState(null);

  // 카카오맵 SDK 동적 로드
  useEffect(() => {
    const scriptId = "kakao-map-script";
    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {});
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
        level: 4,
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
        level: 4,
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
      });
    };

    renderMarkers(miniMapInstance);
    renderMarkers(modalMapInstance);
  }, [searchPlaces, miniMapInstance, modalMapInstance]);

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

<<<<<<< Updated upstream
=======
  // 브라우저 위치 정보 가져오기 및 서버 전송
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMyPosition([latitude, longitude]);

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

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream

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
=======
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
>>>>>>> Stashed changes
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "init") {
          myIdRef.current = data.myId;
          updateRemoteList(allUsersCache);
<<<<<<< Updated upstream
=======
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
>>>>>>> Stashed changes
        } else if (data.type === "userList") {
          const rawUsers = data.users || [];
          const distinctPeerIds = [];
          const nickMap = {};

          for (let i = 0; i < rawUsers.length; i++) {
            const item = rawUsers[i];
<<<<<<< Updated upstream
            let id = typeof item === "string" ? item : (item?.id || "");
            let nick = typeof item === "string" ? item : (item?.nickname || "참가자");
            if (!id || id === myIdRef.current) continue;
            if (!distinctPeerIds.includes(id)) {
              distinctPeerIds.push(id);
            }
=======
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
>>>>>>> Stashed changes
            nickMap[id] = nick;
          }

          allUsersCache = distinctPeerIds;
          setRemoteNicknames((prev) => ({ ...prev, ...nickMap }));
          updateRemoteList(allUsersCache);
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
        } else if (data.type === "request-stream") {
          if (localStreamRef.current && data.senderId && data.senderId !== myIdRef.current) {
            sendOfferToPeer(data.senderId);
          }
        } else if (data.type === "offer") {
          if (data.target && data.target !== myIdRef.current) return;

          const pc = createPeerConnection(data.senderId);
<<<<<<< Updated upstream
=======
          if (pc.signalingState !== "stable") {
            return;
          }

>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
          if (pc) {
=======
          if (pc && pc.signalingState === "have-local-offer") {
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
            pcsRef.current[data.senderId].close();
            delete pcsRef.current[data.senderId];
          }
          delete candidateQueueRef.current[data.senderId];

=======
            try { pcsRef.current[data.senderId].close(); } catch (e) {}
            delete pcsRef.current[data.senderId];
          }
>>>>>>> Stashed changes
          setRemoteStreams((prev) => {
            const updated = { ...prev };
            delete updated[data.senderId];
            return updated;
          });
        } else if (data.type === "chat") {
<<<<<<< Updated upstream
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
=======
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
>>>>>>> Stashed changes
        }
      } catch (e) {}
    };

    return () => {
      stopStream();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
<<<<<<< Updated upstream
      ws.close();
=======
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
>>>>>>> Stashed changes
    };
  }, []);

  const stopStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setShareMode("idle");
    setIsAudioActive(false);

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

  const handleFullScreen = () => {
    const elem = document.querySelector(".cam-study-container");
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch((err) => {
        alert(`전체 화면 전환 실패: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
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
      setIsAudioActive(true);

      stream.getVideoTracks()[0].onended = () => stopStream();

<<<<<<< Updated upstream
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
=======
      for (const peerId of remoteUsersRef.current) {
        await sendOfferToPeer(peerId);
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      <main className="cam-study-container">
        <section className="cam-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
              👥 {roomInfo.title} <span style={{ fontSize: "12px", background: "#e0e7ff", color: "#4f46e5", padding: "2px 8px", borderRadius: "12px", fontWeight: "600" }}>접속자: {totalUsers}명</span>
            </h2>
            {roomInfo.description && (
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                📝 {roomInfo.description}
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" className="btn-kakao-invite" onClick={handleKakaoInvite}>
              <span>💬 카카오톡 초대</span>
            </button>
            <button
=======
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

          {remoteUsers.filter(peerId => remoteStreams[peerId]).map((peerId) => (
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
>>>>>>> Stashed changes
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
               isAudioActive={isAudioActive}
               onToggleAudio={handleToggleAudio}
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

            {/* 카카오 미니맵 패널 */}
            {isMapOpen && (
                <div style={{ width: "100%", height: "260px", background: "#fff", border: "2px solid #ef4444", borderRadius: "16px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ background: "#ef4444", color: "#fff", padding: "8px 14px", fontSize: "12px", fontWeight: "700", display: "flex", justifyContent: "space-between" }}>
                    <span>🗺️ 스터디 위치 (카카오맵)</span>
                    <button type="button" onClick={() => setIsMapModalOpen(true)} style={{ background: "#fff", color: "#ef4444", border: "none", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>🔍 크게 보기</button>
                  </div>
                  <div id="kakao-mini-map" style={{ width: "100%", height: "200px" }} />
                </div>
            )}

            {/* 카카오 크게 보기 모달 */}
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
                      <div id="kakao-modal-map" style={{ flex: 1, position: "relative", height: "100%" }} />
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