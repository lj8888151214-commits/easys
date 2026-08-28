import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudyReservation.css";
import studyReservationBg from "../../assets/images/StudyReservation.jpg";

const API_BASE = "/api";

// 지역 필터 버튼 => 스터디룸 location 문자열에 하나라도 포함되어야 하는 키워드 목록
const REGIONS = [
  { label: "전체", keywords: [] },
  { label: "서울", keywords: ["서울"] },
  { label: "인천", keywords: ["인천"] },
  { label: "경기도", keywords: ["경기", "성남", "수원", "고양", "용인", "판교"] },
  { label: "충청도", keywords: ["충청", "충남", "충북", "대전", "세종", "청주"] },
  { label: "전라도", keywords: ["전라", "전남", "전북", "광주", "전주"] },
  { label: "경상도", keywords: ["경상", "경남", "경북", "부산", "대구", "울산"] },
  { label: "제주도", keywords: ["제주"] },
];

// 예약은 1시간 단위로만 가능 (09:00 ~ 23:00 사이, 1시간씩)
const RESERVATION_START_HOUR = 9;
const RESERVATION_END_HOUR = 23;

const TIME_SLOTS = Array.from(
  { length: RESERVATION_END_HOUR - RESERVATION_START_HOUR },
  (_, index) => {
    const startHour = RESERVATION_START_HOUR + index;
    const endHour = startHour + 1;

    return {
      startTime: `${String(startHour).padStart(2, "0")}:00`,
      endTime: `${String(endHour).padStart(2, "0")}:00`,
    };
  }
);

const WEEKDAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"];

function buildDateOptions() {
  const days = [];
  const today = new Date();

  for (let i = 0; i < 7; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    days.push({
      value: `${yyyy}-${mm}-${dd}`,
      label: `${date.getMonth() + 1}월 ${date.getDate()}일(${WEEKDAY_LABEL[date.getDay()]})`,
    });
  }

  return days;
}

function toMinutes(hhmm) {
  const [hour, minute] = hhmm.split(":").map(Number);
  return hour * 60 + minute;
}

function formatPrice(price) {
  return Math.round(Number(price)).toLocaleString("ko-KR") + "원";
}

function formatReviewDate(dateTime) {
  return dateTime.slice(0, 10).replace(/-/g, ".");
}

function StudyReservation() {
  const navigate = useNavigate();

  const [scrollY, setScrollY] = useState(0);

  const dateOptions = useMemo(() => buildDateOptions(), []);

  // 스터디룸 목록
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState("");

  // 검색 / 필터
  const [keyword, setKeyword] = useState("");
  const [activeRegion, setActiveRegion] = useState("전체");

  // 선택 상태
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dateOptions[0].value);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [peopleCount, setPeopleCount] = useState(1);

  // 예약 가능 시간 조회
  const [reservedTimes, setReservedTimes] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // 예약 생성
  const [submitting, setSubmitting] = useState(false);
  const [reservationError, setReservationError] = useState("");

  // 리뷰
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState("");

  /* ================================
     스크롤
  ================================= */

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /* ================================
     스터디룸 목록 조회
  ================================= */

  const loadRooms = async (searchKeyword) => {
    try {
      setLoadingRooms(true);
      setRoomsError("");

      const url = searchKeyword
        ? `${API_BASE}/study-rooms/search?keyword=${encodeURIComponent(searchKeyword)}`
        : `${API_BASE}/study-rooms`;

      const response = await fetch(url, { credentials: "include" });

      if (!response.ok) {
        throw new Error(`스터디룸 목록을 불러오지 못했습니다. (HTTP ${response.status})`);
      }

      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error("스터디룸 목록 조회 오류:", error);
      setRoomsError(error.message || "스터디룸 목록을 불러오지 못했습니다.");
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    loadRooms("");
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    loadRooms(keyword.trim());
  };

  // 지역 필터는 이미 불러온 목록 안에서 클라이언트 사이드로 걸러낸다
  const filteredRooms = useMemo(() => {
    const region = REGIONS.find((item) => item.label === activeRegion);

    if (!region || region.keywords.length === 0) {
      return rooms;
    }

    return rooms.filter((room) =>
      region.keywords.some((keyword) => room.location.includes(keyword))
    );
  }, [rooms, activeRegion]);

  /* ================================
     선택한 장소가 바뀌면 초기화
  ================================= */

  useEffect(() => {
    setSelectedSlot(null);
    setReservationError("");

    if (selectedPlace) {
      setPeopleCount(selectedPlace.minCapacity);
    } else {
      setPeopleCount(1);
    }
  }, [selectedPlace]);

  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate]);

  /* ================================
     선택한 장소 + 날짜의 예약 현황 조회
  ================================= */

  useEffect(() => {
    if (!selectedPlace) {
      setReservedTimes([]);
      return;
    }

    const loadAvailability = async () => {
      try {
        setLoadingAvailability(true);

        const response = await fetch(
          `${API_BASE}/reservations/availability?roomId=${selectedPlace.id}&date=${selectedDate}`,
          { credentials: "include" }
        );

        if (!response.ok) {
          throw new Error("예약 현황을 불러오지 못했습니다.");
        }

        const data = await response.json();
        setReservedTimes(data);
      } catch (error) {
        console.error("예약 가능 시간 조회 오류:", error);
        setReservedTimes([]);
      } finally {
        setLoadingAvailability(false);
      }
    };

    loadAvailability();
  }, [selectedPlace, selectedDate]);

  /* ================================
     선택한 장소의 리뷰 조회
  ================================= */

  const loadReviews = async (roomId) => {
    try {
      setLoadingReviews(true);
      setReviewsError("");

      const response = await fetch(
        `${API_BASE}/study-rooms/${roomId}/reviews`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error("리뷰를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error("리뷰 조회 오류:", error);
      setReviewsError(error.message || "리뷰를 불러오지 못했습니다.");
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    setReviewRating(5);
    setReviewContent("");
    setReviewSubmitError("");

    if (selectedPlace) {
      loadReviews(selectedPlace.id);
    } else {
      setReviews([]);
    }
  }, [selectedPlace]);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!selectedPlace || submittingReview) return;

    if (!reviewContent.trim()) {
      setReviewSubmitError("리뷰 내용을 입력해주세요.");
      return;
    }

    setSubmittingReview(true);
    setReviewSubmitError("");

    try {
      const response = await fetch(
        `${API_BASE}/study-rooms/${selectedPlace.id}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            rating: reviewRating,
            content: reviewContent.trim(),
          }),
        }
      );

      if (response.status === 401) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }

      const text = await response.text();
      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        // JSON이 아닌 응답
      }

      if (!response.ok) {
        throw new Error(
          (data && data.message) || text || "리뷰 등록에 실패했습니다."
        );
      }

      setReviews((prev) => [data, ...prev]);
      setReviewContent("");
      setReviewRating(5);
    } catch (error) {
      console.error("리뷰 등록 오류:", error);
      setReviewSubmitError(error.message || "리뷰 등록에 실패했습니다.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const isSlotTaken = (slot) => {
    const slotStart = toMinutes(slot.startTime);
    const slotEnd = toMinutes(slot.endTime);

    return reservedTimes.some((reservation) => {
      const reservedStart = toMinutes(reservation.startTime.slice(0, 5));
      const reservedEnd = toMinutes(reservation.endTime.slice(0, 5));

      return slotStart < reservedEnd && slotEnd > reservedStart;
    });
  };

  /* ================================
     예약 인원 조절
  ================================= */

  const handlePeopleChange = (delta) => {
    if (!selectedPlace) return;

    setPeopleCount((prev) => {
      const next = prev + delta;

      if (next < selectedPlace.minCapacity) return selectedPlace.minCapacity;
      if (next > selectedPlace.maxCapacity) return selectedPlace.maxCapacity;

      return next;
    });
  };

  /* ================================
     예약 요약 계산
  ================================= */

  const hours = selectedSlot
    ? (toMinutes(selectedSlot.endTime) - toMinutes(selectedSlot.startTime)) / 60
    : 0;

  const totalPrice =
    selectedPlace && selectedSlot
      ? Number(selectedPlace.pricePerHour) * hours * peopleCount
      : 0;

  const selectedDateLabel =
    dateOptions.find((date) => date.value === selectedDate)?.label ||
    selectedDate;

  const canReserve =
    !!selectedPlace &&
    !!selectedSlot &&
    peopleCount >= selectedPlace.minCapacity &&
    peopleCount <= selectedPlace.maxCapacity &&
    !submitting;

  /* ================================
     예약 생성
  ================================= */

  const handleReserve = async () => {
    if (!canReserve) return;

    setSubmitting(true);
    setReservationError("");

    try {
      const response = await fetch(`${API_BASE}/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          studyRoomId: selectedPlace.id,
          reservationDate: selectedDate,
          startTime: `${selectedSlot.startTime}:00`,
          endTime: `${selectedSlot.endTime}:00`,
          peopleCount,
        }),
      });

      if (response.status === 401) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }

      const text = await response.text();
      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        // JSON이 아닌 응답
      }

      if (!response.ok) {
        throw new Error(
          (data && data.message) || text || "예약에 실패했습니다."
        );
      }

      alert("예약이 접수되었습니다. 결제 완료 시 예약이 확정됩니다.");

      if (data) {
        setReservedTimes((prev) => [...prev, data]);
      }
      setSelectedSlot(null);
    } catch (error) {
      console.error("예약 생성 오류:", error);
      setReservationError(error.message || "예약에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
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
            이지스에서 운영하는 함께 할 공부할 공간을 찾고
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
              이지스에서 운영하는 스터디룸을 찾고
              <br />
              날짜와 시간을 선택해보세요.
            </p>
          </div>

          <div className="reservation-step">
            <div className={`step ${!selectedPlace ? "active" : ""}`}>
              <span>01</span>
              장소 선택
            </div>

            <div className="step-line"></div>

            <div
              className={`step ${
                selectedPlace && !selectedSlot ? "active" : ""
              }`}
            >
              <span>02</span>
              일정 선택
            </div>

            <div className="step-line"></div>

            <div className={`step ${selectedSlot ? "active" : ""}`}>
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

              <h2>이지스 스터디 장소 찾기</h2>
            </div>
          </div>

          <form className="place-search-box" onSubmit={handleSearch}>
            <span>⌕</span>

            <input
              type="text"
              placeholder="지역이나 스터디룸을 검색해보세요"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />

            <button type="submit">
              검색
            </button>
          </form>

          <div className="place-filter">

            {REGIONS.map((region) => (
              <button
                key={region.label}
                type="button"
                className={`place-filter-button ${
                  activeRegion === region.label ? "active" : ""
                }`}
                onClick={() => setActiveRegion(region.label)}
              >
                {region.label}
              </button>
            ))}

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
              {filteredRooms.length}개의 공간
            </span>
          </div>

          {loadingRooms && (
            <p className="place-state-message">
              스터디룸 목록을 불러오는 중입니다...
            </p>
          )}

          {!loadingRooms && roomsError && (
            <p className="place-state-message error">
              {roomsError}
            </p>
          )}

          {!loadingRooms && !roomsError && filteredRooms.length === 0 && (
            <p className="place-state-message">
              조건에 맞는 스터디룸이 없어요.
            </p>
          )}

          {!loadingRooms && !roomsError && filteredRooms.length > 0 && (
            <div className="place-grid">

              {filteredRooms.map((place) => (
                <article
                  className={`place-card ${
                    selectedPlace?.id === place.id ? "selected" : ""
                  }`}
                  key={place.id}
                  onClick={() => setSelectedPlace(place)}
                >

                  <div className="place-image">

                    <img
                      src={place.imageUrl || studyReservationBg}
                      alt={place.name}
                    />

                    <span className="place-rating">
                      ★ {place.rating ? Number(place.rating).toFixed(1) : "-"}
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


                    <div className="place-card-bottom">

                      <div>
                        <span>
                          {place.minCapacity}~{place.maxCapacity}명
                        </span>

                        <strong>
                          {formatPrice(place.pricePerHour)}
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
          )}

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

              {dateOptions.map((date) => (
                <button
                  type="button"
                  key={date.value}
                  className={selectedDate === date.value ? "active" : ""}
                  onClick={() => setSelectedDate(date.value)}
                >
                  {date.label}
                </button>
              ))}

            </div>

          </div>


          <div className="schedule-select">

            <span className="section-label">
              TIME
            </span>

            <h2>시간을 선택하세요</h2>

            {!selectedPlace && (
              <p className="place-state-message">
                먼저 장소를 선택해주세요.
              </p>
            )}

            {selectedPlace && loadingAvailability && (
              <p className="place-state-message">
                예약 현황을 확인하는 중입니다...
              </p>
            )}

            {selectedPlace && !loadingAvailability && (
              <div className="time-list">

                {TIME_SLOTS.map((slot) => {
                  const taken = isSlotTaken(slot);
                  const isActive =
                    selectedSlot?.startTime === slot.startTime &&
                    selectedSlot?.endTime === slot.endTime;

                  return (
                    <button
                      type="button"
                      key={`${slot.startTime}-${slot.endTime}`}
                      className={isActive ? "active" : ""}
                      disabled={taken}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      <span>{slot.startTime} - {slot.endTime}</span>
                      {taken && <small>예약마감</small>}
                    </button>
                  );
                })}

              </div>
            )}

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
              <strong>{selectedDateLabel}</strong>
            </div>

            <div className="summary-row">
              <span>시간</span>
              <strong>
                {selectedSlot
                  ? `${selectedSlot.startTime} - ${selectedSlot.endTime}`
                  : "시간을 선택해주세요"}
              </strong>
            </div>

            <div className="summary-row">
              <span>예약 인원</span>

              <div className="people-count-control">
                <button
                  type="button"
                  disabled={!selectedPlace}
                  onClick={() => handlePeopleChange(-1)}
                >
                  −
                </button>

                <strong>{peopleCount}명</strong>

                <button
                  type="button"
                  disabled={!selectedPlace}
                  onClick={() => handlePeopleChange(1)}
                >
                  +
                </button>
              </div>
            </div>

            {selectedPlace && (
              <p className="summary-hint">
                {selectedPlace.minCapacity}명 ~ {selectedPlace.maxCapacity}명까지 예약 가능합니다.
              </p>
            )}

          </div>


          <div className="summary-payment">

            <span>예상 결제 금액</span>

            <strong>
              {selectedPlace && selectedSlot
                ? formatPrice(totalPrice)
                : "0원"}
            </strong>

            {reservationError && (
              <p className="reservation-error">{reservationError}</p>
            )}

            <button
              type="button"
              disabled={!canReserve}
              onClick={handleReserve}
            >
              {submitting ? "예약 처리 중..." : "예약 및 결제하기 →"}
            </button>

            <p>
              예약 버튼을 누르면 예약이 접수되고, 결제 완료 시 확정됩니다.
            </p>

          </div>

        </div>


        {/* ================================
            리뷰
        ================================= */}

        {selectedPlace && (
          <div className="reservation-reviews">

            <div className="reviews-header">
              <div>
                <span className="section-label">
                  REVIEWS
                </span>

                <h2>{selectedPlace.name} 이용 후기</h2>
              </div>

              <div className="reviews-average">
                <strong>★ {averageRating.toFixed(1)}</strong>
                <span>{reviews.length}개의 후기</span>
              </div>
            </div>

            <form className="review-form" onSubmit={handleReviewSubmit}>

              <div className="review-star-picker">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    type="button"
                    key={score}
                    className={score <= reviewRating ? "active" : ""}
                    onClick={() => setReviewRating(score)}
                  >
                    ★
                  </button>
                ))}
              </div>

              <textarea
                placeholder="스터디룸 이용 후기를 남겨주세요. (예약을 이용한 스터디룸만 작성할 수 있어요)"
                value={reviewContent}
                onChange={(event) => setReviewContent(event.target.value)}
                maxLength={1000}
              />

              {reviewSubmitError && (
                <p className="reservation-error">{reviewSubmitError}</p>
              )}

              <button type="submit" disabled={submittingReview}>
                {submittingReview ? "등록 중..." : "후기 등록하기"}
              </button>

            </form>

            {loadingReviews && (
              <p className="place-state-message">
                후기를 불러오는 중입니다...
              </p>
            )}

            {!loadingReviews && reviewsError && (
              <p className="place-state-message error">
                {reviewsError}
              </p>
            )}

            {!loadingReviews && !reviewsError && reviews.length === 0 && (
              <p className="place-state-message">
                아직 등록된 후기가 없어요.
              </p>
            )}

            {!loadingReviews && !reviewsError && reviews.length > 0 && (
              <ul className="review-list">
                {reviews.map((review) => (
                  <li key={review.id}>
                    <div className="review-item-header">
                      <strong>{review.nickname}</strong>
                      <span className="review-item-stars">
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </span>
                      <span className="review-item-date">
                        {formatReviewDate(review.createdAt)}
                      </span>
                    </div>
                    <p>{review.content}</p>
                  </li>
                ))}
              </ul>
            )}

          </div>
        )}

      </section>

    </main>
  );
}

export default StudyReservation;
