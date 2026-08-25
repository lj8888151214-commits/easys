import { useEffect, useState } from "react";
import "./Mentoring.css";
import mentoringBg from "../../assets/images/mentoring-bg.jpg";

function Mentoring() {
  const [scrollY, setScrollY] = useState(0);
  const [category, setCategory] = useState("전체");
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [reservationMentor, setReservationMentor] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 나중에 백엔드 DB에서 받아올 데이터
  // profileImage 부분에 DB의 프로필 이미지 경로가 들어오면 바로 사용 가능
  const mentors = [
    {
      id: 1,
      name: "김개발",
      role: "백엔드 개발자",
      career: "5년차",
      category: "Java",
      skills: ["Java", "Spring", "JPA"],
      description: "Java와 Spring을 중심으로 실무 개발과 프로젝트를 멘토링합니다.",
      price: "30,000",
      profileImage: "",
      rating: 4.9,
      reviews: 38
    },
    {
      id: 2,
      name: "이프론트",
      role: "프론트엔드 개발자",
      career: "4년차",
      category: "React",
      skills: ["HTML", "CSS", "JavaScript", "React"],
      description: "HTML, CSS, JavaScript부터 React 프로젝트까지 함께합니다.",
      price: "25,000",
      profileImage: "",
      rating: 4.8,
      reviews: 24
    },
    {
      id: 3,
      name: "박데이터",
      role: "데이터 엔지니어",
      career: "6년차",
      category: "SQL",
      skills: ["SQL", "DB", "Python"],
      description: "SQL과 데이터베이스 설계 및 실무 활용을 알려드립니다.",
      price: "35,000",
      profileImage: "",
      rating: 5.0,
      reviews: 17
    },
    {
      id: 4,
      name: "최풀스택",
      role: "풀스택 개발자",
      career: "7년차",
      category: "Spring",
      skills: ["Java", "Spring", "React", "DB"],
      description: "하나의 서비스를 직접 만들어보며 풀스택 개발을 경험합니다.",
      price: "40,000",
      profileImage: "",
      rating: 4.9,
      reviews: 51
    }
  ];

  const categories = [
    "전체",
    "HTML",
    "CSS",
    "Java",
    "JavaScript",
    "Spring",
    "React",
    "SQL",
    "DB",
    "Python"
  ];

  const filteredMentors =
    category === "전체"
      ? mentors
      : mentors.filter((mentor) => mentor.skills.includes(category));

  const openReservation = (mentor) => {
    setReservationMentor(mentor);
    setSelectedMentor(null);
  };

  return (
    <main className="mentoring-page">

      {/* ================================
          HERO
      ================================ */}

      <section className="mentoring-hero">
        <div
          className="mentoring-hero-bg"
          style={{
            backgroundImage: `url(${mentoringBg})`,
            transform: `scale(1.08) translateY(${scrollY * 0.15}px)`
          }}
        />

        <div className="mentoring-hero-overlay" />

        <div className="mentoring-hero-content">
          <span className="mentoring-eyebrow">
            EASYS MENTORING
          </span>

          <h1>멘토링</h1>

          <p>
            막히는 부분을 질문하고
            <br />
            나에게 맞는 멘토를 만나보세요.
          </p>
        </div>
      </section>

      {/* ================================
          CONTENT
      ================================ */}

      <section className="mentoring-content">

        {/* INTRO */}

        <div className="mentoring-intro">
          <div>
            <span className="section-label">
              FIND YOUR MENTOR
            </span>

            <h2>
              나에게 맞는 멘토를 찾아보세요.
            </h2>

            <p>
              개발 분야와 관심 기술을 기준으로
              <br />
              원하는 멘토를 찾아 상담을 신청할 수 있습니다.
            </p>
          </div>

          <button className="mentor-register-button">
            멘토로 등록하기
          </button>
        </div>

        {/* FILTER */}

        <div className="mentoring-filter">
          {categories.map((item) => (
            <button
              key={item}
              className={`mentoring-filter-button ${
                category === item ? "active" : ""
              }`}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {/* MENTOR GRID */}

        {filteredMentors.length > 0 ? (
          <div className="mentor-grid">
            {filteredMentors.map((mentor) => (
              <article
                className="mentor-card"
                key={mentor.id}
              >

                {/* 이름/직업 왼쪽 + 프로필 사진 오른쪽 */}

                <div className="mentor-card-top">

                  <div className="mentor-basic">
                    <span>{mentor.category}</span>

                    <h3>{mentor.name}</h3>

                    <p>
                      {mentor.role} · {mentor.career}
                    </p>
                  </div>

                  {/* ================================
                      프로필 이미지
                      나중에 DB의 profileImage 연결
                  ================================ */}

                  <div className="mentor-profile">
                    <div className="mentor-avatar">
                      {mentor.profileImage ? (
                        <img
                          src={mentor.profileImage}
                          alt={`${mentor.name} 프로필`}
                        />
                      ) : (
                        mentor.name.charAt(0)
                      )}
                    </div>
                  </div>

                </div>

                {/* RATING */}

                <div className="mentor-rating">
                  <strong>
                    ★ {mentor.rating}
                  </strong>

                  <span>
                    후기 {mentor.reviews}개
                  </span>
                </div>

                {/* DESCRIPTION */}

                <p className="mentor-description">
                  {mentor.description}
                </p>

                {/* SKILLS */}

                <div className="mentor-skills">
                  {mentor.skills.map((skill) => (
                    <span key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>

                {/* CARD BOTTOM */}

                <div className="mentor-card-bottom">

                  <div>
                    <small>1회 상담</small>
                    <strong>
                      {mentor.price}원
                    </strong>
                  </div>

                  <button
                    onClick={() =>
                      setSelectedMentor(mentor)
                    }
                  >
                    상세보기 →
                  </button>

                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mentor-empty">
            해당 분야의 멘토가 아직 없습니다.
          </div>
        )}
      </section>

      {/* ================================
          MENTOR DETAIL MODAL
      ================================ */}

      {selectedMentor && (
        <div
          className="mentor-modal-background"
          onClick={() => setSelectedMentor(null)}
        >
          <div
            className="mentor-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="mentor-modal-close"
              onClick={() => setSelectedMentor(null)}
            >
              ×
            </button>

            <div className="mentor-modal-profile">

              {/* DB 프로필 이미지 */}

              <div className="mentor-avatar large">
                {selectedMentor.profileImage ? (
                  <img
                    src={selectedMentor.profileImage}
                    alt={`${selectedMentor.name} 프로필`}
                  />
                ) : (
                  selectedMentor.name.charAt(0)
                )}
              </div>

              <div>
                <span>
                  {selectedMentor.category}
                </span>

                <h2>
                  {selectedMentor.name}
                </h2>

                <p>
                  {selectedMentor.role} ·{" "}
                  {selectedMentor.career}
                </p>
              </div>

            </div>

            {/* ABOUT */}

            <div className="mentor-modal-section">
              <span>ABOUT MENTOR</span>

              <h3>멘토 소개</h3>

              <p>
                {selectedMentor.description}
              </p>
            </div>

            {/* SKILLS */}

            <div className="mentor-modal-section">
              <span>SKILLS</span>

              <h3>멘토링 분야</h3>

              <div className="mentor-skills">
                {selectedMentor.skills.map((skill) => (
                  <span key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* BOTTOM */}

            <div className="mentor-modal-bottom">

              <div>
                <small>1회 상담</small>

                <strong>
                  {selectedMentor.price}원
                </strong>
              </div>

              <button
                className="mentor-request-button"
                onClick={() =>
                  openReservation(selectedMentor)
                }
              >
                멘토링 신청하기
              </button>

            </div>
          </div>
        </div>
      )}

      {/* ================================
          RESERVATION MODAL
      ================================ */}

      {reservationMentor && (
        <div
          className="reservation-modal-background"
          onClick={() => setReservationMentor(null)}
        >
          <div
            className="reservation-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="reservation-modal-close"
              onClick={() =>
                setReservationMentor(null)
              }
            >
              ×
            </button>

            <h2>멘토링 예약</h2>

            <div className="reservation-mentor">

              <strong>
                {reservationMentor.name}
              </strong>

              <span>
                {reservationMentor.role} ·{" "}
                {reservationMentor.career}
              </span>

            </div>

            <div className="reservation-form">

              <label>
                예약 날짜

                <input type="date" />
              </label>

              <label>
                예약 시간

                <input type="time" />
              </label>

              <label>
                질문 내용

                <textarea
                  placeholder="멘토에게 질문하고 싶은 내용을 적어주세요."
                />
              </label>

            </div>

            <div className="reservation-bottom">

              <div>
                <small>1회 상담</small>

                <strong>
                  {reservationMentor.price}원
                </strong>
              </div>

              <button
                className="reservation-submit-button"
                onClick={() =>
                  setReservationMentor(null)
                }
              >
                예약하기
              </button>

            </div>

          </div>
        </div>
      )}

    </main>
  );
}

export default Mentoring;