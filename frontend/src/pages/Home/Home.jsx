import "./Home.css";
import useHeroVideo from "./Home.js";

function Home() {
  const { currentVideo, heroVideos } = useHeroVideo();
  const current = heroVideos[currentVideo];

  return (
    <main className="home">
      <section className="hero-section">
        <div className="hero-video-wrapper">
          {heroVideos.map((item, index) => (
            <video
              key={item.video}
              className={`hero-video ${index === currentVideo ? "active" : ""}`}
              src={item.video}
              muted
              autoPlay
              loop
              playsInline
              preload="auto"
            />
          ))}
        </div>

        <div className="hero-video-overlay"></div>

        <div className="hero-content">
          <span className="hero-small-text">EGIS STUDY</span>

          <h1>
            {current.title[0]}
            <br />
            {current.title[1]}
          </h1>

          <p>
            {current.description[0]}
            <br />
            {current.description[1]}
          </p>

          <a href={current.link} className="hero-direct-link">
            {current.linkText}
            <span>→</span>
          </a>
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
            document.getElementById("intro")?.scrollIntoView({
              behavior: "smooth",
            });
          }}
          aria-label="아래로 스크롤"
        >
          <span className="scroll-text">SCROLL</span>
          <span className="scroll-arrow">↓</span>
        </button>
      </section>

      <section className="content-section intro-section" id="intro">
        <h2 className="section-title">개발 공부가 어렵나요?</h2>
        <p className="section-subtitle">혼자 고민하지 말고, 함께 시작해보세요.</p>

        <div className="card-grid-4">
          <div className="info-card">
            <h3>💻 개발 공부</h3>
            <p>혼자 공부하기 어려운 개발을 함께 시작해보세요.</p>
          </div>

          <div className="info-card">
            <h3>👨‍💻 멘토링</h3>
            <p>막히는 부분을 멘토에게 질문해보세요.</p>
          </div>

          <div className="info-card">
            <h3>📚 스터디</h3>
            <p>같은 목표를 가진 사람들과 함께 공부해보세요.</p>
          </div>

          <div className="info-card">
            <h3>💬 커뮤니티</h3>
            <p>공부한 내용을 공유하고 질문해보세요.</p>
          </div>
        </div>
      </section>

      <section className="content-section qna-section">
        <h2 className="section-title">혼자서 공부하셨나요?</h2>

        <div className="qna-container">
          <div className="speech-bubble student">"이거 무서워요 ㅠㅠ"</div>
          <div className="speech-bubble mentor">"멘토 : 너무 쉬워요!"</div>
        </div>

        <div className="center-btn-area">
          <a href="/mentor" className="sub-action-btn">
            멘토 찾아보기 →
          </a>
        </div>
      </section>

      <section className="content-section schedule-section">
        <h2 className="section-title">이번 주 스터디 일정</h2>
        <p className="section-subtitle">
          📅 일정 확인 후 관심 있는 스터디를 신청하세요.
        </p>

        <div className="schedule-grid-3">
          <div className="schedule-card">
            <h3>Spring Boot 스터디</h3>
            <p>월요일 19:00</p>
          </div>

          <div className="schedule-card">
            <h3>Java 기초 스터디</h3>
            <p>수요일 19:00</p>
          </div>

          <div className="schedule-card">
            <h3>SQL 스터디</h3>
            <p>금요일 20:00</p>
          </div>
        </div>
      </section>

      <section className="content-section community-section">
        <h2 className="section-title">커뮤니티</h2>

        <div className="community-tabs">
          <span className="tab active">전체</span>
          <span className="tab">🔥 공부인증</span>
          <span className="tab">❓ 질문</span>
          <span className="tab">🚀 스터디 모집</span>
        </div>

        <div className="community-grid-2">
          <div className="community-box">
            <h3>🔥 공부 인증</h3>
            <p>오늘도 한 줄 코딩 완료!</p>
          </div>

          <div className="community-box">
            <h3>❓ 개발 질문</h3>
            <p>Spring Security 질문있어요!</p>
          </div>
        </div>
      </section>

      <section className="bottom-banner-section">
        <div className="bottom-banner-box">
          <h2>이제 같이 공부해 볼까요?</h2>

          <p>
            혼자 고민하지 말고,
            <br />
            함께 시작해보세요.
          </p>

          <a href="/study" className="hero-btn">
            스터디 바로가기 →
          </a>

          <div className="stats-row">
            <div className="stat-item">
              <span>누적 스터디</span>
              <strong>28</strong>
            </div>

            <div className="stat-item">
              <span>총 멘토링</span>
              <strong>45</strong>
            </div>

            <div className="stat-item">
              <span>완료된 스터디</span>
              <strong>66</strong>
            </div>

            <div className="stat-item">
              <span>가입 회원 수</span>
              <strong>12,526</strong>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;