import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";



import streamingBg from "../../assets/images/streaming-bg.jpg";
import stream1 from "../../assets/videos/stream1.mp4";

function Streaming() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);


  const [liveStreams, setLiveStreams] = useState(() => {
    ];
  const videoRefs = useRef([]);

  // 스크롤 이벤트
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 🌟 CamPage 진입 시 상단 헤더 글씨가 잘 보이도록 .scrolled 강제 적용
  useEffect(() => {
    const header = document.querySelector(".main-header");
    if (header) {
      header.classList.add("scrolled");
    }
    return () => {
      if (header) {
        header.classList.remove("scrolled");
      }
    };
  }, []);

  // 🌟 백엔드 서버로부터 현재 송출 중인 실시간 방송 목록 불러오기 (5초 주기 폴링)
  // 단일 선언된 방 생성 핸들러
      isHost: true, // 생성자는 무조건 호스트
           await fetch(`http://${backendHost}:8080/api/streams`, {

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
           console.log("서버 전송 실패, 로컬 우선 반영");
      // 백엔드 목록 조회 useEffect 수정
  useEffect(() => {

    const fetchActiveStreams = async () => {
      try {
            const response = await fetch(`http://${backendHost}:8080/api/streams`, { credentials: "include" });
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) setLiveStreams(data);
                setLiveStreams((prev) => {
              }
      } catch (error) {
        // API가 아직 없다면 기존 기본 목록 유지
      }
    };

    fetchActiveStreams();
    const interval = setInterval(fetchActiveStreams, 3000);

    // 웹소켓을 통한 실시간 방 생성/삭제 갱신 리스너
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${backendHost}:8080/signal?roomId=lobby-stream-list`;
    const ws = new WebSocket(wsUrl);

  // 비디오 자동 재생 처리

    ws.onmessage = (event) => {
        try {
        try { await video.play(); } catch (error) {}
        } catch (error) {
          console.log("영상 자동 재생 대기:", error);
        }
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
      {/* HERO */}
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
      {/* CONTENT 메인 컨테이너 */}
        {/* 방송 시작 */}
          <p>실시간으로 배우고 소통하며<br />함께 성장해보세요.</p>
              onClick={handleOpenCreateModal}
        </div>
      </section>

      {/* 현재 방송 목록 (파노라마 가로 스크롤 영역) */}
      <section className="stream-list-section panorama-section">
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
            <article className="stream-card" key={`stream-${stream.id}`}>
                  <div className="stream-thumbnail">
                    <video
                      ref={(element) => { videoRefs.current[index] = element; }}
                      className="stream-video"
                      src={stream.video || stream1}
                      muted
                      autoPlay
                      loop
                      playsInline
                    />
                    <div className="stream-video-overlay" />
                    <span className="stream-number-badge">{index + 1}</span>
                    <span className="stream-live">● LIVE</span>
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

          {liveStreams.map((stream, index) => (
            <article className="stream-card" key={`stream-2-${stream.id}`}>
              <div className="stream-thumbnail">
                <video
                  className="stream-video"
                  src={stream.video || stream1}
                  muted
                  autoPlay
                  loop
                  playsInline
                  preload="auto"
                />
                <div className="stream-video-overlay" />
                <span className="stream-live">● LIVE</span>
                {stream.screenShare && (
                  <span className="screen-share-badge">🖥 화면공유</span>
                )}
                <span className="stream-play">▶</span>
              </div>

              <div className="stream-card-content">
                <span className="stream-category">{stream.category}</span>
                <h3>{stream.title}</h3>
                <p>{stream.description}</p>
                <span className="stream-host">{stream.host}</span>

                <div className="stream-card-bottom">
                  <span>👤 {stream.viewers || 1}명 시청 중</span>
                  <button type="button" onClick={() => navigate("/streaming/cam")}>
                    시청하기 →
                  </button>
                </div>
              </div>
            </article>
          ))}
            )}
      {/* 스트리밍 기능 소개 및 하단 컨텐츠 */}
          </div>
        </div>
      </section>

        {/* 예정된 방송 */}
      <section className="streaming-content">
        <section className="stream-start-section">
        {/* 하단 배너 */}
          <div className="stream-start-content">
            <span className="section-label">CREATE YOUR STREAM</span>
            <h2>직접 방송을<br />시작해 보세요.</h2>
          <button type="button" onClick={handleOpenCreateModal}>
            방송 둘러보기 →
            </button>
          </div>
        </section>
      </section>
          <div style={{ width: "420px", background: "#fff", borderRadius: "16px", padding: "28px", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 12px 32px rgba(0,0,0,0.2)" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#111827" }}>🚀 나만의 스트리밍 공간 만들기</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#6b7280" }}>✕</button>
            <form onSubmit={handleCreateRoom} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>방송 제목</label>
              </div>
                  style={{ flex: 1, padding: "12px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
    </main>
  );
}

export default Streaming;