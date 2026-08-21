import { useEffect, useState } from "react";
import "./Community.css";
import communityBg from "../../assets/images/community-bg.jpg";

function Community() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <main className="community-page">

      {/* ================================
          HERO
      ================================= */}

      <section className="community-hero">

        <div
          className="community-hero-bg"
          style={{
            backgroundImage: `url(${communityBg})`,
            transform: `scale(1.08) translateY(${scrollY * 0.15}px)`,
          }}
        ></div>

        <div className="community-hero-overlay"></div>

        <div className="community-hero-content">
          <span className="community-eyebrow">
            EASYS COMMUNITY
          </span>

          <h1>커뮤니티</h1>

          <p>
            함께 공부하고 자유롭게 소통하며
            <br />
            지식을 나눠보세요.
          </p>
        </div>

      </section>


      {/* ================================
          COMMUNITY CONTENT
      ================================= */}

      <section className="community-content">

        {/* 커뮤니티 상단 */}

        <div className="community-top">

          <div>
            <span className="section-label">
              DEVELOPER COMMUNITY
            </span>

            <h2>개발자들과 함께 이야기해보세요.</h2>

            <p>
              공부한 내용을 공유하고 궁금한 점을 질문해보세요.
            </p>
          </div>

          <button className="community-write-button">
            + 글 작성하기
          </button>

        </div>


        {/* ================================
            CATEGORY
        ================================= */}

        <div className="community-category">

          <button className="community-category-button active">
            전체
          </button>

          <button className="community-category-button">
            🔥 공부인증
          </button>

          <button className="community-category-button">
            ❓ 질문
          </button>

          <button className="community-category-button">
            🚀 스터디 모집
          </button>

          <button className="community-category-button">
            💡 정보공유
          </button>

          <button className="community-category-button">
            💼 취업
          </button>

        </div>


        {/* ================================
            MAIN LAYOUT
        ================================= */}

        <div className="community-layout">


          {/* ================================
              FEED
          ================================= */}

          <div className="community-feed">

            <div className="feed-heading">

              <div>
                <span className="feed-label">
                  COMMUNITY FEED
                </span>

                <h3>최근 이야기</h3>
              </div>

              <select className="feed-sort">
                <option>최신순</option>
                <option>인기순</option>
                <option>댓글순</option>
              </select>

            </div>


            {/* 게시글 1 */}

            <article className="community-post">

              <div className="post-user">

                <div className="post-avatar">
                  김
                </div>

                <div>
                  <strong>김개발</strong>
                  <span>10분 전 · Spring</span>
                </div>

              </div>

              <span className="post-category question">
                ❓ 질문
              </span>

              <h3>
                Spring Security 로그인 부분이 이해가 안됩니다.
              </h3>

              <p>
                SecurityFilterChain을 공부하고 있는데 인증 과정이
                생각보다 어렵네요. 혹시 쉽게 이해할 수 있는 방법이 있을까요?
              </p>

              <div className="post-tags">
                <span>#Spring</span>
                <span>#SpringSecurity</span>
                <span>#Java</span>
              </div>

              <div className="post-bottom">
                <div>
                  <span>♡ 12</span>
                  <span>💬 8</span>
                  <span>👁 142</span>
                </div>

                <button>
                  자세히 보기 →
                </button>
              </div>

            </article>


            {/* 게시글 2 */}

            <article className="community-post">

              <div className="post-user">

                <div className="post-avatar">
                  이
                </div>

                <div>
                  <strong>이코딩</strong>
                  <span>32분 전 · Java</span>
                </div>

              </div>

              <span className="post-category study">
                🔥 공부인증
              </span>

              <h3>
                오늘도 Java 공부 완료했습니다 🔥
              </h3>

              <p>
                오늘은 객체지향 개념과 상속 부분을 공부했습니다.
                아직 어려운 부분이 많지만 조금씩 이해되는 것 같아요.
              </p>

              <div className="post-tags">
                <span>#오늘도공부완료</span>
                <span>#Java</span>
                <span>#개발공부</span>
              </div>

              <div className="post-bottom">
                <div>
                  <span>♡ 18</span>
                  <span>💬 4</span>
                  <span>👁 89</span>
                </div>

                <button>
                  자세히 보기 →
                </button>
              </div>

            </article>


            {/* 게시글 3 */}

            <article className="community-post">

              <div className="post-user">

                <div className="post-avatar">
                  박
                </div>

                <div>
                  <strong>박스터디</strong>
                  <span>1시간 전 · Study</span>
                </div>

              </div>

              <span className="post-category recruit">
                🚀 스터디 모집
              </span>

              <h3>
                Spring Boot 같이 공부하실 분 모집합니다.
              </h3>

              <p>
                Spring Boot를 처음부터 공부하면서 간단한 프로젝트까지
                같이 만들어보려고 합니다. 초보자분들도 환영합니다.
              </p>

              <div className="post-study-info">

                <span>📅 매주 월요일</span>
                <span>🕐 19:00</span>
                <span>👥 6 / 10명</span>

              </div>

              <div className="post-bottom">

                <div>
                  <span>♡ 21</span>
                  <span>💬 11</span>
                  <span>👁 203</span>
                </div>

                <button>
                  스터디 보기 →
                </button>

              </div>

            </article>


            {/* 게시글 4 */}

            <article className="community-post">

              <div className="post-user">

                <div className="post-avatar">
                  최
                </div>

                <div>
                  <strong>최개발자</strong>
                  <span>2시간 전 · Information</span>
                </div>

              </div>

              <span className="post-category info">
                💡 정보공유
              </span>

              <h3>
                개발 공부할 때 사용하기 좋은 사이트 정리했습니다.
              </h3>

              <p>
                Java, Spring, SQL 공부하면서 자주 사용하는 사이트들을
                정리해봤습니다. 초보자분들에게 도움이 되었으면 좋겠습니다.
              </p>

              <div className="post-tags">
                <span>#개발공부</span>
                <span>#추천사이트</span>
                <span>#Java</span>
              </div>

              <div className="post-bottom">

                <div>
                  <span>♡ 35</span>
                  <span>💬 7</span>
                  <span>👁 316</span>
                </div>

                <button>
                  자세히 보기 →
                </button>

              </div>

            </article>

          </div>


          {/* ================================
              SIDEBAR
          ================================= */}

          <aside className="community-sidebar">


            {/* 공부 인증 */}

            <div className="sidebar-card study-card">

              <span className="sidebar-label">
                🔥 TODAY
              </span>

              <h3>
                오늘도 공부하고 있나요?
              </h3>

              <p>
                오늘 공부한 내용을 기록해보세요.
              </p>

              <button>
                공부 인증하기 →
              </button>

            </div>


            {/* 인기 게시글 */}

            <div className="sidebar-card">

              <span className="sidebar-label">
                TRENDING
              </span>

              <h3>
                지금 인기있는 이야기
              </h3>

              <div className="trending-list">

                <div className="trending-item">
                  <strong>01</strong>
                  <span>Spring Boot 공부 순서가 궁금합니다.</span>
                </div>

                <div className="trending-item">
                  <strong>02</strong>
                  <span>Java 초보자 스터디 모집합니다.</span>
                </div>

                <div className="trending-item">
                  <strong>03</strong>
                  <span>SQLD 준비하시는 분 있나요?</span>
                </div>

                <div className="trending-item">
                  <strong>04</strong>
                  <span>React 프로젝트 같이 만들어봐요.</span>
                </div>

              </div>

            </div>


            {/* 이번 주 공부 */}

            <div className="sidebar-card">

              <span className="sidebar-label">
                MY STUDY
              </span>

              <h3>
                이번 주 공부 기록
              </h3>

              <div className="study-progress">

                <div className="progress-top">
                  <span>공부한 날</span>
                  <strong>4 / 7일</strong>
                </div>

                <div className="progress-bar">
                  <span></span>
                </div>

              </div>

              <p className="progress-message">
                이번 주도 꾸준히 공부하고 있어요! 🔥
              </p>

            </div>


          </aside>

        </div>

      </section>

    </main>
  );
}

export default Community;