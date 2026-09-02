import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./BroadCast.css";
import "./Panorama.css";
import "./Streaming.css";

import streamingBg from "../../assets/images/streaming-bg.jpg";
import stream1 from "../../assets/videos/stream1.mp4";

export default function Streaming() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  const [currentUser, setCurrentUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomTitle, setRoomTitle] = useState("");
  const [roomCategory, setRoomCategory] = useState("SPRING BOOT");
  const [roomDescription, setRoomDescription] = useState("");

  const [liveStreams, setLiveStreams] = useState(() => {
    const saved = localStorage.getItem("myCreatedStreams");
    const initialDefault = [
      {
        id: 1,
        video: stream1,
        category: "SPRING BOOT",
        title: "Spring Boot 처음부터 시작하기",
        description: "Spring Boot를 함께 공부해봅니다.",
        viewers: 24,
        host: "개발하는 홍길동",
        screenShare: true,
      },
      {
        id: 2,
        video: stream1,
        category: "JAVA",
        title: "Java 객체지향 기초",
        description: "Java 객체지향 개념을 쉽게 알아봅니다.",
        viewers: 12,
        host: "Java 공부방",
        screenShare: true,
      },
      {
        id: 3,
        video: stream1,
        category: "FRONTEND",
        title: "React로 게시판 만들기",
        description: "React를 이용해서 게시판을 만들어봅니다.",
        viewers: 18,
        host: "프론트엔드 연구소",
        screenShare: false,
      },
    ];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return [...parsed, ...initialDefault];
      } catch (e) {
        return initialDefault;
      }
    }
    return initialDefault;
  });

  const videoRefs = useRef([]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
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

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomTitle.trim()) {
      alert("방송 제목을 입력해주세요.");
      return;
    }

    const roomId = Date.now();
    const newStream = {
      id: roomId,
      video: stream1,
      category: roomCategory,
      title: roomTitle.trim(),
      description: roomDescription.trim() || "함께 소통하며 공부하는 스터디룸입니다.",
      viewers: 1,
      host: currentUser || "게스트",
      screenShare: true,
    };

    const backendHost = window.location.hostname;

    try {
      await fetch(`http://${backendHost}:8080/api/streams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStream),
        credentials: "include",
      });
    } catch (err) {
      console.log("서버 전송 실패, 로컬 우선 반영");
    }

    setLiveStreams((prev) => {
      const updated = [newStream, ...prev];
      const userCustoms = updated.filter(item => item.id > 3);
      localStorage.setItem("myCreatedStreams", JSON.stringify(userCustoms));
      return updated;
    });

    setIsModalOpen(false);
    navigate(`/streaming/cam?roomId=${roomId}`, { state: { roomInfo: newStream } });
  };

  useEffect(() => {
    const fetchActiveStreams = async () => {
      const backendHost = window.location.hostname;
      try {
        const response = await fetch(`http://${backendHost}:8080/api/streams`, { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setLiveStreams((prev) => {
              const defaultItems = prev.filter(item => item.id <= 3);
              return [...data, ...defaultItems];
            });
          }
        }
      } catch (error) {}
    };

    fetchActiveStreams();
    const interval = setInterval(fetchActiveStreams, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (!video) return;
      video.muted = true;
      const playVideo = async () => {
        try { await video.play(); } catch (error) {}
      };
      if (video.readyState >= 2) {
        playVideo();
      } else {
        video.addEventListener("canplay", playVideo, { once: true });
      }
    });
  }, [liveStreams]);

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
          <p>
            실시간으로 배우고 소통하며
            <br />
            함께 성장해보세요.
          </p>
        </div>
      </section>

      <section className="stream-list-section panorama-section">
        <div className="stream-section-heading">
          <div>
            <span className="section-label">LIVE PANORAMA</span>
            <h2>실시간 라이브 파노라마</h2>
          </div>
          <div className="panorama-nav-buttons">
            <button
              type="button"
              onClick={() => {
                const container = document.querySelector(".stream-panorama-track");
                if (container) container.scrollBy({ left: -400, behavior: "smooth" });
              }}
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => {
                const container = document.querySelector(".stream-panorama-track");
                if (container) container.scrollBy({ left: 400, behavior: "smooth" });
              }}
            >
              →
            </button>
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
                      ref={(element) => {
                        videoRefs.current[index] = element;
                      }}
                      className="stream-video"
                      src={stream.video || stream1}
                      muted
                      autoPlay
                      loop
                      playsInline
                      preload="auto"
                    />
                    <div className="stream-video-overlay" />
                    <span className="stream-number-badge">{index + 1}</span>
                    <span className="stream-live">● LIVE</span>
                    {stream.screenShare && <span className="screen-share-badge">🖥 화면공유</span>}
                    <span className="stream-play">▶</span>
                  </div>

                  <div className="stream-card-content">
                    <span className="stream-category">{stream.category}</span>
                    <h3>{stream.title}</h3>
                    <p>{stream.description}</p>
                    <span className="stream-host">{stream.host}</span>

                    <div className="stream-card-bottom">
                      <span>👤 {stream.viewers || 1}명 시청 중</span>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/streaming/cam?roomId=${stream.id}`, { state: { roomInfo: stream } })
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
      </section>

      <section className="streaming-content">
        <section className="stream-start-section">
          <div className="stream-start-content">
            <span className="section-label">CREATE YOUR STREAM</span>
            <h2>
              직접 방송을
              <br />
              시작해 보세요.
            </h2>
            <p>
              내가 알고 있는 지식을 공유하고
              <br />
              사람들과 실시간으로 소통해보세요.
            </p>
            <button type="button" className="stream-start-button" onClick={handleOpenCreateModal}>
              방송 시작하기 →
            </button>
          </div>

          <div className="stream-start-visual">
            <div className="live-badge">
              <span />
              LIVE
            </div>
            <div className="stream-visual-circle">▶</div>
            <strong>나만의 방송을 시작하세요</strong>
            <span>Study · Coding · Knowledge</span>
          </div>
        </section>
      </section>

      <section className="streaming-content">
        <section className="stream-feature-section">
          <div className="stream-feature-grid">
            <div className="stream-feature-card">
              <div className="stream-feature-icon">🎥</div>
              <h3>실시간 방송</h3>
              <p>개발 공부와 프로젝트 과정을 실시간으로 공유할 수 있어요.</p>
            </div>

            <div className="stream-feature-card">
              <div className="stream-feature-icon">🖥</div>
              <h3>화면 공유</h3>
              <p>코딩 화면을 공유하면서 함께 문제를 해결할 수 있어요.</p>
              <span className="feature-tag">SCREEN SHARE</span>
            </div>

            <div className="stream-feature-card">
              <div className="stream-feature-icon">💬</div>
              <h3>실시간 채팅</h3>
              <p>방송을 보면서 질문하고 다른 사람들과 자유롭게 소통해보세요.</p>
            </div>
          </div>
        </section>

        <section className="stream-bottom-banner">
          <span className="section-label">EASYS LIVE</span>
          <h2>
            같이 보고,
            <br />
            같이 만들어보세요.
          </h2>
          <p>
            코딩 화면을 공유하고 실시간으로 질문하면서
            <br />
            혼자 공부할 때보다 더 빠르게 성장해보세요.
          </p>
          <button type="button" onClick={handleOpenCreateModal}>
            방송 시작하기 →
          </button>
        </section>
      </section>

      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "420px", background: "#fff", borderRadius: "16px", padding: "28px", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 12px 32px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#111827" }}>🚀 나만의 스트리밍 공간 만들기</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>

            <form onSubmit={handleCreateRoom} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>방송 제목</label>
                <input
                  type="text"
                  placeholder="예: 스프링 부트 프로젝트 같이 해요!"
                  value={roomTitle}
                  onChange={(e) => setRoomTitle(e.target.value)}
                  style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px" }}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>기술 카테고리</label>
                <select
                  value={roomCategory}
                  onChange={(e) => setRoomCategory(e.target.value)}
                  style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", background: "#fff" }}
                >
                  <option value="SPRING BOOT">SPRING BOOT</option>
                  <option value="JAVA">JAVA</option>
                  <option value="FRONTEND">FRONTEND</option>
                  <option value="DATABASE">DATABASE</option>
                  <option value="DEVOPS">DEVOPS</option>
                  <option value="ALGORITHM">ALGORITHM</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>방송 설명</label>
                <textarea
                  placeholder="방에 대한 간단한 설명을 적어주세요."
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  rows={3}
                  style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, padding: "12px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: "12px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                >
                  방송 생성 및 입장 →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}