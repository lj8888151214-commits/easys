import { useEffect, useState } from "react";
import "./StudyReservation.css";
import studyReservationBg from "../../assets/images/StudyReservation.jpg";

function StudyReservation() {
  const [scrollY, setScrollY] = useState(0);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedDate, setSelectedDate] = useState("8월 24일");
  const [selectedTime, setSelectedTime] = useState("19:00 - 21:00");

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 나중에 DB에서 받아올 장소 데이터
  const places = [
    {
      id: 1,
      name: "스터디룸 그린",
      location: "서울 강남구",
      description: "조용하고 쾌적한 스터디 공간",
      capacity: "4~8명",
      price: 12000,
      rating: "4.8",
      image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
      tags: ["화이트보드", "Wi-Fi", "콘센트"],
    },
    {
      id: 2,
      name: "워크 라운지",
      location: "서울 역삼동",
      description: "프로젝트 스터디에 적합한 공간",
      capacity: "2~6명",
      price: 10000,
      rating: "4.7",
      image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80",
      tags: ["모니터", "Wi-Fi", "커피"],
    },
    {
      id: 3,
      name: "코드 스페이스",
      location: "서울 신논현",
      description: "개발자 스터디를 위한 집중 공간",
      capacity: "4~10명",
      price: 15000,
      rating: "4.9",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
      tags: ["프로젝터", "화이트보드", "Wi-Fi"],
    },
  ];

  const dates = [
    "8월 24일",
    "8월 25일",
    "8월 26일",
    "8월 27일",
    "8월 28일",
  ];

  const times = [
    "10:00 - 12:00",
    "14:00 - 16:00",
    "17:00 - 19:00",
    "19:00 - 21:00",
  ];

  const formatPrice = (price) => {
    return price.toLocaleString("ko-KR") + "원";
  };

  return (
    <main className="study-reservation-page">

      {/* ================================
          HERO
      ================================= */}

      <section className="study-reservation-hero">

        <div
          className="study-reservation-hero-bg"
          style={{
            backgroundImage: `url(${studyReservationBg})`,
            transform: `scale(1.08) translateY(${scrollY * 0.15}px)`,
          }}
        ></div>

        <div className="study-reservation-hero-overlay"></div>

        <div className="study-reservation-hero-content">
          <span className="study-reservation-eyebrow">
            EASYS STUDY SPACE
          </span>

          <h1>스터디 예약</h1>

          <p>
            함께 공부할 공간을 찾고
            <br />
            원하는 시간에 예약해보세요.
          </p>
        </div>

      </section>


      {/* ================================
          CONTENT
      ================================= */}

      <section className="study-reservation-content">

        {/* 페이지 소개 */}

        <div className="reservation-intro">
          <div>
            <span className="section-label">
              STUDY SPACE
            </span>

            <h2>
              우리 어디서 만날까요?
            </h2>

            <p>
              원하는 스터디룸을 찾고
              <br />
              날짜와 시간을 선택해보세요.
            </p>
          </div>

          <div className="reservation-step">
            <div className="step active">
              <span>01</span>
              장소 선택
            </div>

            <div className="step-line"></div>

            <div className="step">
              <span>02</span>
              일정 선택
            </div>

            <div className="step-line"></div>

            <div className="step">
              <span>03</span>
              결제
            </div>
          </div>
        </div>


        {/* ================================
            장소 검색
        ================================= */}

        <div className="reservation-search">

          <div className="search-title">
            <div>
              <span className="section-label">
                FIND A PLACE
              </span>

              <h2>스터디 장소 찾기</h2>
            </div>
          </div>

          <div className="place-search-box">
            <span>⌕</span>

            <input
              type="text"
              placeholder="지역이나 스터디룸을 검색해보세요"
            />

            <button type="button">
              검색
            </button>
          </div>

          <div className="place-filter">

            <button className="place-filter-button active">
              전체
            </button>

            <button className="place-filter-button">
              강남
            </button>

            <button className="place-filter-button">
              역삼
            </button>

            <button className="place-filter-button">
              신논현
            </button>

            <button className="place-filter-button">
              4인 이상
            </button>

          </div>

        </div>


        {/* ================================
            장소 목록
        ================================= */}

        <div className="place-section">

          <div className="place-section-header">
            <div>
              <h2>추천 스터디 공간</h2>
              <span>현재 예약 가능한 공간이에요.</span>
            </div>

            <span className="place-count">
              {places.length}개의 공간
            </span>
          </div>


          <div className="place-grid">

            {places.map((place) => (
              <article
                className={`place-card ${
                  selectedPlace?.id === place.id ? "selected" : ""
                }`}
                key={place.id}
                onClick={() => setSelectedPlace(place)}
              >

                <div className="place-image">

                  <img
                    src={place.image}
                    alt={place.name}
                  />

                  <span className="place-rating">
                    ★ {place.rating}
                  </span>

                  {selectedPlace?.id === place.id && (
                    <span className="place-selected">
                      ✓ 선택됨
                    </span>
                  )}

                </div>


                <div className="place-card-content">

                  <span className="place-location">
                    {place.location}
                  </span>

                  <h3>
                    {place.name}
                  </h3>

                  <p>
                    {place.description}
                  </p>


                  <div className="place-tags">

                    {place.tags.map((tag) => (
                      <span key={tag}>
                        {tag}
                      </span>
                    ))}

                  </div>


                  <div className="place-card-bottom">

                    <div>
                      <span>최대 {place.capacity}</span>

                      <strong>
                        {formatPrice(place.price)}
                        <small>/시간</small>
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedPlace(place);
                      }}
                    >
                      선택
                    </button>

                  </div>

                </div>

              </article>
            ))}

          </div>

        </div>


        {/* ================================
            날짜 / 시간
        ================================= */}

        <div className="reservation-schedule">

          <div className="schedule-select">

            <span className="section-label">
              DATE
            </span>

            <h2>날짜를 선택하세요</h2>

            <div className="date-list">

              {dates.map((date) => (
                <button
                  type="button"
                  key={date}
                  className={selectedDate === date ? "active" : ""}
                  onClick={() => setSelectedDate(date)}
                >
                  {date}
                </button>
              ))}

            </div>

          </div>


          <div className="schedule-select">

            <span className="section-label">
              TIME
            </span>

            <h2>시간을 선택하세요</h2>

            <div className="time-list">

              {times.map((time) => (
                <button
                  type="button"
                  key={time}
                  className={selectedTime === time ? "active" : ""}
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </button>
              ))}

            </div>

          </div>

        </div>


        {/* ================================
            예약 요약
        ================================= */}

        <div className="reservation-summary">

          <div className="summary-info">

            <span className="section-label">
              RESERVATION SUMMARY
            </span>

            <h2>예약 정보를 확인해주세요.</h2>

            <div className="summary-row">
              <span>장소</span>
              <strong>
                {selectedPlace
                  ? selectedPlace.name
                  : "장소를 선택해주세요"}
              </strong>
            </div>

            <div className="summary-row">
              <span>날짜</span>
              <strong>{selectedDate}</strong>
            </div>

            <div className="summary-row">
              <span>시간</span>
              <strong>{selectedTime}</strong>
            </div>

            <div className="summary-row">
              <span>예약 인원</span>
              <strong>4명</strong>
            </div>

          </div>


          <div className="summary-payment">

            <span>예상 결제 금액</span>

            <strong>
              {selectedPlace
                ? formatPrice(selectedPlace.price * 2)
                : "0원"}
            </strong>

            <button
              type="button"
              disabled={!selectedPlace}
            >
              예약 및 결제하기 →
            </button>

            <p>
              예약 버튼을 누르면 결제 페이지로 이동합니다.
            </p>

          </div>

        </div>

      </section>

    </main>
  );
}

export default StudyReservation;