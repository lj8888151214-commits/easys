import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Streaming.css";

import streamingBg from "../../assets/images/streaming-bg.jpg";
import stream1 from "../../assets/videos/stream1.mp4";
import stream2 from "../../assets/videos/stream2.mp4";
import stream3 from "../../assets/videos/stream3.mp4";

const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ],
};

function Streaming() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  // 실시간 라이브 스트림 상태
  const [liveStream, setLiveStream] = useState(null);
  const bannerVideoRef = useRef(null);

  const videoRefs = useRef([]);
  const socketRef = useRef(null);
  const myIdRef = useRef("");
  const pcsRef = useRef({});
  const candidateQueueRef = useRef({});

  // 스크롤 이벤트
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 1. CamPage와 동일한 시그널링 서버 프로토콜로 연결
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = `${window.location.hostname}:8080`; // 👈 CamPage와 동일하게 8080 포트 직접 연결
    const ws = new WebSocket(`${protocol}//${host}/signal`);
    socketRef.current = ws;

    const createPeerConnection = (targetPeerId) => {
      if (pcsRef.current[targetPeerId]) {
        pcsRef.current[targetPeerId].close();
      }

      const pc = new RTCPeerConnection(rtcConfig);
      pcsRef.current[targetPeerId] = pc;
      candidateQueueRef.current[targetPeerId] = [];

      // 뷰어 수신 전용 트랜시버
      pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });

      pc.ontrack = (event) => {
        console.log("🎥 [WebRTC] 메인 배너 스트림 수신 성공:", event.streams);
        if (event.streams && event.streams[0]) {
          setLiveStream(event.streams[0]);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "candidate",
              senderId: myIdRef.current,
              target: targetPeerId,
              candidate: event.candidate,
            })
          );
        }
      };

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

    ws.onopen = () => {
      console.log(">>> [Streaming Banner] 시그널링 서버 연결 완료!");
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "init") {
          myIdRef.current = data.myId;
        } else if (data.type === "userList") {
          const others = (data.users || []).filter((id) => id !== myIdRef.current);

          // 방에 있는 참가자들에게 실시간 화면 요청
          setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
              others.forEach((targetId) => {
                ws.send(
                  JSON.stringify({
                    type: "request-stream",
                    senderId: myIdRef.current,
                    target: targetId,
                  })
                );
              });
            }
          }, 300);
        } else if (data.type === "offer") {
          if (data.target && data.target !== myIdRef.current) return;

          const pc = createPeerConnection(data.senderId);
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          await processQueuedCandidates(data.senderId, pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          ws.send(
            JSON.stringify({
              type: "answer",
              senderId: myIdRef.current,
              target: data.senderId,
              answer: answer,
            })
          );
        } else if (data.type === "candidate") {
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
        } else if (data.type === "stream-stopped") {
          if (pcsRef.current[data.senderId]) {
            pcsRef.current[data.senderId].close();
            delete pcsRef.current[data.senderId];
          }
          setLiveStream(null);
        }
      } catch (e) {
        console.error("배너 시그널링 에러:", e);
      }
    };

    return () => {
      Object.values(pcsRef.current).forEach((pc) => pc.close());
      ws.close();
    };
  }, []);

  // 비디오 태그에 실시간 스트림 연결
  useEffect(() => {
    if (bannerVideoRef.current && liveStream) {
      bannerVideoRef.current.srcObject = liveStream;
    }
  }, [liveStream]);

  // 카드 영상 자동 재생
  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (!video) return;
      video.muted = true;
      const playVideo = async () => {
        try {
          await video.play();
        } catch (error) {
          console.log("영상 자동 재생 대기:", error);
        }
      };

      if (video.readyState >= 2) {
        playVideo();
      } else {
        video.addEventListener("canplay", playVideo, { once: true });
      }
    });
  }, []);

  const liveStreams = [
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
      video: stream2,
      category: "JAVA",
      title: "Java 객체지향 기초",
      description: "Java 객체지향 개념을 쉽게 알아봅니다.",
      viewers: 12,
      host: "Java 공부방",
      screenShare: true,
    },
    {
      id: 3,
      video: stream3,
      category: "FRONTEND",
      title: "React로 게시판 만들기",
      description: "React를 이용해서 게시판을 만들어봅니다.",
      viewers: 18,
      host: "프론트엔드 연구소",
      screenShare: false,
    },
  ];

  const upcomingStreams = [
    {
      id: 1,
      month: "AUG",
      date: "24",
      category: "SPRING BOOT",
      title: "Spring Security 로그인 구현",
      time: "월요일 · 19:00",
    },
    {
      id: 2,
      month: "AUG",
      date: "27",
      category: "DATABASE",
      title: "MySQL과 JPA 함께 공부하기",
      time: "목요일 · 20:00",
    },
  ];

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
          <p>
            실시간으로 배우고 소통하며
            <br />
            함께 성장해보세요.
          </p>
        </div>
      </section>

      {/* CONTENT */}
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
            <button
              type="button"
              className="stream-start-button"
              onClick={() => navigate("/streaming/cam")}
            >
              방송 시작하기 →
            </button>
          </div>

          {/* 👈 우측 화면 박스: 실시간 방송 중이면 화면을 즉시 렌더링 */}
          <div
            className="stream-start-visual"
            style={{
              position: "relative",
              overflow: "hidden",
              cursor: liveStream ? "pointer" : "default",
              backgroundColor: "#1e2e24",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => liveStream && navigate("/streaming/cam")}
          >
            {liveStream ? (
              <>
                <video
                  ref={bannerVideoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={(e) => {
                    e.target.play().catch((err) => console.log("재생 대기:", err));
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    borderRadius: "inherit",
                    backgroundColor: "#000",
                  }}
                />
                <div
                  className="live-badge"
                  style={{
                    position: "absolute",
                    top: "16px",
                    left: "16px",
                    zIndex: 10,
                  }}
                >
                  <span />
                  LIVE ON AIR
                </div>
              </>
            ) : (
              <>
                <div className="live-badge">
                  <span />
                  LIVE
                </div>
                <div className="stream-visual-circle">▶</div>
                <strong>나만의 방송을 시작하세요</strong>
                <span>Study · Coding · Knowledge</span>
              </>
            )}
          </div>
        </section>

        {/* 스트리밍 기능 소개 */}
        <section className="stream-feature-section">
          <div className="stream-section-heading">
            <div>
              <span className="section-label">STUDY TOGETHER</span>
              <h2>단순한 방송이 아니에요.</h2>
            </div>
          </div>
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

        {/* 현재 방송 */}
        <section className="stream-list-section">
          <div className="stream-section-heading">
            <div>
              <span className="section-label">LIVE NOW</span>
              <h2>지금 방송 중</h2>
            </div>
            <a href="/streaming" className="stream-more-link">
              전체보기 →
            </a>
          </div>

          <div className="stream-grid">
            {liveStreams.map((stream, index) => (
              <article className="stream-card" key={stream.id}>
                <div className="stream-thumbnail">
                  <video
                    ref={(element) => {
                      videoRefs.current[index] = element;
                    }}
                    className="stream-video"
                    src={stream.video}
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
                    <span>👤 {stream.viewers}명 시청 중</span>
                    <button
                      type="button"
                      onClick={() => navigate("/streaming/cam")}
                    >
                      시청하기 →
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 예정된 방송 */}
        <section className="stream-upcoming-section">
          <div className="stream-section-heading">
            <div>
              <span className="section-label">COMING SOON</span>
              <h2>예정된 방송</h2>
            </div>
          </div>
          <div className="upcoming-list">
            {upcomingStreams.map((stream) => (
              <div className="upcoming-item" key={stream.id}>
                <div className="upcoming-date">
                  {stream.month}
                  <strong>{stream.date}</strong>
                </div>
                <div className="upcoming-info">
                  <span>{stream.category}</span>
                  <h3>{stream.title}</h3>
                  <p>{stream.time}</p>
                </div>
                <button type="button">알림 받기</button>
              </div>
            ))}
          </div>
        </section>

        {/* 하단 배너 */}
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
          <button type="button" onClick={() => navigate("/streaming/cam")}>
            방송 둘러보기 →
          </button>
        </section>
      </section>
    </main>
  );
}

export default Streaming;