import { useEffect, useState } from "react";
import "./Study.css";
import studyBg from "../../assets/images/study-bg.jpg";

function Study() {
  const [scrollY, setScrollY] = useState(0);
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const subjects = [
    "HTML",
    "CSS",
    "Java",
    "JavaScript",
    "Spring",
    "React",
    "SQL",
    "DB",
  ];

  const handleSubjectChange = (subject) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((item) => item !== subject)
        : [...prev, subject]
    );
  };

  return (
    <main className="study-page">
      {/* HERO */}
      <section className="study-hero">
        <div
          className="study-hero-bg"
          style={{
            backgroundImage: `url(${studyBg})`,
            transform: `scale(1.08) translateY(${scrollY * 0.15}px)`,
          }}
        ></div>

        <div className="study-hero-overlay"></div>

        <div className="study-hero-content">
          <span className="study-eyebrow">EASYS STUDY</span>
          <h1>스터디 모음</h1>
          <p>
            함께 공부할 사람을 찾고
            <br />
            새로운 스터디를 시작해보세요.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="study-content">
        {/* 상단 */}
        <div className="study-top">
          <div>
            <span className="section-label">STUDY GROUP</span>
            <h2>함께 공부할 스터디</h2>
            <p className="study-description">
              관심 있는 과목을 선택하고 나에게 맞는 스터디를 찾아보세요.
            </p>
          </div>

          <button className="create-study-button">
            + 스터디 만들기
          </button>
        </div>

        {/* 과목 필터 */}
        <div className="study-filter-box">
          <div className="study-filter-title">
            <div>
              <strong>어떤 공부를 찾고 있나요?</strong>
              <span>여러 과목을 동시에 선택할 수 있습니다.</span>
            </div>

            {selectedSubjects.length > 0 && (
              <button
                className="filter-reset"
                onClick={() => setSelectedSubjects([])}
              >
                선택 초기화
              </button>
            )}
          </div>

          <div className="study-filter-list">
            {subjects.map((subject) => (
              <label
                className={`study-check ${
                  selectedSubjects.includes(subject) ? "checked" : ""
                }`}
                key={subject}
              >
                <input
                  type="checkbox"
                  checked={selectedSubjects.includes(subject)}
                  onChange={() => handleSubjectChange(subject)}
                />

                <span className="custom-check"></span>
                <span>{subject}</span>
              </label>
            ))}
          </div>

          {selectedSubjects.length > 0 && (
            <div className="selected-subjects">
              <span>선택한 과목</span>

              <div>
                {selectedSubjects.map((subject) => (
                  <span className="selected-tag" key={subject}>
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 검색 */}
        <div className="study-search-row">
          <div className="study-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="스터디 이름이나 내용을 검색해보세요."
            />
          </div>

          <select className="study-sort">
            <option>최신순</option>
            <option>마감 임박순</option>
            <option>참여자 많은순</option>
          </select>
        </div>

        {/* 결과 */}
        <div className="study-result-header">
          <strong>스터디</strong>
          <span>
            {selectedSubjects.length > 0
              ? `${selectedSubjects.join(" · ")} 관련 스터디`
              : "전체 스터디"}
          </span>
        </div>

        {/* 스터디 카드 */}
        <div className="study-grid">
          <article className="study-card">
            <div className="study-card-top">
              <div className="study-tags">
                <span>Spring</span>
                <span>Java</span>
              </div>
              <span className="study-status">모집중</span>
            </div>

            <h3>Spring Boot 실전 프로젝트</h3>

            <p>
              Java와 Spring Boot를 함께 공부하고
              간단한 프로젝트까지 만들어봅니다.
            </p>

            <div className="study-card-subjects">
              <span>Java</span>
              <span>Spring</span>
              <span>SQL</span>
            </div>

            <div className="study-info">
              <span>매주 월요일</span>
              <span>19:00</span>
              <span>8 / 10명</span>
            </div>

            <div className="study-card-bottom">
              <span>온라인</span>
              <button>자세히 보기 →</button>
            </div>
          </article>

          <article className="study-card">
            <div className="study-card-top">
              <div className="study-tags">
                <span>HTML</span>
                <span>CSS</span>
              </div>
              <span className="study-status">모집중</span>
            </div>

            <h3>HTML & CSS 웹 디자인</h3>

            <p>
              HTML과 CSS를 처음부터 공부하면서
              실제 웹페이지를 만들어봅니다.
            </p>

            <div className="study-card-subjects">
              <span>HTML</span>
              <span>CSS</span>
            </div>

            <div className="study-info">
              <span>매주 화요일</span>
              <span>19:00</span>
              <span>5 / 8명</span>
            </div>

            <div className="study-card-bottom">
              <span>온라인</span>
              <button>자세히 보기 →</button>
            </div>
          </article>

          <article className="study-card">
            <div className="study-card-top">
              <div className="study-tags">
                <span>JavaScript</span>
                <span>React</span>
              </div>
              <span className="study-status">모집중</span>
            </div>

            <h3>JavaScript & React 스터디</h3>

            <p>
              JavaScript 기초부터 React까지
              프론트엔드를 함께 공부합니다.
            </p>

            <div className="study-card-subjects">
              <span>JavaScript</span>
              <span>React</span>
              <span>HTML</span>
              <span>CSS</span>
            </div>

            <div className="study-info">
              <span>매주 토요일</span>
              <span>14:00</span>
              <span>4 / 8명</span>
            </div>

            <div className="study-card-bottom">
              <span>온라인</span>
              <button>자세히 보기 →</button>
            </div>
          </article>

          <article className="study-card">
            <div className="study-card-top">
              <div className="study-tags">
                <span>Full Stack</span>
              </div>
              <span className="study-status">모집중</span>
            </div>

            <h3>풀스택 개발자 과정</h3>

            <p>
              HTML, CSS부터 Java, Spring, DB까지
              하나의 프로젝트를 완성하는 과정입니다.
            </p>

            <div className="study-card-subjects">
              <span>HTML</span>
              <span>CSS</span>
              <span>Java</span>
              <span>JavaScript</span>
              <span>Spring</span>
              <span>SQL</span>
            </div>

            <div className="study-info">
              <span>매주 일요일</span>
              <span>14:00</span>
              <span>6 / 10명</span>
            </div>

            <div className="study-card-bottom">
              <span>온·오프라인</span>
              <button>자세히 보기 →</button>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

export default Study;