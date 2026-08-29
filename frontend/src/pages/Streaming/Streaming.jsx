import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./BroadCast.css"; // 방송 시작 및 히어로 섹션 스타일
import "./Panorama.css";   // 현재 방송 파노라마 슬라이드 섹션 스타일

import streamingBg from "../../assets/images/streaming-bg.jpg";
import stream1 from "../../assets/videos/stream1.mp4";
import stream2 from "../../assets/videos/stream2.mp4";
import stream3 from "../../assets/videos/stream3.mp4";

function Streaming() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  // 🌟 기본 하드코딩 방송 목록 + 서버 실시간 방송 목록을 담을 상태
  const [liveStreams, setLiveStreams] = useState([
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
  ]);

  const videoRefs = useRef([]);

  // 스크롤 이벤트
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

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
  useEffect(() => {
    const fetchActiveStreams = async () => {
      try {
        const response = await fetch("/api/streams", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setLiveStreams(data);
          }
        }
      } catch (error) {
        // API가 아직 없다면 기존 기본 목록 유지
      }
    };

    fetchActiveStreams();
    const interval = setInterval(fetchActiveStreams, 5000);
    return () => clearInterval(interval);
  }, []);

  // 비디오 자동 재생 처리
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
  }, [liveStreams]);

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

      {/* CONTENT 메인 컨테이너 */}
      <section className="streaming-content">
        {/* 방송 시작 */}
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

      {/* 현재 방송 목록 (파노라마 가로 스크롤 영역) */}
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
            <article className="stream-card" key={`stream-1-${stream.id}`}>
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
        </div>
      </section>

      {/* 스트리밍 기능 소개 및 하단 컨텐츠 */}
      <section className="streaming-content">
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