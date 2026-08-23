import { useEffect, useState } from "react";
import "./Calendar.css";
import calendarBg from "../../assets/images/calendar-bg.jpg";

function Calendar() {
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
    <main className="calendar-page">
      {/* 캘린더 상단 */}
      <section className="calendar-hero">
        <div
          className="calendar-hero-bg"
          style={{
            backgroundImage: `url(${calendarBg})`,
            transform: `scale(1.08) translateY(${scrollY * 0.35}px)`,
          }}
        ></div>

        <div className="calendar-hero-overlay"></div>

        <div className="calendar-hero-content">
          <span className="calendar-eyebrow">EASYS CALENDAR</span>
          <h1>캘린더</h1>
          <p>
            나의 일정과 모임 일정을
            <br />
            한 곳에서 관리해보세요.
          </p>
        </div>
      </section>

      {/* 캘린더 내용 */}
      <section className="calendar-content">
        <div className="calendar-tabs">
          <button className="calendar-tab active">나의 캘린더</button>
          <button className="calendar-tab">모임 캘린더</button>
        </div>

        <div className="calendar-header">
          <div className="calendar-month">
            <button className="month-arrow">←</button>
            <h2>2026년 8월</h2>
            <button className="month-arrow">→</button>
          </div>

          <button className="today-button">오늘</button>
        </div>

        {/* 달력 */}
        <div className="calendar-box">
          <div className="calendar-week">
            <span>일</span>
            <span>월</span>
            <span>화</span>
            <span>수</span>
            <span>목</span>
            <span>금</span>
            <span>토</span>
          </div>

          <div className="calendar-grid">
            {Array.from({ length: 35 }, (_, index) => (
              <div
                className={`calendar-day ${index === 19 ? "today" : ""}`}
                key={index}
              >
                <span className="day-number">
                  {index < 6 ? "" : index - 5}
                </span>

                {index === 20 && (
                  <div className="calendar-event personal">개인 공부</div>
                )}

                {index === 22 && (
                  <div className="calendar-event group">Spring Boot</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 오늘의 일정 */}
        <section className="schedule-section">
          <div className="section-heading">
            <div>
              <span className="section-label">TODAY</span>
              <h2>오늘의 일정</h2>
            </div>

            <button className="add-schedule-button">+ 일정 추가</button>
          </div>

          <div className="schedule-list">
            <div className="schedule-item">
              <div className="schedule-time">09:00</div>
              <div className="schedule-color personal-color"></div>

              <div className="schedule-info">
                <strong>개인 공부</strong>
                <span>Java / Spring Boot 공부</span>
              </div>
            </div>

            <div className="schedule-item">
              <div className="schedule-time">19:00</div>
              <div className="schedule-color group-color"></div>

              <div className="schedule-info">
                <strong>Spring Boot 스터디</strong>
                <span>온라인 스터디 모임</span>
              </div>
            </div>
          </div>
        </section>

        {/* 모임 일정 */}
        <section className="group-section">
          <div className="section-heading">
            <div>
              <span className="section-label">STUDY GROUP</span>
              <h2>다가오는 모임</h2>
            </div>

            <a href="/study" className="more-link">
              전체보기 →
            </a>
          </div>

          <div className="group-grid">
            <article className="group-card">
              <div className="group-card-date">
                AUG
                <strong>24</strong>
              </div>

              <div className="group-card-content">
                <span className="group-category">SPRING BOOT</span>
                <h3>Spring Boot 스터디</h3>
                <p>월요일 · 19:00</p>
                <span className="group-members">👥 8명 참여</span>
              </div>
            </article>

            <article className="group-card">
              <div className="group-card-date">
                AUG
                <strong>26</strong>
              </div>

              <div className="group-card-content">
                <span className="group-category">JAVA</span>
                <h3>Java 기초 스터디</h3>
                <p>수요일 · 19:00</p>
                <span className="group-members">👥 5명 참여</span>
              </div>
            </article>

            <article className="group-card">
              <div className="group-card-date">
                AUG
                <strong>28</strong>
              </div>

              <div className="group-card-content">
                <span className="group-category">SQL</span>
                <h3>SQL 스터디</h3>
                <p>금요일 · 20:00</p>
                <span className="group-members">👥 6명 참여</span>
              </div>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}

export default Calendar;