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

const ROOMS_PAGE_SIZE = 12;

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

// 예약 목록(reservedList)과 특정 시간대(slot)가 겹치는 인원을 정원에서 뺀 잔여 좌석 수
function computeRemainingCapacity(maxCapacity, reservedList, slot) {
  const slotStart = toMinutes(slot.startTime);
  const slotEnd = toMinutes(slot.endTime);

  const reservedPeople = (reservedList || []).reduce((sum, reservation) => {
    const reservedStart = toMinutes(reservation.startTime.slice(0, 5));
    const reservedEnd = toMinutes(reservation.endTime.slice(0, 5));
    const overlaps = slotStart < reservedEnd && slotEnd > reservedStart;
    return overlaps ? sum + reservation.peopleCount : sum;
  }, 0);

  return maxCapacity - reservedPeople;
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
  const [studyRoomAvailability, setStudyRoomAvailability] = useState({});
  const [loadingStudyAvailability, setLoadingStudyAvailability] = useState(false);

  // 스터디룸 목록
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState("");

  // 검색 / 필터
  const [keyword, setKeyword] = useState("");
  const [activeRegion, setActiveRegion] = useState("전체");
  const [roomsPage, setRoomsPage] = useState(1);

  // 선택 상태
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dateOptions[0].value);
  // 개인 예약(스터디 미연동)에서만 사용: 시작 시각 + 이용 시간(1~N시간)
  const [selectedStartHour, setSelectedStartHour] = useState(null);
  const [duration, setDuration] = useState(1);
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

  // 스터디 예약 모드에서는 지역 필터를 거친 목록에서 다시 한번,
  // 스터디의 고정된 일정에 실제로 남은 자리가 peopleCount 이상인 방만 보여준다.
  const displayRooms = useMemo(() => {
    if (!isStudyMode) return filteredRooms;

    return filteredRooms.filter(
      (room) => (studyRoomAvailability[room.id] ?? -1) >= peopleCount
    );
  }, [isStudyMode, filteredRooms, studyRoomAvailability, peopleCount]);

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

  const studySlot = useMemo(() => {
    if (!study || !study.startTime || !study.endTime) return null;
    return {
      startTime: study.startTime.slice(0, 5),
      endTime: study.endTime.slice(0, 5),
    };
  }, [study]);

  const isStudyOwner =
    !!study && !!currentUser && Number(study.memberId) === Number(currentUser.id);

  const studyDeadlinePassed = useMemo(() => {
    if (!study || !study.studyDate || !study.startTime) return false;
    const deadline = new Date(`${study.studyDate}T${study.startTime}`);
    deadline.setHours(deadline.getHours() - 12);
    return new Date() > deadline;
  }, [study]);

  /* ================================
     스터디 예약 모드: 등록된 전체 스터디룸의 해당 일정 예약 가능 여부 조회
  ================================= */

  useEffect(() => {
    if (!isStudyMode || !study || !studySlot || rooms.length === 0) {
      return;
    }

    let cancelled = false;

    const loadAllAvailability = async () => {
      try {
        setLoadingStudyAvailability(true);

        const entries = await Promise.all(
          rooms.map(async (room) => {
            try {
              const response = await fetch(
                `${API_BASE}/reservations/availability?roomId=${room.id}&date=${study.studyDate}`,
                { credentials: "include" }
              );

              if (!response.ok) return [room.id, 0];

              const reserved = await response.json();
              return [room.id, computeRemainingCapacity(room.maxCapacity, reserved, studySlot)];
            } catch {
              return [room.id, 0];
            }
          })
        );

        if (!cancelled) {
          setStudyRoomAvailability(Object.fromEntries(entries));
        }
      } finally {
        if (!cancelled) setLoadingStudyAvailability(false);
      }
    };

    loadAllAvailability();

    return () => {
      cancelled = true;
    };
  }, [isStudyMode, study, studySlot, rooms]);

  /* ================================
     선택한 장소가 바뀌면 초기화
  ================================= */

  useEffect(() => {
    setSelectedStartHour(null);
    setDuration(1);
    setReservationError("");

    if (selectedPlace && !isStudyMode) {
      setPeopleCount(selectedPlace.minCapacity);
    } else if (!selectedPlace && !isStudyMode) {
      setPeopleCount(1);
    }
  }, [selectedPlace]);

  useEffect(() => {
    setSelectedStartHour(null);
    setDuration(1);
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

  // 스터디룸은 통째로 빌리는 게 아니라 정원(maxCapacity)까지 여러 사람이
  // 같은 시간대를 나눠 쓸 수 있으므로, 겹치는 예약이 있다고 바로 마감
  // 처리하지 않고 "이미 찬 인원"을 뺀 잔여 좌석 수로 판단한다.
  const getRemainingCapacity = (slot) => {
    if (!selectedPlace) return 0;

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

  // 오늘 날짜를 선택했을 때, 이미 지난 시간대는 애초에 선택하지 못하도록 막는다
  // (서버도 동일하게 막지만, 눌러보고 나서야 에러를 보게 하는 대신 미리 비활성화한다).
  const isPastSlot = (slot) => {
    const now = new Date();
    const todayValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;

    if (selectedDate !== todayValue) return false;

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return toMinutes(slot.startTime) < nowMinutes;
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

  // 시작 시각(startTimeStr)부터 연속으로 잔여 좌석이 peopleCount 이상이고
  // 지난 시간이 아닌 시간대가 몇 시간 이어지는지 (= 선택 가능한 최대 이용 시간)
  const getMaxDurationFrom = (startTimeStr) => {
    if (!selectedPlace) return 0;

    const startIndex = TIME_SLOTS.findIndex((s) => s.startTime === startTimeStr);
    if (startIndex === -1) return 0;

    let count = 0;
    for (let i = startIndex; i < TIME_SLOTS.length; i += 1) {
      const slot = TIME_SLOTS[i];
      if (isPastSlot(slot)) break;
      if (getRemainingCapacity(slot) < peopleCount) break;
      count += 1;
    }
    return count;
  };

  // 인원수를 늘렸을 때 이미 선택해둔 시간대가 잔여 좌석보다 커지면
  // 이용 시간을 다시 계산해 맞추거나(가능하면), 선택을 풀어서 다시 고르게 한다.
  useEffect(() => {
    if (!selectedStartHour) return;

    const maxDuration = getMaxDurationFrom(selectedStartHour);

    if (maxDuration <= 0) {
      setSelectedStartHour(null);
      setDuration(1);
    } else if (duration > maxDuration) {
      setDuration(maxDuration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peopleCount]);

  /* ================================
     예약 요약 계산
  ================================= */

  // 개인 예약: 시작 시각 + 이용 시간으로 조합한 시간대
  const personalSlot = useMemo(() => {
    if (isStudyMode || !selectedStartHour) return null;

    const startIndex = TIME_SLOTS.findIndex((s) => s.startTime === selectedStartHour);
    const endIndex = startIndex + duration - 1;
    if (startIndex === -1 || endIndex >= TIME_SLOTS.length) return null;

    return {
      startTime: TIME_SLOTS[startIndex].startTime,
      endTime: TIME_SLOTS[endIndex].endTime,
    };
  }, [isStudyMode, selectedStartHour, duration]);

  // 스터디 예약이면 스터디에서 정한 일정 그대로, 개인 예약이면 방금 고른 시간대
  const effectiveSlot = isStudyMode ? studySlot : personalSlot;
  const effectiveDate = isStudyMode ? study?.studyDate : selectedDate;

  const hours = effectiveSlot
    ? (toMinutes(effectiveSlot.endTime) - toMinutes(effectiveSlot.startTime)) / 60
    : 0;

  const totalPrice =
    selectedPlace && effectiveSlot
      ? Number(selectedPlace.pricePerHour) * hours * peopleCount
      : 0;

  const selectedDateLabel = isStudyMode
    ? (study?.studyDate ? study.studyDate.replaceAll("-", ".") : "")
    : dateOptions.find((date) => date.value === selectedDate)?.label || selectedDate;

  // 스터디 예약 모드에서 현재 선택한 방이 실제로 그 일정에 예약 가능한지
  const studySelectedRoomRemaining = selectedPlace
    ? studyRoomAvailability[selectedPlace.id] ?? 0
    : 0;

  const canReserve = isStudyMode
    ? !!study &&
      !!selectedPlace &&
      isStudyOwner &&
      !studyDeadlinePassed &&
      peopleCount >= selectedPlace.minCapacity &&
      peopleCount <= selectedPlace.maxCapacity &&
      studySelectedRoomRemaining >= peopleCount &&
      !submitting
    : !!selectedPlace &&
      !!effectiveSlot &&
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
          reservationDate: effectiveDate,
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
                <strong>{study.title}</strong> 스터디의 공간을 예약합니다. 일정은{" "}
                <strong>
                  {study.studyDate?.replaceAll("-", ".")} {studySlot?.startTime} ~ {studySlot?.endTime}
                </strong>
                로 고정되어 있으며, 아래에서 이 시간에 예약 가능한 공간만 선택할 수 있습니다.
                {study.paymentDeadline && (
                  <>
                    {" "}결제 마감:{" "}
                    <strong>
                      {study.paymentDeadline.slice(0, 16).replace("T", " ")}
                    </strong>
                  </>
                )}
                {!isStudyOwner && (
                  <p className="reservation-error">
                    스터디 대표자만 스터디룸을 예약할 수 있습니다.
                  </p>
                )}
                {studyDeadlinePassed && (
                  <p className="reservation-error">
                    결제 마감(스터디 시작 12시간 전)이 지나 더 이상 예약할 수 없습니다.
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

          {!loadingRooms && !roomsError && isStudyMode && loadingStudyAvailability && (
            <p className="place-state-message">
              선택한 일정에 예약 가능한 공간을 확인하는 중입니다...
            </p>
          )}

          {!loadingRooms && !roomsError && isStudyMode && !loadingStudyAvailability
            && filteredRooms.length > 0 && displayRooms.length === 0 && (
            <p className="place-state-message">
              해당 시간에는 예약 가능한 스터디 공간이 없습니다.
            </p>
          )}

          {!loadingRooms && !roomsError && filteredRooms.length === 0 && (
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
            날짜 / 시간 (개인 예약에서만 직접 선택. 스터디 예약은 스터디 일정에 고정됨)
        ================================= */}

        {!isStudyMode && (
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

              <h2>시작 시간을 선택하세요</h2>

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
                    const past = isPastSlot(slot);
                    const maxDuration = getMaxDurationFrom(slot.startTime);
                    const disabled = past || maxDuration === 0;
                    const isActive = selectedStartHour === slot.startTime;

                    return (
                      <button
                        type="button"
                        key={slot.startTime}
                        className={isActive ? "active" : ""}
                        disabled={disabled}
                        onClick={() => {
                          setSelectedStartHour(slot.startTime);
                          setDuration(1);
                        }}
                      >
                        <span>{slot.startTime}</span>
                        {past && <small>지난 시간</small>}
                        {!past && maxDuration === 0 && <small>예약마감</small>}
                      </button>
                    );
                  })}

                </div>
              )}

              {selectedPlace && !loadingAvailability && selectedStartHour && (
                <>
                  <h2 style={{ marginTop: "18px" }}>이용 시간을 선택하세요</h2>

                  <div className="time-list">

                    {Array.from(
                      { length: getMaxDurationFrom(selectedStartHour) },
                      (_, i) => i + 1
                    ).map((h) => (
                      <button
                        type="button"
                        key={h}
                        className={duration === h ? "active" : ""}
                        onClick={() => setDuration(h)}
                      >
                        <span>{h}시간</span>
                      </button>
                    ))}

                  </div>
                </>
              )}

            </div>

          </div>
        )}


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
