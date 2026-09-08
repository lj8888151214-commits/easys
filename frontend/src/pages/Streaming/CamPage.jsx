import { useEffect, useRef, useState } from "react";
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
                            onToggleLayout
                          }) {
  const cardRef = useRef(null);
  const videoRef = useRef(null);

  const handleCardFullScreen = () => {
    if (!cardRef.current) return;
    if (!document.fullscreenElement) {
      cardRef.current.requestFullscreen().catch(() => {});
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
        <div className="cam-card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4>{label}</h4>
          {!isLocal && peerId && (
              <button
                  type="button"
                  onClick={() => onOpenWhisper(peerId)}
                  style={{
                    background: "#4f8a63",
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

                {shareMode === "screen" && (
                    <button
                        type="button"
                        className="btn-custom"
                        style={{ background: isLayoutSwapped ? "#ef4444" : "#4f8a63", color: "#fff" }}
                        onClick={onToggleLayout}
                    >
                      {isLayoutSwapped ? "🔄 화면 크게 보기" : "🔄 캠 크게 보기"}
                    </button>
                )}

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
  const chatBottomRef = useRef(null);

  const canvasStreamRef = useRef(null);
  const animFrameRef = useRef(null);
  const pipCamStreamRef = useRef(null);
  const pipScreenStreamRef = useRef(null);

  const [isLayoutSwapped, setIsLayoutSwapped] = useState(false);
  const isLayoutSwappedRef = useRef(false);

  const handleToggleLayout = () => {
    setIsLayoutSwapped((prev) => {
      const next = !prev;
      isLayoutSwappedRef.current = next;
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

  // 미니 달력(ㄷㄹ) 기능이 사용하는 현재 방 id. URL의 roomId를 그대로 쓴다
  // (StreamingStudio.id와 동일한 값).
  const roomId = new URLSearchParams(location.search).get("roomId");

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
      } catch {
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
  const [hoveredCafeId, setHoveredCafeId] = useState(null);
  const cafeElementRefs = useRef({});

  const [miniMapInstance, setMiniMapInstance] = useState(null);
  const [modalMapInstance, setModalMapInstance] = useState(null);

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

  const [calendarDate, setCalendarDate] = useState(new Date());
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();

  const moveMiniMonth = (amount) => {
    setCalendarDate(new Date(calYear, calMonth + amount, 1));
  };

  // ㄷㄹ 미니 달력에 표시할, "이 방의 방장이 등록한" 원본 일정 목록.
  // 방장/시청자 모두 같은 목록을 보되, 등록(POST) 가능 여부만 isHost로 갈린다.
  const [roomSchedules, setRoomSchedules] = useState([]);
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

  // isHost 보정: location.state.isHost는 이 방에 처음 navigate로 진입했을 때만
  // 존재하고, 새로고침/URL 직접 접근/새 탭에서는 사라져 실제 방장인데도
  // isHost가 false로 고정되는 문제가 있었다. roomInfo(=/api/streams 재조회 결과)가
  // 로딩된 뒤 그 방의 host 닉네임이 내 닉네임과 같다면 방장으로 보정한다.
  // - roomInfo.host가 아직 빈 문자열(로딩 전)일 때는 조건이 성립하지 않으므로
  //   여기서 성급하게 false로 확정하는 일은 없다.
  // - true -> false로 되돌리는 로직은 없으므로(항상 true로만 보정), 기존
  //   location.state.isHost === true 정상 진입 경로는 그대로 유지된다.
  // - 판정 기준(roomInfo?.host === nickname)은 1255번째 줄 방장 뱃지 표시에
  //   이미 쓰이던 것과 동일해서 서로 모순되지 않는다.
  useEffect(() => {
    if (roomInfo?.host && roomInfo.host === nickname) {
      setIsHost(true);
    }
  }, [roomInfo, nickname]);

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

  // 이 방(roomId)에 방장이 등록한 원본 방송 일정만 불러온다(개인 캘린더 기반).
  // 시청자의 복사본은 streamingRoomId가 없어 여기 포함되지 않는다.
  const loadRoomSchedules = async () => {
    if (!roomId) return;
    try {
      const backendHost = window.location.hostname;
      const response = await fetch(
        `http://${backendHost}:8080/api/calendar/personal/room/${roomId}`,
        { credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json();
        setRoomSchedules(Array.isArray(data) ? data : []);
      }
    } catch { /* 무시 가능한 오류 */ }
  };

  useEffect(() => {
    loadRoomSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // 방장 전용: 미니 달력에서 선택한 날짜에 새 방송 일정을 등록한다.
  // 나의 캘린더(POST /api/calendar/personal)를 그대로 재사용하고,
  // streamingRoomId만 현재 방으로 채워 서버가 "이 방의 원본 방송 일정"으로 저장하게 한다.
  // 방장 본인의 나의 캘린더에도 일반 개인 일정과 동일하게 저장된다.
  const handleCreateRoomSchedule = async ({ title, content, startAt, endAt }) => {
    try {
      const backendHost = window.location.hostname;
      const response = await fetch(`http://${backendHost}:8080/api/calendar/personal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          content,
          startAt,
          endAt,
          streamingRoomId: roomId ? Number(roomId) : null,
        }),
      });

      if (!response.ok) {
        alert("일정 등록에 실패했습니다.");
        return false;
      }

      await loadRoomSchedules();

      // 같은 방을 보고 있는 다른 사용자들에게도 즉시 반영되도록 알린다.
      // WebSocketConfig의 기존 시그널링 핸들러는 target이 없는 메시지를
      // "채팅"과 동일하게 방 전체(자신 제외)에 그대로 브로드캐스트하므로,
      // 백엔드 변경 없이 이 하나의 메시지 타입만 추가하면 된다.
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "schedule-updated" }));
      }

      alert("일정이 등록되었습니다.");
      return true;
    } catch {
      alert("일정 등록 중 오류가 발생했습니다.");
      return false;
    }
  };

  // 시청자 전용: 방장 일정을 자신의 나의 캘린더에 개인 일정 사본으로 등록한다.
  // 역시 기존 POST /api/calendar/personal을 그대로 재사용하되, streamingRoomId는
  // 보내지 않아(=null) 일반 개인 일정과 동일하게 저장되고 이 사본이 "이 방의
  // 원본"으로 다시 뜨지 않게 한다.
  // 생성된 사본(id 포함)을 돌려줘서, 시청자가 나중에 이 사본만 따로
  // 취소(삭제)할 수 있도록 MiniCalendar가 id를 기억해둘 수 있게 한다.
  const handleAddScheduleToMyCalendar = async (schedule) => {
    try {
      const backendHost = window.location.hostname;
      const hostName = roomInfo?.host || "스트리머";
      const response = await fetch(`http://${backendHost}:8080/api/calendar/personal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          // "[방송] " 마커: streaming_room_id를 null로 저장해도(공개 목록에
          // 안 뜨게 하려고 의도적으로 비움) 나의 캘린더 화면에서 이 사본이
          // 방송에서 가져온 일정임을 구분할 수 있게 title 앞에 붙인다.
          // Calendar.jsx가 화면에는 이 마커를 지우고 빨간 점으로만 표시한다.
          title: `[방송] ${hostName}님 ${schedule.title}`,
          content: schedule.content,
          startAt: schedule.startAt,
          endAt: schedule.endAt,
        }),
      });

      if (!response.ok) {
        alert("캘린더 추가에 실패했습니다.");
        return null;
      }

      const created = await response.json();
      alert("내 캘린더에 추가되었습니다.");
      return created;
    } catch {
      alert("캘린더 추가 중 오류가 발생했습니다.");
      return null;
    }
  };

  // 방장 전용: 자신이 이 방에 등록한 원본 방송 일정을 취소(삭제)한다.
  // 기존 DELETE /api/calendar/personal/{id}를 그대로 재사용한다 - 이 API는
  // 이미 본인 소유만 삭제 가능하도록 서버에서 검증하고 있다.
  const handleDeleteRoomSchedule = async (schedule) => {
    try {
      const backendHost = window.location.hostname;
      const response = await fetch(`http://${backendHost}:8080/api/calendar/personal/${schedule.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        alert("일정 취소에 실패했습니다.");
        return false;
      }

      await loadRoomSchedules();

      // 방장이 취소했다는 것도 같은 방의 다른 사용자들에게 즉시 알린다.
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "schedule-updated" }));
      }

      alert("일정이 취소되었습니다.");
      return true;
    } catch {
      alert("일정 취소 중 오류가 발생했습니다.");
      return false;
    }
  };

  // 시청자 전용: 자신이 복사해둔 사본만 취소한다. 원본(streamingRoomId가
  // 걸린 방장 일정)에는 전혀 영향이 없다 - 삭제 대상이 사본의 id이기 때문.
  // 이 사본은 roomSchedules(방 소속 목록)에 애초에 포함되지 않으므로
  // loadRoomSchedules/브로드캐스트가 필요 없다.
  const handleDeleteMyCopy = async (copyId) => {
    try {
      const backendHost = window.location.hostname;
      const response = await fetch(`http://${backendHost}:8080/api/calendar/personal/${copyId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        alert("일정 취소에 실패했습니다.");
        return false;
      }

      alert("내 캘린더에서 취소되었습니다.");
      return true;
    } catch {
      alert("일정 취소 중 오류가 발생했습니다.");
      return false;
    }
  };

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
      } catch { /* 무시 가능한 오류 */ }
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
          try { recognition.start(); } catch { /* 무시 가능한 오류 */ }
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
      } catch { /* 무시 가능한 오류 */ }
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
    } catch { /* 무시 가능한 오류 */ }
  };

  // useEffect 클린업(아래)에서 stopStream을 호출하므로, 그보다 먼저 선언해야 한다.
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
            } catch { /* 무시 가능한 오류 */ }
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
        } else if (data.type === "schedule-updated") {
          // 방장이 미니 달력에 새 일정을 등록했다는 신호. target 없이 방
          // 전체로 브로드캐스트되는 기존 시그널링 구조를 그대로 탄 것이라
          // 백엔드(WebSocketConfig)는 전혀 손대지 않았다.
          loadRoomSchedules();
        }
      } catch { /* 무시 가능한 오류 */ }
    };

    return () => {
      stopStream();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      ws.close();
    };
  }, [location.search]);

  const handleStartMedia = async (type) => {
    stopStream();
    try {
      let stream = null;

      if (type === "camera") {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        setLocalStream(stream);
        setShareMode(type);
        setIsAudioActive(true);
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

          if (!swapped) {
            ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

            const pipW = 320, pipH = 180;
            const pipX = canvas.width - pipW - 30;
            const pipY = canvas.height - pipH - 30;

            ctx.save();
            ctx.strokeStyle = "#4f8a63";
            ctx.lineWidth = 4;
            ctx.strokeRect(pipX, pipY, pipW, pipH);
            ctx.drawImage(camVideo, pipX, pipY, pipW, pipH);
            ctx.restore();
          } else {
            ctx.drawImage(camVideo, 0, 0, canvas.width, canvas.height);

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

        screenStream.getVideoTracks()[0].onended = () => stopStream();
      }

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
    } catch {
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
    // block/inline을 "nearest"로 지정해 채팅 컨테이너 내부만 스크롤하고,
    // window(페이지 전체) 스크롤에는 영향을 주지 않도록 한다.
    // (기본값 "start"를 쓰면 페이지 전체 높이가 뷰포트보다 클 때 window까지
    // 함께 스크롤되어, 진입 직후에도 Header가 스크롤된 색상으로 표시되는
    // 원인이 된다.)
    chatBottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
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

              <span style={{ fontSize: "12px", background: "#eaf5ee", color: "#4f8a63", padding: "2px 8px", borderRadius: "12px", fontWeight: "600" }}>
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
                    style={{ background: "#4f8a63", color: "#fff" }}
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
                      <div className="ai-sub-chat-panel" style={{ height: "240px", width: "100%", display: "flex", flexDirection: "column", border: "2px solid #4f8a63", borderRadius: "12px", background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                        <div className="chat-header" style={{ background: "#4f8a63", padding: "8px 12px" }}>
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
                <div className="cam-chat-panel" style={{ height: "540px", width: "360px", flexShrink: 0, display: "flex", flexDirection: "column" }}>

                  <div className="chat-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <div className="chat-header-left" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: "700", fontSize: "14px", color: "#1e293b" }}>실시간 채팅</span>
                      <span className="chat-user-count-badge" style={{ fontSize: "11px", background: "#eaf5ee", color: "#4f8a63", padding: "2px 6px", borderRadius: "10px", fontWeight: "600" }}>{totalUsers}명 참여중</span>
                    </div>
                    {isHost && (
                      <button
                          type="button"
                          onClick={() => setIsCalendarOpen((prev) => !prev)}
                          style={{ background: "#4f8a63", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: "600" }}
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
                              <div className="chat-bubble" style={{ maxWidth: "80%", background: msg.isMe ? "#4f8a63" : "#f1f5f9", color: msg.isMe ? "#fff" : "#1e293b", padding: "8px 12px", borderRadius: "8px", fontSize: "13px" }}>
                                {!msg.isMe && <strong style={{ display: "block", fontSize: "10px", color: "#64748b", marginBottom: "2px" }}>{msg.nickname}</strong>}
                                {msg.text}
                              </div>
                            </div>
                        )
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  <form className="chat-input-form" onSubmit={handleSendMessage} style={{ display: "flex", padding: "10px", borderTop: "1px solid #e2e8f0", background: "#fff" }}>
                    <input
                        type="text"
                        className="chat-text-input"
                        placeholder='메시지 입력...'
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        style={{ flex: 1, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", outline: "none" }}
                    />
                    <button type="submit" className="chat-send-btn" style={{ marginLeft: "6px", background: "#4f8a63", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>전송</button>
                  </form>
                </div>
              </div>

              {isHost && isMapOpen && (
                  <div style={{ width: "100%", height: "260px", background: "#fff", border: "2px solid #ef4444", borderRadius: "16px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <div style={{ background: "#ef4444", color: "#fff", padding: "8px 14px", fontSize: "12px", fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "center" }}>

                      <button type="button" onClick={() => setIsMapModalOpen(true)} style={{ background: "#fff", color: "#ef4444", border: "none", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>🔍 크게 보기</button>
                    </div>
                    <div id="kakao-mini-map" style={{ width: "100%", height: "200px", cursor: "pointer" }} />
                  </div>
              )}

              {isMapModalOpen && (

                  <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: "85vw", height: "85vh", background: "#fff", borderRadius: "16px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,0.3)" }}>

                      <div style={{ background: "#ef4444", color: "#fff", padding: "14px 20px", fontSize: "15px", fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span>🗺️ 볕자리 찾기 - 스터디 카페 & 장소 검색</span>
                          <button
                            type="button"
                            onClick={() => {
                              const targetRoom = searchPlaces.find(p => String(p.id) === String(hoveredCafeId)) || searchPlaces[0];
                              const roomId = targetRoom ? (targetRoom.id || targetRoom.studyRoomId) : "";

                              // 새 탭/새 창으로 열기 (쿼리 스트링으로 장소 ID 전달)
                              window.open(`/study-reservation${roomId ? `?preselectedRoomId=${roomId}` : ""}`, "_blank");
                            }}
                            style={{ background: "#059669", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                          >
                            📅 제휴 스터디 카페 예약 및 결제하기 →
                          </button>
                        </div>
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
                            {searchPlaces.map((place) => {
                              // 🌟 숫자로 인한 타입 불일치를 막기 위해 String으로 변환해서 비교합니다.
                              const isHighlighted = String(hoveredCafeId) === String(place.id);
                              return (
                                <div
                                  key={place.id}
                                  ref={(el) => (cafeElementRefs.current[place.id] = el)}
                                  onClick={() => {
                                    setMapCenter({ lat: place.lat, lng: place.lng });
                                    setHoveredCafeId(place.id);
                                  }}
                                  style={{
                                    background: isHighlighted ? "#e0e7ff" : "#fff",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    border: isHighlighted ? "2px solid #4f46e5" : "1px solid #e5e7eb",
                                    cursor: "pointer",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "6px",
                                    transition: "background 0.2s ease"
                                  }}
                                >
                                  <div style={{ fontWeight: "700", fontSize: "13px", color: "#111827" }}>{place.name}</div>
                                  <div style={{ fontSize: "11px", color: "#4b5563" }}>{place.address}</div>
                                  <div style={{ fontSize: "10px", color: "#9ca3af" }}>📞 {place.phone}</div>
                                  {place.pricePerHour && (
                                    <div style={{ fontSize: "11px", fontWeight: "600", color: "#4f46e5" }}>
                                      시간당 가격: {place.pricePerHour.toLocaleString()}원
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div id="kakao-modal-map" style={{ flex: 1, position: "relative", height: "100%" }} />
                        </div>
                      </div>
                    </div>
                  </div>
              )}

              <MiniCalendar
                  calendarDate={calendarDate}
                  roomSchedules={roomSchedules}
                  isCalendarOpen={isCalendarOpen}
                  moveMiniMonth={moveMiniMonth}
                  setIsCalendarOpen={setIsCalendarOpen}
                  isHost={isHost}
                  hostNickname={roomInfo?.host}
                  onCreateSchedule={handleCreateRoomSchedule}
                  onAddToMyCalendar={handleAddScheduleToMyCalendar}
                  onDeleteSchedule={handleDeleteRoomSchedule}
                  onDeleteMyCopy={handleDeleteMyCopy}
              />
            </div>
        </section>
      </main>
  );
}