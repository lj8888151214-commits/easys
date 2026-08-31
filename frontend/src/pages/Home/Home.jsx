import "./Home.css";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import useHeroVideo from "./Home.js";

function Home() {
  const { currentVideo, heroVideos } = useHeroVideo();
  const current = heroVideos[currentVideo];

  useEffect(() => {
    const revealElements = document.querySelectorAll(".scroll-reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -60px 0px",
      }
    );

    revealElements.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main className="home">

      {/* ================================
          HERO
      ================================= */}

      <section className="hero-section">

        <div className="hero-video-wrapper">
          {heroVideos.map((item, index) => (
            <video
              key={item.number}
              className={`hero-video ${
                index === currentVideo ? "active" : ""
              }`}
              src={item.video}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
          ))}
        </div>

        <div className="hero-video-overlay"></div>

        <div className="hero-content">

          <span className="hero-small-text">
            EASYS STUDY
          </span>

          <h1>
            {current.title.map((text, index) => (
              <span key={index}>
                {text}
                {index !== current.title.length - 1 && <br />}
              </span>
            ))}
          </h1>

          <p>
            {current.description.map((text, index) => (
              <span key={index}>
                {text}
                {index !== current.description.length - 1 && <br />}
              </span>
            ))}
          </p>

          <Link
            to={current.link}
            className="hero-direct-link"
          >
            {current.linkText}
            <span>→</span>
          </Link>

        </div>

        <div className="hero-counter">
          <span>{current.number}</span>
          <span className="counter-line"></span>
          <span>03</span>
        </div>

        <button
          type="button"
          className="hero-scroll-button"
          onClick={() => {
            window.scrollTo({
              top: window.innerHeight,
              behavior: "smooth",
            });
          }}
        >
          <span className="scroll-text">
            SCROLL
          </span>

          <span className="scroll-arrow">
            ↓
          </span>
        </button>

      </section>


      {/* ================================
          INTRO
      ================================= */}

      <section className="content-section intro-section">

        <div className="intro-heading scroll-reveal reveal-center">

          <span className="section-label center-label">
            WHY EASYS
          </span>

          <h2 className="section-title">
            혼자 공부하지 않아도 됩니다.
          </h2>

          <p className="section-subtitle">
            배우고, 질문하고, 함께 성장할 수 있는 공간
          </p>

        </div>


        <div className="card-grid-4">

          <Link
            to="/streaming"
            className="info-card scroll-reveal reveal-left reveal-delay-1"
          >
            <span className="info-card-number">01</span>

            <div className="info-card-icon">
              ▶
            </div>

            <h3>스트리밍</h3>

            <p>
              다양한 개발 강의를 보면서
              필요한 기술을 쉽고 빠르게 배워보세요.
            </p>

            <span className="info-card-link">
              바로가기 →
            </span>
          </Link>


          <Link
            to="/mentor"
            className="info-card scroll-reveal reveal-left reveal-delay-2"
          >
            <span className="info-card-number">02</span>

            <div className="info-card-icon">
              ?
            </div>

            <h3>멘토링</h3>

            <p>
              막히는 부분이 있다면
              경험 많은 멘토에게 질문해보세요.
            </p>

            <span className="info-card-link">
              바로가기 →
            </span>
          </Link>


          <Link
            to="/study"
            className="info-card scroll-reveal reveal-right reveal-delay-3"
          >
            <span className="info-card-number">03</span>

            <div className="info-card-icon">
              +
            </div>

            <h3>스터디</h3>

            <p>
              같은 목표를 가진 사람들과
              함께 공부하고 성장해보세요.
            </p>

            <span className="info-card-link">
              바로가기 →
            </span>
          </Link>


          <Link
            to="/community"
            className="info-card scroll-reveal reveal-right reveal-delay-4"
          >
            <span className="info-card-number">04</span>

            <div className="info-card-icon">
              ◎
            </div>

            <h3>커뮤니티</h3>

            <p>
              공부한 내용을 공유하고
              다른 사람들과 자유롭게 이야기해보세요.
            </p>

            <span className="info-card-link">
              바로가기 →
            </span>
          </Link>

        </div>

      </section>


      {/* ================================
          STREAMING
      ================================= */}

      <section className="content-section streaming-section">

        <div className="section-heading-row scroll-reveal reveal-left">

          <div>
            <span className="section-label">
              STREAMING
            </span>

            <h2 className="section-title-left">
              지금 많이 보고 있는 강의
            </h2>

            <p className="section-description">
              개발 공부에 도움이 되는 강의를 만나보세요.
            </p>
          </div>

          <Link
            to="/streaming"
            className="section-more-link"
          >
            더 알아보기
            <span>→</span>
          </Link>

        </div>


        <div className="streaming-preview-grid">

          <div className="streaming-preview-card scroll-reveal reveal-left reveal-delay-1">

            <div className="streaming-thumbnail java">
              <span>JAVA</span>

              <div className="play-button">
                ▶
              </div>
            </div>

            <div className="streaming-card-content">

              <span>JAVA</span>

              <h3>
                Java 기초부터 시작하기
              </h3>

              <p>
                Java 문법과 객체지향의 기본 개념을
                차근차근 배워보세요.
              </p>

            </div>

          </div>


          <div className="streaming-preview-card scroll-reveal reveal-center reveal-delay-2">

            <div className="streaming-thumbnail spring">
              <span>SPRING</span>

              <div className="play-button">
                ▶
              </div>
            </div>

            <div className="streaming-card-content">

              <span>SPRING BOOT</span>

              <h3>
                Spring Boot 입문
              </h3>

              <p>
                Spring Boot를 이용해
                웹 애플리케이션을 만들어보세요.
              </p>

            </div>

          </div>


          <div className="streaming-preview-card scroll-reveal reveal-right reveal-delay-3">

            <div className="streaming-thumbnail react">
              <span>REACT</span>

              <div className="play-button">
                ▶
              </div>
            </div>

            <div className="streaming-card-content">

              <span>REACT</span>

              <h3>
                React 기초 배우기
              </h3>

              <p>
                컴포넌트부터 상태 관리까지
                React의 기본을 알아보세요.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* ================================
          MENTORING
      ================================= */}

      <section className="content-section mentoring-preview-section">

        <div className="section-heading-row scroll-reveal reveal-right">

          <div>

            <span className="section-label">
              MENTORING
            </span>

            <h2 className="section-title-left">
              혼자 막히셨나요?
            </h2>

            <p className="section-description">
              경험이 있는 멘토와 함께 문제를 해결해보세요.
            </p>

          </div>

          <Link
            to="/mentor"
            className="section-more-link"
          >
            멘토 더 알아보기
            <span>→</span>
          </Link>

        </div>


        <div className="home-mentor-grid">

          <div className="home-mentor-card scroll-reveal reveal-left reveal-delay-1">

            <div className="home-mentor-profile">

              <div className="home-mentor-avatar">
                J
              </div>

              <div>

                <span>JAVA</span>

                <h3>
                  김개발
                </h3>

                <p>
                  Backend Developer
                </p>

              </div>

            </div>

            <div className="home-mentor-rating">
              ★ 4.9
              <span>멘토링 32회</span>
            </div>

            <div className="home-mentor-skills">
              <span>Java</span>
              <span>Spring</span>
              <span>JPA</span>
            </div>

          </div>


          <div className="home-mentor-card scroll-reveal reveal-center reveal-delay-2">

            <div className="home-mentor-profile">

              <div className="home-mentor-avatar">
                P
              </div>

              <div>

                <span>FRONTEND</span>

                <h3>
                  박프론트
                </h3>

                <p>
                  Frontend Developer
                </p>

              </div>

            </div>

            <div className="home-mentor-rating">
              ★ 4.8
              <span>멘토링 27회</span>
            </div>

            <div className="home-mentor-skills">
              <span>React</span>
              <span>JavaScript</span>
              <span>CSS</span>
            </div>

          </div>


          <div className="home-mentor-card scroll-reveal reveal-right reveal-delay-3">

            <div className="home-mentor-profile">

              <div className="home-mentor-avatar">
                L
              </div>

              <div>

                <span>DATABASE</span>

                <h3>
                  이DB
                </h3>

                <p>
                  Backend Developer
                </p>

              </div>

            </div>

            <div className="home-mentor-rating">
              ★ 5.0
              <span>멘토링 41회</span>
            </div>

            <div className="home-mentor-skills">
              <span>MySQL</span>
              <span>SQL</span>
              <span>JPA</span>
            </div>

          </div>

        </div>

      </section>


      {/* ================================
          STUDY
      ================================= */}

      <section className="content-section schedule-section">

        <div className="section-heading-row scroll-reveal reveal-left">

          <div>

            <span className="section-label">
              STUDY SCHEDULE
            </span>

            <h2 className="section-title-left">
              이번 주, 함께 공부해보세요.
            </h2>

            <p className="section-description">
              현재 모집 중인 스터디와 일정을 확인해보세요.
            </p>

          </div>

          <Link
            to="/study"
            className="section-more-link"
          >
            스터디 더 알아보기
            <span>→</span>
          </Link>

        </div>


        <div className="schedule-grid-3">

          <div className="schedule-card scroll-reveal reveal-left reveal-delay-1">

            <div className="schedule-day">
              MON
            </div>

            <span className="schedule-category">
              SPRING BOOT
            </span>

            <h3>
              Spring Boot 스터디
            </h3>

            <p>
              월요일 19:00 · 온라인
            </p>

            <span className="schedule-status">
              모집중
            </span>

          </div>


          <div className="schedule-card scroll-reveal reveal-center reveal-delay-2">

            <div className="schedule-day">
              WED
            </div>

            <span className="schedule-category">
              JAVA
            </span>

            <h3>
              Java 기초 스터디
            </h3>

            <p>
              수요일 19:00 · 온라인
            </p>

            <span className="schedule-status">
              모집중
            </span>

          </div>


          <div className="schedule-card scroll-reveal reveal-right reveal-delay-3">

            <div className="schedule-day">
              FRI
            </div>

            <span className="schedule-category">
              SQL
            </span>

            <h3>
              SQL 스터디
            </h3>

            <p>
              금요일 20:00 · 온라인
            </p>

            <span className="schedule-status">
              모집중
            </span>

          </div>

        </div>

      </section>


      {/* ================================
          COMMUNITY
      ================================= */}

      <section className="content-section community-section">

        <div className="section-heading-row scroll-reveal reveal-right">

          <div>

            <span className="section-label">
              COMMUNITY
            </span>

            <h2 className="section-title-left">
              함께 이야기해보세요.
            </h2>

            <p className="section-description">
              공부하면서 생긴 질문과 이야기를 자유롭게 나눠보세요.
            </p>

          </div>

          <Link
            to="/community"
            className="section-more-link"
          >
            커뮤니티 더 알아보기
            <span>→</span>
          </Link>

        </div>


        <div className="community-tabs scroll-reveal reveal-center">

          <button className="tab active">
            전체
          </button>

          <button className="tab">
            스터디
          </button>

          <button className="tab">
            질문
          </button>

          <button className="tab">
            자유
          </button>

        </div>


        <div className="community-grid-2">

          <div className="community-box scroll-reveal reveal-left reveal-delay-1">

            <div className="community-box-top">

              <span className="community-category study">
                STUDY
              </span>

              <span>
                5분 전
              </span>

            </div>

            <h3>
              오늘도 한 줄 코딩 완료!
            </h3>

            <p>
              오늘 배운 내용을 정리하고
              작은 기능 하나를 완성했습니다.
            </p>

            <div className="community-meta">
              <span>김개발</span>
              <span>♥ 12</span>
              <span>💬 4</span>
            </div>

          </div>


          <div className="community-box scroll-reveal reveal-right reveal-delay-2">

            <div className="community-box-top">

              <span className="community-category question">
                QUESTION
              </span>

              <span>
                12분 전
              </span>

            </div>

            <h3>
              Spring Security 질문있어요.
            </h3>

            <p>
              로그인 이후 인증 처리 과정이
              정확히 어떻게 동작하는지 궁금합니다.
            </p>

            <div className="community-meta">
              <span>이개발</span>
              <span>♥ 8</span>
              <span>💬 7</span>
            </div>

          </div>

        </div>

      </section>


      {/* ================================
          BOTTOM BANNER
      ================================= */}

      <section className="bottom-banner-section">

        <div className="bottom-banner-box scroll-reveal reveal-center">

          <span className="section-label">
            START WITH EASYS
          </span>

          <h2>
            오늘부터 함께 시작하세요.
          </h2>

          <p>
            혼자 고민하지 말고,
            함께 배우고 함께 성장해보세요.
          </p>

          <Link
            to="/study"
            className="hero-btn"
          >
            스터디 시작하기
          </Link>


          <div className="stats-row">

            <div className="stat-item">
              <span>STUDY</span>
              <strong>120+</strong>
            </div>

            <div className="stat-item">
              <span>MENTORS</span>
              <strong>35+</strong>
            </div>

            <div className="stat-item">
              <span>MEMBERS</span>
              <strong>1.2K+</strong>
            </div>

            <div className="stat-item">
              <span>COMMUNITY</span>
              <strong>2.8K+</strong>
            </div>

          </div>

        </div>

      </section>

    </main>
  );
}

export default Home;