import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

// 이용 시작 후 10분까지만 신규 예약 가능 (백엔드 ReservationService의
// RESERVATION_GRACE_PERIOD_MINUTES와 동일한 기준. 실제 최종 검증은 반드시
// 서버에서 이루어지며, 여기서는 UX 보조용으로 미리 비활성화만 한다).
const RESERVATION_GRACE_PERIOD_MINUTES = 10;

// 스터디룸 목록 한 페이지에 보여줄 개수
const ROOMS_PAGE_SIZE = 12;

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

  for (let i = 0; i < 14; i += 1) {
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
  const [searchParams] = useSearchParams();
  const studyId = searchParams.get("studyId");
  const isStudyMode = !!studyId;

  const [scrollY, setScrollY] = useState(0);

  const dateOptions = useMemo(() => buildDateOptions(), []);

  // 스터디 예약 모드 전용 상태
  const [study, setStudy] = useState(null);
  const [studyLoading, setStudyLoading] = useState(isStudyMode);
  const [studyError, setStudyError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // 스터디룸 목록
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState("");
  const [roomsPage, setRoomsPage] = useState(1);

  // 검색 / 필터
  const [keyword, setKeyword] = useState("");
  const [activeRegion, setActiveRegion] = useState("전체");

  // 선택 상태
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dateOptions[0].value);
  // 선택된 시작 시각들 (예: ["15:00", "16:00"]). 각 시각을 개별로
  // 선택/해제할 수 있고, 연속된 시간을 선택하면 그만큼 이용 시간이 된다.
  const [selectedHours, setSelectedHours] = useState([]);
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
  const displayRooms = useMemo(() => {
    const region = REGIONS.find((item) => item.label === activeRegion);

    if (!region || region.keywords.length === 0) {
      return rooms;
    }

    return rooms.filter((room) =>
      region.keywords.some((keyword) => room.location.includes(keyword))
    );
  }, [rooms, activeRegion]);


  // 검색어/지역 필터가 바뀌면 1페이지로 되돌린다
  useEffect(() => {
    setRoomsPage(1);
  }, [displayRooms]);

  const roomsTotalPages = Math.max(1, Math.ceil(displayRooms.length / ROOMS_PAGE_SIZE));
  const roomsCurrentPage = Math.min(roomsPage, roomsTotalPages);
  const roomsPageStart = (roomsCurrentPage - 1) * ROOMS_PAGE_SIZE;
  const pagedRooms = displayRooms.slice(roomsPageStart, roomsPageStart + ROOMS_PAGE_SIZE);

  /* ================================
     스터디 예약 모드: 스터디 정보 + 현재 사용자 조회
  ================================= */

  useEffect(() => {
    if (!isStudyMode) return;

    const loadStudyAndUser = async () => {
      try {
        setStudyLoading(true);
        setStudyError("");

        const [studyRes, userRes] = await Promise.all([
          fetch(`${API_BASE}/study/${studyId}`, { credentials: "include" }),
          fetch(`${API_BASE}/member/me`, { credentials: "include" }),
        ]);

        if (!studyRes.ok) {
          throw new Error("스터디 정보를 불러오지 못했습니다.");
        }

        const studyData = await studyRes.json();
        setStudy(studyData);
        setPeopleCount(Math.max(1, Number(studyData.currentMembers) || 1));

        if (userRes.ok) {
          setCurrentUser(await userRes.json());
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("스터디 정보 조회 오류:", error);
        setStudyError(error.message || "스터디 정보를 불러오지 못했습니다.");
      } finally {
        setStudyLoading(false);
      }
    };

    loadStudyAndUser();
  }, [isStudyMode, studyId]);

  const isStudyOwner =
    !!study && !!currentUser && Number(study.memberId) === Number(currentUser.id);


  /* ================================
     선택한 장소 / 날짜가 바뀌면 시간 선택 초기화
  ================================= */

  useEffect(() => {
    setSelectedHours([]);
    setReservationError("");

    if (selectedPlace && !isStudyMode) {
      setPeopleCount(selectedPlace.minCapacity);
    } else if (!selectedPlace && !isStudyMode) {
      setPeopleCount(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlace]);

  useEffect(() => {
    setSelectedHours([]);
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

  const getRemainingCapacity = (slot) => {
    const slotStart = toMinutes(slot.startTime);
    const slotEnd = toMinutes(slot.endTime);

    const reservedPeople = reservedTimes.reduce((sum, reservation) => {
      const reservedStart = toMinutes(reservation.startTime.slice(0, 5));
      const reservedEnd = toMinutes(reservation.endTime.slice(0, 5));

      const overlaps = slotStart < reservedEnd && slotEnd > reservedStart;

      return overlaps ? sum + reservation.peopleCount : sum;
    }, 0);

    return selectedPlace.maxCapacity - reservedPeople;
  };

  // 이용 시작 후 여유 시간(10분)이 지난 시간대는 신규 예약 대상에서 제외한다.
  // (서버도 동일하게 최종 검증하지만, 눌러보고 나서야 에러를 보게 하는
  // 대신 미리 비활성화한다.)
  const isSlotPastDeadline = (slot) => {
    const slotStart = new Date(`${selectedDate}T${slot.startTime}:00`);

    if (Number.isNaN(slotStart.getTime())) return true;

    const deadline = new Date(
      slotStart.getTime() + RESERVATION_GRACE_PERIOD_MINUTES * 60 * 1000
    );

    return new Date() >= deadline;

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



  // 인원수를 늘렸을 때 이미 선택해둔 시간대 중 잔여 좌석이 부족해진
  // 시간대가 있으면 선택에서 제외한다.
  useEffect(() => {
    setSelectedHours((prev) =>
      prev.filter((startTime) => {
        const slot = TIME_SLOTS.find((s) => s.startTime === startTime);
        return !!slot && getRemainingCapacity(slot) >= peopleCount;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peopleCount]);


  /* ================================
     시간 선택/해제 (여러 시간대를 각각 토글)
  ================================= */

  const toggleHour = (slot) => {
    setSelectedHours((prev) =>
      prev.includes(slot.startTime)
        ? prev.filter((startTime) => startTime !== slot.startTime)
        : [...prev, slot.startTime].sort((a, b) => toMinutes(a) - toMinutes(b))
    );
  };

  /* ================================
     예약 요약 계산
  ================================= */

  // 선택된 시간대가 서로 끊김 없이 이어져 있는지 (하나의 예약 시간대가
  // 되려면 연속되어야 한다 - 1시간 단위 정책은 유지된다).
  const isContiguousSelection = useMemo(() => {
    if (selectedHours.length === 0) return false;

    for (let i = 1; i < selectedHours.length; i += 1) {
      const prevIndex = TIME_SLOTS.findIndex((s) => s.startTime === selectedHours[i - 1]);
      const currentIndex = TIME_SLOTS.findIndex((s) => s.startTime === selectedHours[i]);

      if (currentIndex !== prevIndex + 1) {
        return false;
      }
    }

    return true;
  }, [selectedHours]);

  // 선택된 시간대들을 하나의 예약 시간대(시작~종료)로 합친다.
  // 연속되지 않은 시간을 선택했으면 null(예약 불가)이 된다.
  const effectiveSlot = useMemo(() => {
    if (!isContiguousSelection) return null;

    const firstSlot = TIME_SLOTS.find((s) => s.startTime === selectedHours[0]);
    const lastSlot = TIME_SLOTS.find(
      (s) => s.startTime === selectedHours[selectedHours.length - 1]
    );

    if (!firstSlot || !lastSlot) return null;

    return {
      startTime: firstSlot.startTime,
      endTime: lastSlot.endTime,
    };
  }, [isContiguousSelection, selectedHours]);

  const hours = effectiveSlot
    ? (toMinutes(effectiveSlot.endTime) - toMinutes(effectiveSlot.startTime)) / 60
    : 0;

  const totalPrice =
    selectedPlace && effectiveSlot
      ? Number(selectedPlace.pricePerHour) * hours * peopleCount
      : 0;

  const selectedDateLabel =
    dateOptions.find((date) => date.value === selectedDate)?.label || selectedDate;

  const canReserve =
    !!selectedPlace &&
    !!effectiveSlot &&
    (!isStudyMode || (!!study && isStudyOwner)) &&
    peopleCount >= selectedPlace.minCapacity &&
    peopleCount <= selectedPlace.maxCapacity &&


    getRemainingCapacity(effectiveSlot) >= peopleCount &&

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
          studyId: isStudyMode ? Number(studyId) : null,
          reservationDate: selectedDate,
          startTime: `${effectiveSlot.startTime}:00`,
          endTime: `${effectiveSlot.endTime}:00`,
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

      if (!data || !data.id) {
        throw new Error("예약에 실패했습니다.");
      }

      navigate(`/payment?type=study&id=${data.id}`);
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

          <h1>카페 예약</h1>

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
                selectedPlace && !effectiveSlot ? "active" : ""
              }`}
            >
              <span>02</span>
              일정 선택
            </div>

            <div className="step-line"></div>

            <div className={`step ${effectiveSlot ? "active" : ""}`}>
              <span>03</span>
              결제
            </div>
          </div>
        </div>

        {/* ================================
            스터디 예약 모드 안내
        ================================= */}

        {isStudyMode && (
          <div className="place-state-message" style={{ textAlign: "left" }}>
            {studyLoading && "스터디 정보를 불러오는 중입니다..."}

            {!studyLoading && studyError && (
              <span className="error">{studyError}</span>
            )}

            {!studyLoading && !studyError && study && (
              <>
                <strong>{study.title}</strong> 스터디의 공간을 예약합니다. 아래에서
                예약할 장소와 날짜, 시간을 선택해주세요.
                {!isStudyOwner && (
                  <p className="reservation-error">
                    스터디 대표자만 스터디룸을 예약할 수 있습니다.
                  </p>
                )}
              </>
            )}
          </div>
        )}


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
              {displayRooms.length}개의 공간
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

          {!loadingRooms && !roomsError && displayRooms.length === 0 && (
            <p className="place-state-message">
              조건에 맞는 스터디룸이 없어요.
            </p>
          )}

          {!loadingRooms && !roomsError && displayRooms.length > 0 && (
            <div className="place-grid">

              {pagedRooms.map((place) => (
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

          {!loadingRooms && !roomsError && roomsTotalPages > 1 && (
            <nav className="place-pagination" aria-label="스터디룸 목록 페이지">
              <button
                type="button"
                className="place-pagination-arrow"
                disabled={roomsCurrentPage === 1}
                onClick={() => setRoomsPage(roomsCurrentPage - 1)}
              >
                ‹
              </button>

              {Array.from({ length: roomsTotalPages }, (_, i) => i + 1).map((page) => (
                <button
                  type="button"
                  key={page}
                  className={`place-pagination-page ${
                    page === roomsCurrentPage ? "active" : ""
                  }`}
                  onClick={() => setRoomsPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className="place-pagination-arrow"
                disabled={roomsCurrentPage === roomsTotalPages}
                onClick={() => setRoomsPage(roomsCurrentPage + 1)}
              >
                ›
              </button>
            </nav>
          )}

        </div>


        {/* ================================
            날짜 / 시간 선택
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

            <h2>이용할 시작 시간을 선택하세요</h2>

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

                  const pastDeadline = isSlotPastDeadline(slot);
                  const remaining = getRemainingCapacity(slot);
                  const full = remaining < peopleCount;
                  const disabled = pastDeadline || full;
                  const isActive = selectedHours.includes(slot.startTime);

                  return (
                    <button
                      type="button"
                      key={slot.startTime}
                      className={isActive ? "active" : ""}
                      disabled={disabled}
                      onClick={() => toggleHour(slot)}
                    >
                      <span>{slot.startTime}</span>
                      {pastDeadline && <small>예약마감</small>}
                      {!pastDeadline && full && <small>정원마감</small>}

                    </button>
                  );
                })}

              </div>
            )}

            {selectedPlace && !loadingAvailability && selectedHours.length > 0
              && !isContiguousSelection && (
              <p className="reservation-error">
                연속된 시간대를 선택해주세요.
              </p>
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
                {effectiveSlot
                  ? `${effectiveSlot.startTime} - ${effectiveSlot.endTime}`
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
              {selectedPlace && effectiveSlot
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
              예약 버튼을 누르면 예약이 접수되고, 결제 완료 시 확정됩니다. 예약은
              이용 시작 후 {RESERVATION_GRACE_PERIOD_MINUTES}분까지만 가능합니다.
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
