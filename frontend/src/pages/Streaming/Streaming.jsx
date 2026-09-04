import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Panorama.css";
import "./Streaming.css";

import streamingBg from "../../assets/images/streaming-bg.jpg";
import mainVideo1 from "../../assets/videos/main_video1.mp4";

import mainVideo4 from "../../assets/videos/main_video4.mp4";
import mainVideo5 from "../../assets/videos/main_video5.mp4";

// 🌟 카테고리별로 서로 다른 비디오를 연결해주는 매핑 함수
const getVideoByCategory = (category) => {
  switch (category) {
    case "SPRING BOOT":
      return mainVideo1;
    case "JAVA":
      return mainVideo4;
    case "FRONTEND":
      return mainVideo5;
    default:
  }
};

export default function Streaming() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  const [currentUser, setCurrentUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomTitle, setRoomTitle] = useState("");
  const [roomCategory, setRoomCategory] = useState("SPRING BOOT");
  const [roomDescription, setRoomDescription] = useState("");

  const [liveStreams, setLiveStreams] = useState([]);
  const videoRefs = useRef([]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const header = document.querySelector(".main-header");
    if (header) header.classList.add("scrolled");
    return () => {
      if (header) header.classList.remove("scrolled");
    };
  }, []);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/member/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const nick = data.nickname || (data.email ? data.email.split("@")[0] : "멤버");
          setCurrentUser(nick);
        }
      } catch (err) {}
    };
    fetchMe();
  }, []);

  const handleOpenCreateModal = () => {
    if (!currentUser) {
      alert("로그인 후 스트리밍 공간을 생성할 수 있습니다.");
      navigate("/login");
      return;
    }
    setIsModalOpen(true);
  };

  // 🌟 방 생성 핸들러 (방 생성자는 무조건 isHost: true 부여)
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomTitle.trim()) {
      alert("방송 제목을 입력해주세요.");
      return;
    }

    const assignedVideo = getVideoByCategory(roomCategory);

    const newStream = {
      video: assignedVideo,
      category: roomCategory,
      title: roomTitle.trim(),
      description: roomDescription.trim() || "함께 소통하며 공부하는 스터디룸입니다.",
      viewers: 1,
      host: currentUser || "게스트",
      screenShare: true,
      isHost: true,
    };

    const backendHost = window.location.hostname;

    try {
      const response = await fetch(`http://${backendHost}:8080/api/streams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStream),
        credentials: "include",
      });

      if (response.ok) {
        const savedData = await response.json();
        setIsModalOpen(false);
        const targetRoomId = savedData?.id || Date.now();

        navigate(`/streaming/cam?roomId=${targetRoomId}`, {
          state: { roomInfo: savedData, isHost: true }
        });
      } else {
        alert("방 생성에 실패했습니다.");
      }
    } catch (err) {
      alert("서버와 통신 중 오류가 발생했습니다.");
    }
  };

  // 🌟 실시간 방 목록 폴링 + 웹소켓 수신 연동
  useEffect(() => {
    const backendHost = window.location.hostname;

    const fetchActiveStreams = async () => {
      try {
        const response = await fetch(`http://${backendHost}:8080/api/streams`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) setLiveStreams(data);
        }
      } catch (error) {}
    };

    fetchActiveStreams();
    const interval = setInterval(fetchActiveStreams, 3000);

    // 웹소켓을 통한 실시간 방 생성/삭제 갱신 리스너
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${backendHost}:8080/signal?roomId=lobby-stream-list`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "streamList") {
          setLiveStreams(Array.isArray(data.streams) ? data.streams : []);
        }
      } catch (e) {}
    };

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, []);

  return (
    <main className="streaming-page">
      <section className="streaming-hero">
        <div
          className="streaming-hero-bg"
          style={{
            backgroundImage: `url(${streamingBg})`,
            transform: `scale(1.08) translateY(${scrollY * 0.15}px)`,
          }}
        />
        <div className="streaming-hero-overlay" />
        <div className="streaming-hero-content">
          <span className="streaming-eyebrow">EASYS STREAMING</span>
          <h1>스트리밍</h1>
          <p>실시간으로 배우고 소통하며<br />함께 성장해보세요.</p>
        </div>
      </section>

      {/* 실시간 라이브 파노라마 섹션 */}
      <section className="streaming-content">
        <section className="stream-list-section panorama-section">
          <div className="stream-start-content">
            <div className="stream-section-heading">
              <div>
                <span className="section-label">LIVE PANORAMA</span>
                <h2>실시간 라이브 파노라마</h2>
              </div>
            </div>

            <div className="stream-panorama-container">
              <div className="stream-panorama-track">
                {liveStreams.length === 0 ? (
                  <div className="panorama-empty-card">
                    <p>현재 개설된 라이브 방송이 없습니다. 첫 방송을 시작해보세요!</p>
                  </div>
                ) : (
                  liveStreams.map((stream, index) => (
                    <article className="stream-card panorama-card" key={`stream-${stream.id}-${index}`}>
                      <div className="stream-thumbnail">
                        <video
                          ref={(element) => { videoRefs.current[index] = element; }}
                          className="stream-video"
                          src={stream.video || getVideoByCategory(stream.category)}
                          muted
                          autoPlay
                          loop
                          playsInline
                        />
                        <div className="stream-video-overlay" />

                    <span className="stream-number-badge" style={{ fontSize: "14px", padding: "4px 10px", borderRadius: "6px", maxWidth: "80%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {stream.title}
                    </span>
                    <span className="stream-live">● LIVE</span>
                  </div>

                  <div className="stream-card-content">
                    <span className="stream-category">{stream.category}</span>

                    <p>{stream.description}</p>
                    <span className="stream-host">{stream.host}</span>

                        <div className="stream-card-bottom">
                          <span>👤 {stream.viewers || 1}명 시청 중</span>
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/streaming/cam?roomId=${stream.id}`, {
                                state: { roomInfo: stream, isHost: false }
                              })
                            }
                          >
                            시청하기 →
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </section>

      {/* 방송 시작 CTA 섹션 (파노라마와 가로 폭 동일하게 맞춤) */}
      <section className="streaming-content">
        <section className="stream-start-section" style={{ maxWidth: "1400px", margin: "40px auto", boxSizing: "border-box" }}>
          <div className="stream-start-content">
            <span className="section-label">CREATE YOUR STREAM</span>
            <h2>직접 방송을<br />시작해 보세요.</h2>
            <button type="button" className="stream-start-button" onClick={handleOpenCreateModal}>
              방송 시작하기 →
            </button>
          </div>
        </section>
      </section>

      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "420px", background: "#fff", borderRadius: "16px", padding: "28px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>🚀 나만의 스트리밍 공간 만들기</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleCreateRoom} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input type="text" placeholder="방송 제목" value={roomTitle} onChange={(e) => setRoomTitle(e.target.value)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }} required />
              <select value={roomCategory} onChange={(e) => setRoomCategory(e.target.value)} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}>
                <option value="SPRING BOOT">SPRING BOOT</option>
                <option value="JAVA">JAVA</option>
                <option value="FRONTEND">FRONTEND</option>
              </select>
              <textarea placeholder="방송 설명" value={roomDescription} onChange={(e) => setRoomDescription(e.target.value)} rows={2} style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px", resize: "none" }} />

              <button type="submit" style={{ padding: "12px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", marginTop: "8px" }}>방송 생성 및 입장 →</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}