import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import "./Mentoring.css";
import mentoringBg from "../../assets/images/mentoring-bg.jpg";

function Mentoring() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [scrollY, setScrollY] = useState(0);
  const [category, setCategory] = useState("전체");
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [reservationMentor, setReservationMentor] = useState(null);
  const [reviewMentor, setReviewMentor] = useState(null);
  // 예약 상세보기 모달: { item, role } (role: "mentor" | "applicant")
  const [detailReservation, setDetailReservation] = useState(null);
  // 멘토링 채팅 모달: { item, role } (role: "mentor" | "applicant")
  const [chatReservation, setChatReservation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef(null);
  // 거절 사유 입력 모달 대상 예약
  const [rejectingReservation, setRejectingReservation] = useState(null);
  // 삭제 확인 모달 대상 멘토링(offering)
  const [deletingOffering, setDeletingOffering] = useState(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [isEditingMentor, setIsEditingMentor] = useState(false);
  // registerMode: "profile" = 멘토 등록/수정, "offering" = 멘토링 등록/수정
  const [registerMode, setRegisterMode] = useState("profile");
  const [editingOfferingId, setEditingOfferingId] = useState(null);
  // 수정 중인 멘토링에서 이미 예약이 걸려 삭제/시간 변경이 불가능한 날짜 목록
  const [registerLockedDates, setRegisterLockedDates] = useState([]);
  const [user, setUser] = useState(null);
  const [myMentor, setMyMentor] = useState(null);
  const [myOfferings, setMyOfferings] = useState([]);
  const [myOfferingsPage, setMyOfferingsPage] = useState(1);
  const MY_OFFERINGS_PAGE_SIZE = 12;
  const [selectedMentorOfferings, setSelectedMentorOfferings] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [mentorGridPage, setMentorGridPage] = useState(1);
  const MENTOR_GRID_PAGE_SIZE = 4;
  useEffect(() => {
    setMentorGridPage(1);
  }, [category]);
  const [myRequestsPage, setMyRequestsPage] = useState(1);
  const [receivedRequestsPage, setReceivedRequestsPage] = useState(1);
  const [myHistoryMentorPage, setMyHistoryMentorPage] = useState(1);
  const [myHistoryApplicantPage, setMyHistoryApplicantPage] = useState(1);
  const RECORDS_PAGE_SIZE = 9;
  const [bookedReservationDates, setBookedReservationDates] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({
    averageRating: 0,
    reviewCount: 0,
    reviews: []
  });
  const [eligibleReservations, setEligibleReservations] = useState([]);
  const [reviewForm, setReviewForm] = useState({
    reservationId: "",
    rating: 5,
    content: ""
  });
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [myReservations, setMyReservations] = useState([]);
  const [receivedReservations, setReceivedReservations] = useState([]);
  const [myReviewEligibleIds, setMyReviewEligibleIds] = useState([]);

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [registerCalendarDate, setRegisterCalendarDate] = useState(new Date());

  const [registerForm, setRegisterForm] = useState({
    title: "",
    career: "",
    careerDetail: "",
    certificates: "",
    skills: [],
    consultationTypes: [],
    mentoringType: "",
    github: "",
    velog: "",
    portfolio: "",
    introduction: "",
    price: "",
    availableDays: [],
    availableDates: [],
    availableStart: "",
    availableEnd: "",
    availableSchedules: []
  });

  const [reservationForm, setReservationForm] = useState({
    consultationTypes: [],
    skills: [],
    date: "",
    time: "",
    problem: "",
    file: null
  });

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

  const consultationTypes = [
    "코드 오류 해결",
    "코드 리뷰",
    "프로젝트 구조",
    "취업 / 포트폴리오",
    "기술 선택",
    "개발 공부 방향",
    "면접 준비",
    "기타"
  ];

  const skillOptions = [
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

  const weekDays = ["월", "화", "수", "목", "금", "토", "일"];

  const filteredMentors =
    category === "전체"
      ? mentors
      : mentors.filter((mentor) => mentor.skills.includes(category));

  // 공개 mentor-grid는 멘토링(offering) 단위로 필터링한다.
  const filteredOfferings =
    category === "전체"
      ? offerings
      : offerings.filter((offering) => offering.skillTags.includes(category));

  const isMyOffering = (offering) =>
    !!myMentor && offering.mentorId === myMentor.id;

  // "내가 등록한 멘토링"은 관리(진행 중/예정) 화면이다. 슬롯이 하나라도
  // 남아있으면(신청 가능/예약중/승인됨) 계속 보여주고, 그 안의 완료된
  // 슬롯만 개별적으로 숨긴다(아래 카드 렌더링에서 처리). 다만 offering의
  // 슬롯이 전부 완료 상태라면 더는 관리할 게 없으므로 카드 자체를
  // "나의 멘토링 기록"으로 넘기고 여기서는 제외한다.
  const visibleMyOfferings = myOfferings.filter((offering) => {
    const slots = Array.isArray(offering.slots) ? offering.slots : [];
    return !(
      slots.length > 0 &&
      slots.every((slot) => slot.reservationStatus === "COMPLETED")
    );
  });

  // 여러 목록(공개 멘토 카드, 나의 멘토링 기록 각 섹션)에서 공통으로 쓰는
  // 페이지네이션 계산. 항목 수가 바뀌어 현재 페이지가 범위를 벗어나면
  // 자동으로 마지막 페이지로 보정한다.
  const paginate = (list, page, size) => {
    const totalPages = Math.max(1, Math.ceil(list.length / size));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * size;
    return {
      pageItems: list.slice(start, start + size),
      totalPages,
      currentPage
    };
  };

  // "내가 등록한 멘토링"에서 이미 쓰던 것과 동일한 페이지네이션 UI를
  // 재사용한다(같은 CSS 클래스를 그대로 써서 디자인을 통일한다).
  const renderPaginationNav = (totalPages, currentPage, onPageChange, ariaLabel) => {
    if (totalPages <= 1) return null;

    return (
      <nav className="offering-pagination" aria-label={ariaLabel}>
        <button
          type="button"
          className="offering-pagination-arrow"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          ‹
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            type="button"
            key={page}
            className={`offering-pagination-page ${
              page === currentPage ? "active" : ""
            }`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          className="offering-pagination-arrow"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          ›
        </button>
      </nav>
    );
  };

  const getProfileImage = (mentor) => mentor?.profileImage || "";

  // "내가 등록한 멘토링"의 모든 카드는 같은 멘토(나)의 것이므로,
  // 공개 mentor-grid와 동일한 /api${profileImageUrl} 규칙으로 한 번만 계산해 재사용한다.
  const myAvatarImage = myMentor?.profileImageUrl
    ? `/api${myMentor.profileImageUrl}`
    : "";

  const normalizeLinkUrl = (value, service) => {
    const trimmedValue = value?.trim();
    if (!trimmedValue) return "";

    const candidate = /^https?:\/\//i.test(trimmedValue)
      ? trimmedValue
      : `https://${trimmedValue}`;

    try {
      const url = new URL(candidate);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        !url.hostname.includes(".")
      ) {
        return "";
      }

      const host = url.hostname.toLowerCase();
      const pathParts = url.pathname.split("/").filter(Boolean);
      if (
        service === "github" &&
        (!['github.com', 'www.github.com'].includes(host) || pathParts.length === 0)
      ) {
        return "";
      }
      if (
        service === "velog" &&
        (!['velog.io', 'www.velog.io'].includes(host) ||
          !url.pathname.startsWith('/@') ||
          url.pathname.length <= 2)
      ) {
        return "";
      }
      return url.href;
    } catch {
      return "";
    }
  };

  const hasMentorLinks = (mentor) =>
    Boolean(
      normalizeLinkUrl(mentor?.github, "github") ||
        normalizeLinkUrl(mentor?.velog, "velog") ||
        normalizeLinkUrl(mentor?.portfolio, "portfolio")
    );

  const isMyMentorCard = (mentor) => {
    if (!mentor) return false;
    if (user && mentor.memberId && user.id && mentor.memberId === user.id) {
      return true;
    }
    if (
      myMentor &&
      (myMentor.id === mentor.id ||
        (myMentor.memberId && myMentor.memberId === mentor.memberId))
    ) {
      return true;
    }
    return false;
  };

  const parseSchedulesFromMentor = (mentor) => {
    if (!mentor) return [];

    if (mentor.availableSchedules) {
      try {
        const parsed =
          typeof mentor.availableSchedules === "string"
            ? JSON.parse(mentor.availableSchedules)
            : mentor.availableSchedules;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("스케줄 파싱 오류:", e);
      }
    }

    const dates = Array.isArray(mentor.availableDates)
      ? mentor.availableDates
      : typeof mentor.availableDates === "string"
      ? mentor.availableDates
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    return dates.map((d) => {
      const parts = d.split("-");
      let dayName = "";
      if (parts.length === 3) {
        const dt = new Date(
          parseInt(parts[0], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[2], 10)
        );
        dayName = getWeekDayName(dt);
      }
      return {
        date: d,
        day: dayName || "",
        startTime: mentor.availableStart || "10:00",
        endTime: mentor.availableEnd || "18:00"
      };
    });
  };

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const formatRating = (value) => Number(value || 0).toFixed(1);

  const renderStars = (rating) => {
    const score = Math.max(0, Math.min(5, Number(rating) || 0));
    return "★".repeat(score) + "☆".repeat(5 - score);
  };

  const reservationStatusLabel = (status) => {
    if (status === "APPROVED") return "승인";
    if (status === "REJECTED") return "거절";
    if (status === "COMPLETED") return "완료";
    return "대기";
  };

  // 예약 날짜(YYYY-MM-DD) 기준으로 오늘까지 남은 일수를 계산한다.
  const getDaysUntil = (dateString) => {
    if (!dateString) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(target.getTime())) return null;
    target.setHours(0, 0, 0, 0);

    const diffMs = target.getTime() - today.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  };

  // "나의 멘토링 기록"에서 보여줄 상태(이모지/라벨/안내 문구)를
  // 예약 상태 + 예약 날짜를 기준으로 계산한다.
  //
  // PENDING    → 🟡 예약중
  // APPROVED   → 🟢 멘토링 예정 (D-day) / 오늘이면 🔵 멘토링 진행
  // COMPLETED  → ✓ 멘토링 완료
  // REJECTED   → ✕ 거절됨
  // role: "applicant" (B, 신청자) | "mentor" (A, 멘토)
  const getReservationPhase = (item, role = "applicant") => {
    if (item.status === "PENDING") {
      return {
        key: "pending",
        emoji: "🟡",
        label: "예약중",
        message:
          role === "mentor"
            ? "신청을 확인하고 승인 또는 거절해주세요."
            : "멘토의 승인을 기다리고 있습니다."
      };
    }

    if (item.status === "REJECTED") {
      const reasonText = item.rejectReason?.trim();

      return {
        key: "rejected",
        emoji: "🔴",
        label: "예약 거절",
        message:
          role === "mentor"
            ? reasonText
              ? `이 신청을 거절했습니다.\n사유: ${reasonText}`
              : "이 신청을 거절했습니다."
            : reasonText
            ? `멘토 사정으로 해당 예약이 거절되었습니다.\n사유: ${reasonText}`
            : "멘토 사정으로 해당 예약이 거절되었습니다."
      };
    }

    if (item.status === "APPROVED") {
      // 멘토가 승인했더라도 결제가 완료되지 않았다면 예약이 아직
      // 최종 확정된 것이 아니므로 "결제 대기중" 상태로 먼저 보여준다.
      if (item.paymentStatus !== "PAID") {
        return {
          key: "payment-pending",
          emoji: "💳",
          label: "결제 대기중",
          message:
            role === "mentor"
              ? "신청자의 결제를 기다리고 있습니다."
              : "결제를 완료하면 멘토링이 최종 확정됩니다."
        };
      }

      const daysLeft = getDaysUntil(item.reservationDate);

      if (daysLeft === 0) {
        return {
          key: "ongoing",
          emoji: "🔵",
          label: "멘토링 진행",
          message: "오늘 멘토링이 진행됩니다."
        };
      }

      if (daysLeft !== null && daysLeft > 0) {
        return {
          key: "upcoming",
          emoji: "🟢",
          label: "멘토링 예정",
          message: `멘토링까지 ${daysLeft}일 남았습니다.`
        };
      }

      return {
        key: "ongoing",
        emoji: "🔵",
        label: "멘토링 진행",
        message:
          role === "mentor"
            ? "멘토링 일정이 지났습니다. 수업 완료 처리를 확인해주세요."
            : "멘토링 일정을 확인하고 수업 완료를 진행해주세요."
      };
    }

    if (item.status === "COMPLETED") {
      return {
        key: "completed",
        emoji: "✓",
        label: "멘토링 완료",
        message: ""
      };
    }

    return {
      key: (item.status || "").toLowerCase(),
      emoji: "",
      label: reservationStatusLabel(item.status),
      message: ""
    };
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    return target < today;
  };

  const getCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    const daysInMonth = lastDay.getDate();
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getRegisterCalendarDays = () => {
    const year = registerCalendarDate.getFullYear();
    const month = registerCalendarDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    const daysInMonth = lastDay.getDate();
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getWeekDayName = (date) => {
    if (!date) return "";
    const day = date.getDay();

    const dayMap = {
      0: "일",
      1: "월",
      2: "화",
      3: "수",
      4: "목",
      5: "금",
      6: "토"
    };

    return dayMap[day] || "";
  };

  const isAvailableMentorDay = (date) => {
    if (!reservationMentor || !date) return false;
    const dateString = formatDateString(date);

    if (reservationMentor.availableSchedules?.length > 0) {
      return reservationMentor.availableSchedules.some(
        (s) => s.date === dateString
      );
    }

    if (reservationMentor.availableDates?.length > 0) {
      return reservationMentor.availableDates.includes(dateString);
    }

    if (reservationMentor.availableDays?.length > 0) {
      const dayName = getWeekDayName(date);
      return reservationMentor.availableDays.includes(dayName);
    }

    return true;
  };

  const isBookedMentorDate = (date) =>
    Boolean(date && bookedReservationDates.includes(formatDateString(date)));

  const getReservationSchedule = (mentor, dateString) => {
    const schedule = mentor?.availableSchedules?.find(
      (item) => item.date === dateString
    );
    if (schedule?.startTime && schedule?.endTime) return schedule;

    if (mentor?.availableStart && mentor?.availableEnd) {
      return {
        date: dateString,
        startTime: mentor.availableStart,
        endTime: mentor.availableEnd
      };
    }
    return null;
  };

  const handleCalendarDateClick = (date) => {
    if (!date) return;

    if (isPastDate(date)) {
      return;
    }

    if (!isAvailableMentorDay(date)) {
      alert("멘토가 상담 가능한 날짜가 아닙니다.");
      return;
    }

    const dateString = formatDateString(date);
    const matchingSchedule = getReservationSchedule(
      reservationMentor,
      dateString
    );

    setReservationForm((prev) => ({
      ...prev,
      date: dateString,
      time: matchingSchedule
        ? `${matchingSchedule.startTime} ~ ${matchingSchedule.endTime}`
        : ""
    }));
  };

  const moveCalendarMonth = (amount) => {
    setCalendarDate(
      (prev) =>
        new Date(
          prev.getFullYear(),
          prev.getMonth() + amount,
          1
        )
    );
  };

  const moveRegisterCalendarMonth = (amount) => {
    setRegisterCalendarDate(
      (prev) =>
        new Date(
          prev.getFullYear(),
          prev.getMonth() + amount,
          1
        )
    );
  };

  const isToday = (date) => {
    if (!date) return false;

    return formatDateString(date) === getTodayString();
  };

  const isSelectedDate = (date) => {
    if (!date || !reservationForm.date) return false;

    return formatDateString(date) === reservationForm.date;
  };

  const isRegisterDateSelected = (date) => {
    if (!date) return false;
    const dateString = formatDateString(date);

    return registerForm.availableSchedules.some(
      (s) => s.date === dateString
    );
  };

  const toggleAvailableSchedule = (date) => {
    if (!date || isPastDate(date)) return;

    const dateString = formatDateString(date);

    if (registerLockedDates.includes(dateString)) {
      alert("이미 예약이 있는 날짜는 삭제하거나 변경할 수 없습니다.");
      return;
    }

    const dayName = getWeekDayName(date);

    setRegisterForm((prev) => {
      const exists = prev.availableSchedules.some(
        (s) => s.date === dateString
      );

      const nextSchedules = exists
        ? prev.availableSchedules.filter(
            (s) => s.date !== dateString
          )
        : [
            ...prev.availableSchedules,
            {
              date: dateString,
              day: dayName,
              startTime: "10:00",
              endTime: "18:00"
            }
          ].sort((a, b) => a.date.localeCompare(b.date));

      return {
        ...prev,
        availableSchedules: nextSchedules,
        availableDates: nextSchedules.map((s) => s.date),
        availableDays: Array.from(
          new Set(nextSchedules.map((s) => s.day))
        )
      };
    });
  };

  const updateScheduleTime = (dateString, field, value) => {
    if (registerLockedDates.includes(dateString)) {
      alert("이미 예약이 있는 날짜는 삭제하거나 변경할 수 없습니다.");
      return;
    }

    setRegisterForm((prev) => ({
      ...prev,
      availableSchedules: prev.availableSchedules.map((s) => {
        if (s.date === dateString) {
          return { ...s, [field]: value };
        }
        return s;
      })
    }));
  };

  const removeSchedule = (dateString) => {
    if (registerLockedDates.includes(dateString)) {
      alert("이미 예약이 있는 날짜는 삭제하거나 변경할 수 없습니다.");
      return;
    }

    setRegisterForm((prev) => {
      const nextSchedules = prev.availableSchedules.filter(
        (s) => s.date !== dateString
      );

      return {
        ...prev,
        availableSchedules: nextSchedules,
        availableDates: nextSchedules.map((s) => s.date),
        availableDays: Array.from(
          new Set(nextSchedules.map((s) => s.day))
        )
      };
    });
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);

    window.addEventListener("scroll", handleScroll, {
      passive: true
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/member/me", {
          method: "GET",
          credentials: "include"
        });

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error("사용자 정보 조회 오류:", error);
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!user) {
      setMyMentor(null);
      return;
    }

    const fetchMyMentor = async () => {
      try {
        const response = await fetch("/api/mentor/me", {
          method: "GET",
          credentials: "include"
        });

        if (response.ok) {
          const data = await response.json();
          setMyMentor(data);
        } else {
          setMyMentor(null);
        }
      } catch (error) {
        console.error("내 멘토 정보 조회 오류:", error);
        setMyMentor(null);
      }
    };

    fetchMyMentor();
  }, [user]);

  // 내가 등록한 멘토링(여러 개) 목록 — 멘토 등록(MentorProfile)과는
  // 별개의 데이터이므로 별도 API로 조회한다.
  const fetchMyOfferings = async () => {
    if (!user) {
      setMyOfferings([]);
      return;
    }

    try {
      const response = await fetch("/api/mentor/offerings/me", {
        credentials: "include"
      });
      if (!response.ok) {
        setMyOfferings([]);
        return;
      }
      const data = await response.json();
      setMyOfferings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("내가 등록한 멘토링 조회 오류:", error);
      setMyOfferings([]);
    }
  };

  useEffect(() => {
    fetchMyOfferings();
  }, [myMentor]);

  const fetchMentors = async () => {
    try {
      const response = await fetch("/api/mentor", {
        method: "GET",
        credentials: "include"
      });

      if (!response.ok) {
        console.error(
          "멘토 목록 조회 실패:",
          response.status
        );
        return;
      }

      const data = await response.json();

      const mentorList = data.map((mentor) => {
        const schedules = parseSchedulesFromMentor(mentor);

        return {
          id: mentor.id,
          memberId: mentor.memberId,
          name: mentor.nickname || "멘토",
          career: mentor.career || "",
          careerDetail: mentor.careerDetail || "",
          skills: mentor.skills
            ? mentor.skills
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
          description: mentor.introduction || "",
          price: mentor.price ?? 0,
          mentoringType: mentor.mentoringType || "",
          consultationTypes: mentor.consultationFields
            ? mentor.consultationFields
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
          certificates: mentor.certificates
            ? mentor.certificates
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
          github: mentor.github || "",
          velog: mentor.velog || "",
          portfolio: mentor.portfolio || "",
          availableDays: mentor.availableDays
            ? mentor.availableDays
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
          availableDates: mentor.availableDates
            ? mentor.availableDates
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
          availableStart: mentor.availableStart || "",
          availableEnd: mentor.availableEnd || "",
          availableSchedules: schedules,
          profileImage: mentor.profileImageUrl
            ? `/api${mentor.profileImageUrl}`
            : "",
          status: mentor.status || "",
          averageRating: mentor.averageRating ?? 0,
          reviewCount: mentor.reviewCount ?? 0
        };
      });

      setMentors(mentorList);
    } catch (error) {
      console.error("멘토 목록 조회 오류:", error);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  // 공개 mentor-grid는 "사람"이 아니라 "등록한 멘토링(MentoringOffering)" 단위로 표시한다.
  // 같은 멘토가 여러 멘토링을 등록했다면 그만큼 여러 카드로 노출된다.
  const fetchOfferings = async () => {
    try {
      const response = await fetch("/api/mentor/offerings", {
        method: "GET",
        credentials: "include"
      });

      if (!response.ok) {
        console.error("공개 멘토링 목록 조회 실패:", response.status);
        return;
      }

      const data = await response.json();

      // 주의: offering.skills / offering.consultationFields는 원래 서버가
      // 콤마로 구분된 "문자열"로 내려주고, openOfferingEditModal/openReservationForOffering이
      // 그 문자열을 그대로 split(",")해서 쓴다. 여기서 배열로 덮어써버리면
      // (배열에는 .split이 없어) 그 두 함수가 클릭 시 예외를 던지면서
      // "수정하기"/"신청하기" 버튼이 아무 반응 없는 것처럼 보이게 된다.
      // 그래서 원본 문자열 필드는 그대로 두고, 화면 표시/필터링에 필요한
      // 배열은 별도 이름(skillTags/fieldTags)으로만 추가한다.
      const offeringList = Array.isArray(data)
        ? data.map((offering) => ({
            ...offering,
            skillTags: offering.skills
              ? offering.skills
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
              : [],
            fieldTags: offering.consultationFields
              ? offering.consultationFields
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean)
              : [],
            slots: Array.isArray(offering.slots) ? offering.slots : []
          }))
        : [];

      setOfferings(offeringList);
    } catch (error) {
      console.error("공개 멘토링 목록 조회 오류:", error);
    }
  };

  useEffect(() => {
    fetchOfferings();
  }, []);

  const fetchMyReservations = async () => {
    if (!user) {
      setMyReservations([]);
      return;
    }

    try {
      const response = await fetch("/api/mentor/reservation/my", {
        credentials: "include"
      });
      if (!response.ok) {
        setMyReservations([]);
        return;
      }
      const data = await response.json();
      setMyReservations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("내 멘토링 신청 조회 오류:", error);
      setMyReservations([]);
    }
  };

  const fetchReceivedReservations = async () => {
    if (!user || !myMentor) {
      setReceivedReservations([]);
      return;
    }

    try {
      const response = await fetch("/api/mentor/reservation/received", {
        credentials: "include"
      });
      if (!response.ok) {
        setReceivedReservations([]);
        return;
      }
      const data = await response.json();
      setReceivedReservations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("받은 멘토링 신청 조회 오류:", error);
      setReceivedReservations([]);
    }
  };

  useEffect(() => {
    fetchMyReservations();
  }, [user]);

  useEffect(() => {
    fetchReceivedReservations();
  }, [user, myMentor]);

  // 나의 멘토링 기록(완료된 예약)에서 "후기 작성하기 / 후기 작성 완료"를
  // 구분하기 위해, 기존 후기 모달에서 쓰던 것과 동일한 API를
  // 멘토 필터 없이 호출해 작성 가능한 예약 id만 모아둔다.
  const fetchMyReviewEligibleIds = async () => {
    if (!user) {
      setMyReviewEligibleIds([]);
      return;
    }

    try {
      const response = await fetch("/api/mentor/reviews/eligible/me", {
        credentials: "include"
      });
      if (!response.ok) {
        setMyReviewEligibleIds([]);
        return;
      }
      const data = await response.json();
      setMyReviewEligibleIds(
        Array.isArray(data) ? data.map((item) => item.reservationId) : []
      );
    } catch (error) {
      console.error("후기 작성 가능 목록 조회 오류:", error);
      setMyReviewEligibleIds([]);
    }
  };

  useEffect(() => {
    fetchMyReviewEligibleIds();
  }, [user]);

  // 멘토 상세 모달에서 그 멘토가 등록한 멘토링 목록을 조회한다.
  // (다른 사용자의 "멘토 찾기" 화면 — 로그인 여부와 무관하게 공개 조회)
  useEffect(() => {
    if (!selectedMentor) {
      setSelectedMentorOfferings([]);
      return;
    }

    const loadOfferings = async () => {
      try {
        const response = await fetch(
          `/api/mentor/offerings/mentor/${selectedMentor.id}`
        );
        if (!response.ok) {
          setSelectedMentorOfferings([]);
          return;
        }
        const data = await response.json();
        setSelectedMentorOfferings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("멘토링 목록 조회 오류:", error);
        setSelectedMentorOfferings([]);
      }
    };

    loadOfferings();
  }, [selectedMentor]);

  useEffect(() => {
    if (!reviewMentor) {
      return;
    }

    const loadReviewData = async () => {
      try {
        const response = await fetch(
          `/api/mentor/reviews/${reviewMentor.id}`,
          { credentials: "include" }
        );
        if (response.ok) {
          const data = await response.json();
          setReviewSummary({
            averageRating: data.averageRating ?? 0,
            reviewCount: data.reviewCount ?? 0,
            reviews: Array.isArray(data.reviews) ? data.reviews : []
          });
        } else {
          setReviewSummary({
            averageRating: 0,
            reviewCount: 0,
            reviews: []
          });
        }
      } catch (error) {
        console.error("후기 조회 오류:", error);
        setReviewSummary({
          averageRating: 0,
          reviewCount: 0,
          reviews: []
        });
      }

      setEditingReviewId(null);
      setReviewForm({
        reservationId: "",
        rating: 5,
        content: ""
      });

      if (!user) {
        setEligibleReservations([]);
        return;
      }

      try {
        const response = await fetch("/api/mentor/reviews/eligible/me", {
          credentials: "include"
        });
        if (!response.ok) {
          setEligibleReservations([]);
          return;
        }
        const data = await response.json();
        const list = Array.isArray(data)
          ? data.filter((item) => item.mentorId === reviewMentor.id)
          : [];
        setEligibleReservations(list);
        if (list.length === 1) {
          setReviewForm((prev) => ({
            ...prev,
            reservationId: String(list[0].reservationId)
          }));
        }
      } catch (error) {
        console.error("작성 가능 후기 조회 오류:", error);
        setEligibleReservations([]);
      }
    };

    loadReviewData();
  }, [reviewMentor, user]);

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;

    setRegisterForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleRegisterArray = (name, value) => {
    setRegisterForm((prev) => ({
      ...prev,
      [name]: prev[name].includes(value)
        ? prev[name].filter((item) => item !== value)
        : [...prev[name], value]
    }));
  };

  const toggleReservationArray = (name, value) => {
    setReservationForm((prev) => ({
      ...prev,
      [name]: prev[name].includes(value)
        ? prev[name].filter((item) => item !== value)
        : [...prev[name], value]
    }));
  };

  const handleReservationChange = (e) => {
    const { name, value } = e.target;

    setReservationForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert("파일은 20MB 이하만 첨부할 수 있습니다.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);

    setReservationForm((prev) => ({
      ...prev,
      file
    }));
  };

  const removeFile = () => {
    setSelectedFile(null);

    setReservationForm((prev) => ({
      ...prev,
      file: null
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetRegisterForm = () => {
    setRegisterForm({
      title: "",
      career: "",
      careerDetail: "",
      certificates: "",
      skills: [],
      consultationTypes: [],
      mentoringType: "",
      github: "",
      velog: "",
      portfolio: "",
      introduction: "",
      price: "",
      availableDays: [],
      availableDates: [],
      availableStart: "",
      availableEnd: "",
      availableSchedules: []
    });
  };

  const openRegisterModal = () => {
    if (!user) {
      alert("멘토 등록은 로그인 후 이용할 수 있습니다.");
      navigate("/login");
      return;
    }

    setRegisterMode("profile");
    setEditingOfferingId(null);

    if (myMentor) {
      const schedules = parseSchedulesFromMentor(myMentor);

      setRegisterForm({
        title: myMentor.title || "",
        career: myMentor.career || "",
        careerDetail: myMentor.careerDetail || "",
        certificates: myMentor.certificates || "",
        skills: myMentor.skills
          ? myMentor.skills
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        consultationTypes: myMentor.consultationFields
          ? myMentor.consultationFields
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        mentoringType: myMentor.mentoringType || "",
        github: myMentor.github || "",
        velog: myMentor.velog || "",
        portfolio: myMentor.portfolio || "",
        introduction: myMentor.introduction || "",
        price: myMentor.price ?? "",
        availableDays: myMentor.availableDays
          ? myMentor.availableDays
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        availableDates: myMentor.availableDates
          ? myMentor.availableDates
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        availableStart: myMentor.availableStart || "",
        availableEnd: myMentor.availableEnd || "",
        availableSchedules: schedules
      });

      setIsEditingMentor(true);
    } else {
      resetRegisterForm();
      setIsEditingMentor(false);
    }

    const today = new Date();

    setRegisterCalendarDate(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );

    setShowRegister(true);
  };

  // =====================================================
  // 멘토링 등록/수정 (멘토 프로필과는 별개의 데이터)
  //
  // A는 멘토로 한 번만 등록하지만, 실제로 제공하는 멘토링은
  // Java / Spring / React 처럼 여러 개를 등록할 수 있다.
  // =====================================================

  const openOfferingCreateModal = () => {
    if (!user) {
      alert("멘토 등록은 로그인 후 이용할 수 있습니다.");
      navigate("/login");
      return;
    }

    // "멘토 등록하기"를 처음 누르는 경우에도(아직 MentorProfile이 없어도)
    // 곧바로 새 멘토링 등록 폼을 열 수 있다. MentorProfile은 서버에서
    // 이 폼을 처음 제출할 때 자동으로 함께 생성된다.
    resetRegisterForm();
    setRegisterMode("offering");
    setEditingOfferingId(null);
    setRegisterLockedDates([]);

    const today = new Date();
    setRegisterCalendarDate(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );

    setShowRegister(true);
  };

  const openDeleteOfferingModal = (offering) => {
    setDeletingOffering(offering);
  };

  const closeDeleteOfferingModal = () => {
    setDeletingOffering(null);
  };

  const confirmDeleteOffering = async () => {
    if (!deletingOffering) return;

    try {
      const response = await fetch(
        `/api/mentor/offerings/${deletingOffering.id}`,
        {
          method: "DELETE",
          credentials: "include"
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        alert(data?.message || "멘토링 삭제 중 오류가 발생했습니다.");
        return;
      }

      alert("멘토링이 삭제되었습니다.");
      setDeletingOffering(null);

      // 같은 MentoringOffering 데이터를 관리용/공개용에서 각각 보여주는 구조이므로,
      // 삭제 후 두 목록을 모두 다시 불러와 양쪽에서 자연스럽게 사라지게 한다.
      await fetchMyOfferings();
      await fetchOfferings();
    } catch (error) {
      console.error("멘토링 삭제 오류:", error);
      alert("서버와 통신하는 중 오류가 발생했습니다.");
    }
  };

  const openOfferingEditModal = (offering) => {
    const lockedDates = Array.isArray(offering.slots)
      ? offering.slots
          .filter((slot) => slot.available === false)
          .map((slot) => slot.date)
      : [];

    // 이미 지난 날짜인데 예약도 없는(=아무도 신청하지 않고 그냥 지나간) 슬롯은
    // 수정 대상에서 자동으로 제외한다. 예약이 있어 보호되는 날짜는 지난 날짜여도 남겨둔다.
    const schedules = parseSchedulesFromMentor(offering).filter(
      (schedule) =>
        lockedDates.includes(schedule.date) ||
        !isPastDate(new Date(`${schedule.date}T00:00:00`))
    );

    setRegisterForm({
      title: offering.title || "",
      career: "",
      careerDetail: "",
      certificates: "",
      skills: offering.skills
        ? offering.skills
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      consultationTypes: offering.consultationFields
        ? offering.consultationFields
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      mentoringType: offering.mentoringType || "",
      github: "",
      velog: "",
      portfolio: "",
      introduction: "",
      price: offering.price ?? "",
      availableDays: offering.availableDays
        ? offering.availableDays
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      availableDates: offering.availableDates
        ? offering.availableDates
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      availableStart: offering.availableStart || "",
      availableEnd: offering.availableEnd || "",
      availableSchedules: schedules
    });

    setRegisterMode("offering");
    setEditingOfferingId(offering.id);
    setRegisterLockedDates(lockedDates);

    const today = new Date();
    setRegisterCalendarDate(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );

    setShowRegister(true);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("멘토 등록은 로그인 후 이용할 수 있습니다.");
      navigate("/login");
      return;
    }

    // =================================================
    // 멘토링 등록/수정 (registerMode === "offering")
    //
    // 멘토 프로필(POST/PUT /mentor)과는 완전히 별개의
    // API(POST/PUT /mentor/offerings)를 사용한다.
    // =================================================

    if (registerMode === "offering") {
      if (!registerForm.title.trim()) {
        alert("멘토링 이름을 입력해주세요.");
        return;
      }
      if (registerForm.skills.length === 0) {
        alert("기술 분야를 하나 이상 선택해주세요.");
        return;
      }
      if (registerForm.consultationTypes.length === 0) {
        alert("상담 가능한 분야를 하나 이상 선택해주세요.");
        return;
      }
      if (!registerForm.mentoringType) {
        alert("멘토링 방식을 선택해주세요.");
        return;
      }
      if (
        registerForm.price === "" ||
        Number(registerForm.price) < 0
      ) {
        alert("상담 가격을 입력해주세요.");
        return;
      }
      if (registerForm.availableSchedules.length === 0) {
        alert("상담 가능한 날짜를 하나 이상 선택해주세요.");
        return;
      }

      for (const schedule of registerForm.availableSchedules) {
        if (!schedule.startTime || !schedule.endTime) {
          alert(
            `${schedule.date} (${schedule.day})의 시작 시간과 종료 시간을 모두 입력해주세요.`
          );
          return;
        }
        if (schedule.startTime >= schedule.endTime) {
          alert(
            `${schedule.date} (${schedule.day})의 시작 시간(${schedule.startTime})은 종료 시간(${schedule.endTime})보다 빨라야 합니다.`
          );
          return;
        }
      }

      const offeringRequestData = {
        title: registerForm.title.trim(),
        skills: registerForm.skills.join(", "),
        consultationFields: registerForm.consultationTypes.join(", "),
        mentoringType: registerForm.mentoringType,
        price: Number(registerForm.price),
        availableDays: Array.from(
          new Set(registerForm.availableSchedules.map((s) => s.day))
        ).join(", "),
        availableDates: registerForm.availableSchedules
          .map((s) => s.date)
          .join(", "),
        availableStart:
          registerForm.availableSchedules[0]?.startTime || "10:00",
        availableEnd:
          registerForm.availableSchedules[0]?.endTime || "18:00",
        availableSchedules: JSON.stringify(
          registerForm.availableSchedules
        )
      };

      try {
        const response = await fetch(
          editingOfferingId
            ? `/api/mentor/offerings/${editingOfferingId}`
            : "/api/mentor/offerings",
          {
            method: editingOfferingId ? "PUT" : "POST",
            headers: {
              "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(offeringRequestData)
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          alert(
            data?.message ||
              (editingOfferingId
                ? "멘토링 수정 중 오류가 발생했습니다."
                : "멘토링 등록 중 오류가 발생했습니다.")
          );
          return;
        }

        alert(
          editingOfferingId
            ? "멘토링 정보가 수정되었습니다."
            : "새로운 멘토링이 등록되었습니다."
        );

        setShowRegister(false);
        setEditingOfferingId(null);

        // 처음으로 "멘토 등록하기"를 눌러 첫 멘토링을 만든 경우,
        // 서버에서 MentorProfile이 함께 자동 생성되므로 화면 상태도 갱신한다.
        if (!myMentor) {
          try {
            const meResponse = await fetch("/api/mentor/me", {
              credentials: "include"
            });
            if (meResponse.ok) {
              setMyMentor(await meResponse.json());
            }
          } catch (meError) {
            console.error("내 멘토 정보 갱신 오류:", meError);
          }
        }

        await fetchMyOfferings();
        await fetchOfferings();
      } catch (error) {
        console.error("멘토링 등록/수정 오류:", error);
        alert("서버와 통신하는 중 오류가 발생했습니다.");
      }

      return;
    }

    if (!registerForm.title.trim()) {
      alert("멘토링 제목을 입력해주세요.");
      return;
    }

    if (!registerForm.career.trim()) {
      alert("경력을 입력해주세요.");
      return;
    }

    if (registerForm.skills.length === 0) {
      alert("기술 분야를 하나 이상 선택해주세요.");
      return;
    }

    if (registerForm.consultationTypes.length === 0) {
      alert("상담 가능한 분야를 하나 이상 선택해주세요.");
      return;
    }

    if (!registerForm.mentoringType) {
      alert("멘토링 방식을 선택해주세요.");
      return;
    }

    if (!registerForm.introduction.trim()) {
      alert("멘토 소개를 입력해주세요.");
      return;
    }

    if (
      registerForm.price === "" ||
      Number(registerForm.price) < 0
    ) {
      alert("상담 가격을 입력해주세요.");
      return;
    }

    if (registerForm.availableSchedules.length === 0) {
      alert("상담 가능한 날짜를 하나 이상 선택해주세요.");
      return;
    }

    for (const schedule of registerForm.availableSchedules) {
      if (!schedule.startTime || !schedule.endTime) {
        alert(
          `${schedule.date} (${schedule.day})의 시작 시간과 종료 시간을 모두 입력해주세요.`
        );
        return;
      }
      if (schedule.startTime >= schedule.endTime) {
        alert(
          `${schedule.date} (${schedule.day})의 시작 시간(${schedule.startTime})은 종료 시간(${schedule.endTime})보다 빨라야 합니다.`
        );
        return;
      }
    }

    const github = normalizeLinkUrl(registerForm.github, "github");
    const velog = normalizeLinkUrl(registerForm.velog, "velog");
    const portfolio = normalizeLinkUrl(registerForm.portfolio, "portfolio");
    const invalidLink = [
      [registerForm.github, github, "GitHub"],
      [registerForm.velog, velog, "Velog"],
      [registerForm.portfolio, portfolio, "Portfolio"]
    ].find(([value, normalized]) => value.trim() && !normalized);

    if (invalidLink) {
      alert("올바른 형식의 링크를 입력해주세요.");
      return;
    }

    const requestData = {
      title: registerForm.title.trim(),
      introduction: registerForm.introduction.trim(),
      career: registerForm.career.trim(),
      careerDetail: registerForm.careerDetail.trim(),
      certificates: registerForm.certificates.trim(),
      skills: registerForm.skills.join(", "),
      price: Number(registerForm.price),
      mentoringType: registerForm.mentoringType,
      consultationFields:
        registerForm.consultationTypes.join(", "),
      github,
      velog,
      portfolio,
      availableDays: Array.from(
        new Set(registerForm.availableSchedules.map((s) => s.day))
      ).join(", "),
      availableDates: registerForm.availableSchedules
        .map((s) => s.date)
        .join(", "),
      availableStart:
        registerForm.availableSchedules[0]?.startTime || "10:00",
      availableEnd:
        registerForm.availableSchedules[0]?.endTime || "18:00",
      availableSchedules: JSON.stringify(
        registerForm.availableSchedules
      )
    };

    console.log("멘토 등록 전송 데이터:", requestData);

    try {
      const response = await fetch(
        isEditingMentor
          ? "/api/mentor/me"
          : "/api/mentor",
        {
          method: isEditingMentor ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify(requestData)
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        alert(
          data?.message ||
            (isEditingMentor
              ? "멘토 정보 수정 중 오류가 발생했습니다."
              : "멘토 등록 중 오류가 발생했습니다.")
        );
        return;
      }

      setMyMentor(data);

      alert(
        isEditingMentor
          ? "멘토 정보가 수정되었습니다."
          : "멘토 등록이 완료되었습니다."
      );

      setShowRegister(false);
      setIsEditingMentor(false);

      await fetchMentors();
    } catch (error) {
      console.error("멘토 등록/수정 오류:", error);
      alert("서버와 통신하는 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteMentor = async () => {
    if (!myMentor) return;

    const confirmed = window.confirm(
      "멘토 등록 정보를 삭제하시겠습니까?\n\n삭제하면 다시 등록해야 합니다."
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/mentor/me", {
        method: "DELETE",
        credentials: "include"
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        alert(
          data?.message ||
            "멘토 등록 정보 삭제 중 오류가 발생했습니다."
        );
        return;
      }

      alert("멘토 등록 정보가 삭제되었습니다.");

      setMyMentor(null);
      setShowRegister(false);
      setIsEditingMentor(false);

      resetRegisterForm();

      await fetchMentors();
    } catch (error) {
      console.error("멘토 삭제 오류:", error);
      alert("서버와 통신하는 중 오류가 발생했습니다.");
    }
  };

  const openReservation = async (mentor) => {
    setSelectedMentor(null);
    setReviewMentor(null);

    setReservationForm({
      consultationTypes: [],
      skills: [],
      date: "",
      time: "",
      problem: "",
      file: null
    });

    setSelectedFile(null);
    setBookedReservationDates([]);

    const today = new Date();

    setCalendarDate(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setReservationMentor(mentor);

    try {
      const response = await fetch(
        `/api/mentor/reservation/${mentor.id}/booked-dates`,
        { credentials: "include" }
      );
      if (response.ok) {
        const dates = await response.json();
        setBookedReservationDates(Array.isArray(dates) ? dates : []);
      }
    } catch (error) {
      console.error("예약된 날짜 조회 오류:", error);
    }
  };

  // 멘토가 등록한 여러 멘토링(Java/Spring/React 등) 중
  // 특정 멘토링을 선택해 신청하는 경우.
  // 기존 openReservation을 그대로 재사용하되, 상담 분야/기술/가격/일정을
  // 선택한 멘토링(offering) 기준으로 바꿔서 전달한다.
  const openReservationForOffering = (mentor, offering) => {
    const schedules = parseSchedulesFromMentor(offering);

    openReservation({
      ...mentor,
      consultationTypes: offering.consultationFields
        ? offering.consultationFields
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      skills: offering.skills
        ? offering.skills
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      price: offering.price ?? 0,
      availableSchedules: schedules,
      availableDates: offering.availableDates
        ? offering.availableDates
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      availableStart: offering.availableStart || "",
      availableEnd: offering.availableEnd || "",
      offeringId: offering.id,
      offeringTitle: offering.title
    });
  };

  const handleReservationSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("멘토링 신청은 로그인 후 이용할 수 있습니다.");
      navigate("/login");
      return;
    }

    if (!reservationMentor) return;

    if (reservationForm.consultationTypes.length === 0) {
      alert("상담받고 싶은 분야를 선택해주세요.");
      return;
    }

    if (reservationForm.skills.length === 0) {
      alert("관련 기술을 하나 이상 선택해주세요.");
      return;
    }

    if (!reservationForm.date) {
      alert("예약 날짜를 선택해주세요.");
      return;
    }

    if (bookedReservationDates.includes(reservationForm.date)) {
      alert("이미 예약된 날짜입니다. 다른 날짜를 선택해주세요.");
      return;
    }

    const matchingSchedule = getReservationSchedule(
      reservationMentor,
      reservationForm.date
    );
    if (!matchingSchedule) {
      alert("선택한 날짜의 상담 가능 시간을 찾을 수 없습니다.");
      return;
    }

    const reservationTime = `${matchingSchedule.startTime} ~ ${matchingSchedule.endTime}`;

    if (!reservationForm.problem.trim()) {
      alert("현재 문제를 작성해주세요.");
      return;
    }

    const requestData = {
      offeringId: reservationMentor.offeringId || null,
      consultationTypes:
        reservationForm.consultationTypes.join(", "),
      skills: reservationForm.skills.join(", "),
      reservationDate: reservationForm.date,
      reservationTime,
      problem: reservationForm.problem.trim(),
      fileName: selectedFile?.name || "",
      filePath: ""
    };

    try {
      const response = await fetch(
        `/api/mentor/reservation/${reservationMentor.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify(requestData)
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        alert(
          data?.message ||
            "멘토링 신청 중 오류가 발생했습니다."
        );
        return;
      }

      alert("멘토링 신청이 완료되었습니다. 멘토의 승인을 기다려주세요.");
      fetchMyReservations();

      setReservationMentor(null);
      setSelectedFile(null);

      setReservationForm({
        consultationTypes: [],
        skills: [],
        date: "",
        time: "",
        problem: "",
        file: null
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      console.log("예약 신청 결과:", data);
    } catch (error) {
      console.error("멘토링 예약 오류:", error);
      alert("서버와 통신하는 중 오류가 발생했습니다.");
    }
  };

  const handleReservationDecision = async (reservationId, action, body) => {
    try {
      const response = await fetch(
        `/api/mentor/reservation/${reservationId}/${action}`,
        {
          method: "PUT",
          headers: body ? { "Content-Type": "application/json" } : undefined,
          credentials: "include",
          body: body ? JSON.stringify(body) : undefined
        }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        alert(data?.message || "신청 처리 중 오류가 발생했습니다.");
        return;
      }
      alert(data?.message || "처리가 완료되었습니다.");
      fetchReceivedReservations();
      fetchMyReservations();
      // "내가 등록한 멘토링" 카드의 슬롯별 예약 상태(및 공개 목록의 신청 가능 여부)도
      // 승인/거절 직후 바로 반영되도록 함께 새로고침한다.
      fetchMyOfferings();
      fetchOfferings();
      // 수업 완료 직후 "후기 작성하기" 버튼이 바로 보이도록 후기 작성 가능 목록도
      // 함께 새로고침한다(안 하면 방금 완료한 예약이 아직 옛 목록에 없어
      // "후기 작성 완료"로 잘못 보였다).
      fetchMyReviewEligibleIds();
    } catch (error) {
      console.error("멘토링 신청 처리 오류:", error);
      alert("서버와 통신하는 중 오류가 발생했습니다.");
    }
  };

  // =====================================================
  // 예약 거절 (사유 입력)
  // =====================================================

  const openRejectModal = (item) => {
    setDetailReservation(null);
    setRejectReasonInput("");
    setRejectingReservation(item);
  };

  const closeRejectModal = () => {
    setRejectingReservation(null);
    setRejectReasonInput("");
  };

  const submitRejectReservation = async () => {
    if (!rejectingReservation) return;

    await handleReservationDecision(
      rejectingReservation.id,
      "reject",
      { reason: rejectReasonInput.trim() }
    );

    closeRejectModal();
  };

  // =====================================================
  // 예약 상세보기
  // =====================================================

  const openReservationDetail = (item, role) => {
    setDetailReservation({ item, role });
  };

  // =====================================================
  // 멘토링 채팅
  //
  // 결제가 완료된 예약에 대해서만 버튼이 노출되지만(프론트),
  // 실제 조회/전송 권한은 서버(MentoringChatService)가 다시 검증한다.
  // =====================================================

  const openChat = (item, role) => {
    setChatReservation({ item, role });
  };

  const closeChat = () => {
    setChatReservation(null);
    setChatMessages([]);
    setChatInput("");
  };

  useEffect(() => {
    if (!chatReservation) return;

    const fetchChatMessages = async () => {
      setChatLoading(true);
      try {
        const response = await fetch(
          `/api/mentor/reservation/${chatReservation.item.id}/chat/messages`,
          { credentials: "include" }
        );
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          alert(data?.message || "채팅 메시지를 불러오는 중 오류가 발생했습니다.");
          setChatReservation(null);
          return;
        }

        setChatMessages(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("멘토링 채팅 조회 오류:", error);
        alert("서버와 통신하는 중 오류가 발생했습니다.");
        setChatReservation(null);
      } finally {
        setChatLoading(false);
      }
    };

    fetchChatMessages();
  }, [chatReservation?.item?.id]);

  // =====================================================
  // 멘토링 채팅 실시간 수신 (STOMP over WebSocket)
  //
  // 메시지 "전송"은 여전히 REST(handleSendChatMessage)가 담당하고, 이 효과는
  // 채팅창이 열려 있는 동안 해당 reservationId의 "/topic/mentoring/{id}"만
  // 구독해 상대방(그리고 내가 보낸 메시지의 서버 echo)을 실시간으로 받는 역할만 한다.
  //
  // chatReservation.item.id가 바뀌거나(다른 예약으로 교체) 채팅창이 닫히면
  // (chatReservation이 null이 되면) 아래 cleanup이 항상 먼저 실행되어 구독 해제 +
  // 연결 종료가 보장되므로, 다시 열어도 중복 연결이 쌓이지 않는다.
  // =====================================================
  useEffect(() => {
    if (!chatReservation) return;

    const reservationId = chatReservation.item.id;
    const hostname = window.location.hostname;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

    const client = new Client({
      brokerURL: `${protocol}//${hostname}:8080/ws-chat`,
      reconnectDelay: 4000,
      onConnect: () => {
        client.subscribe(`/topic/mentoring/${reservationId}`, (frame) => {
          try {
            const incoming = JSON.parse(frame.body);
            // 내가 REST로 보낸 메시지가 구독을 통해 다시 돌아오는 경우(에코) 및
            // 재연결 시 중복 수신을 id 기준으로 걸러 화면에 두 번 표시되지 않게 한다.
            setChatMessages((prev) =>
              prev.some((message) => message.id === incoming.id)
                ? prev
                : [...prev, incoming]
            );
          } catch (error) {
            console.error("멘토링 채팅 실시간 메시지 처리 오류:", error);
          }
        });
      },
      onStompError: (frame) => {
        console.error("멘토링 채팅 WebSocket 오류:", frame.headers?.message);
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [chatReservation?.item?.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chatMessages]);

  const handleSendChatMessage = async (event) => {
    event.preventDefault();
    if (!chatReservation || !chatInput.trim()) return;

    try {
      const response = await fetch(
        `/api/mentor/reservation/${chatReservation.item.id}/chat/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content: chatInput.trim() })
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        alert(data?.message || "메시지 전송 중 오류가 발생했습니다.");
        return;
      }

      // WebSocket 구독이 이 메시지를 조금 더 빨리 전달했을 수도 있으므로
      // id 기준으로 중복 여부를 확인한 뒤 추가한다.
      setChatMessages((prev) =>
        prev.some((message) => message.id === data.id) ? prev : [...prev, data]
      );
      setChatInput("");
    } catch (error) {
      console.error("멘토링 채팅 전송 오류:", error);
      alert("서버와 통신하는 중 오류가 발생했습니다.");
    }
  };

  // 알림 클릭("/mentor?chatReservationId=123")으로 들어왔을 때
  // 내가 신청한 목록/받은 신청 목록이 로드되면 해당 예약의 채팅을 바로 연다.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chatId = Number(params.get("chatReservationId"));
    if (!chatId) return;

    const asApplicant = myReservations.find((item) => item.id === chatId);
    const asMentor = receivedReservations.find((item) => item.id === chatId);

    if (asApplicant) {
      setChatReservation({ item: asApplicant, role: "applicant" });
    } else if (asMentor) {
      setChatReservation({ item: asMentor, role: "mentor" });
    } else {
      return;
    }

    navigate("/mentor", { replace: true });
  }, [myReservations, receivedReservations]);

  // "나의 멘토링 기록"에서 삭제 — 예약 데이터 자체를 지우는 것이 아니라
  // 본인 화면에서만 숨긴다(상대방의 기록/후기/캘린더는 그대로 유지).
  const hideMyRecord = async (reservationId) => {
    const confirmed = window.confirm(
      "이 멘토링 기록을 나의 기록에서 삭제하시겠습니까?\n상대방의 기록에는 영향이 없습니다."
    );
    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/mentor/reservation/${reservationId}/my-record`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        alert(data?.message || "기록 삭제 중 오류가 발생했습니다.");
        return;
      }

      fetchMyReservations();
      fetchReceivedReservations();
    } catch (error) {
      console.error("나의 멘토링 기록 삭제 오류:", error);
      alert("서버와 통신하는 중 오류가 발생했습니다.");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("후기 작성은 로그인 후 이용할 수 있습니다.");
      navigate("/login");
      return;
    }

    if (!editingReviewId && !reviewForm.reservationId) {
      alert("후기를 작성할 예약을 선택해주세요.");
      return;
    }

    if (!reviewForm.content.trim()) {
      alert("후기 내용을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(
        editingReviewId
          ? `/api/mentor/reviews/${editingReviewId}`
          : "/api/mentor/reviews",
        {
          method: editingReviewId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            reservationId: Number(reviewForm.reservationId),
            rating: Number(reviewForm.rating),
            content: reviewForm.content.trim()
          })
        }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        alert(data?.message || "후기 저장 중 오류가 발생했습니다.");
        return;
      }

      alert(editingReviewId ? "후기가 수정되었습니다." : "후기가 등록되었습니다.");
      setEditingReviewId(null);
      setReviewForm({
        reservationId: "",
        rating: 5,
        content: ""
      });
      fetchMentors();
      fetchMyReviewEligibleIds();
      if (reviewMentor) {
        const summaryResponse = await fetch(
          `/api/mentor/reviews/${reviewMentor.id}`,
          { credentials: "include" }
        );
        if (summaryResponse.ok) {
          const summary = await summaryResponse.json();
          setReviewSummary({
            averageRating: summary.averageRating ?? 0,
            reviewCount: summary.reviewCount ?? 0,
            reviews: Array.isArray(summary.reviews) ? summary.reviews : []
          });
        }
        const eligibleResponse = await fetch("/api/mentor/reviews/eligible/me", {
          credentials: "include"
        });
        if (eligibleResponse.ok) {
          const eligible = await eligibleResponse.json();
          setEligibleReservations(
            Array.isArray(eligible)
              ? eligible.filter((item) => item.mentorId === reviewMentor.id)
              : []
          );
        }
      }
    } catch (error) {
      console.error("후기 저장 오류:", error);
      alert("서버와 통신하는 중 오류가 발생했습니다.");
    }
  };

  const handleReviewDelete = async (reviewId) => {
    if (!window.confirm("후기를 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/mentor/reviews/${reviewId}`, {
        method: "DELETE",
        credentials: "include"
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        alert(data?.message || "후기 삭제 중 오류가 발생했습니다.");
        return;
      }
      alert(data?.message || "후기가 삭제되었습니다.");
      if (editingReviewId === reviewId) {
        setEditingReviewId(null);
        setReviewForm({
          reservationId: "",
          rating: 5,
          content: ""
        });
      }
      fetchMentors();
      fetchMyReviewEligibleIds();
      if (reviewMentor) {
        const summaryResponse = await fetch(
          `/api/mentor/reviews/${reviewMentor.id}`,
          { credentials: "include" }
        );
        if (summaryResponse.ok) {
          const summary = await summaryResponse.json();
          setReviewSummary({
            averageRating: summary.averageRating ?? 0,
            reviewCount: summary.reviewCount ?? 0,
            reviews: Array.isArray(summary.reviews) ? summary.reviews : []
          });
        }
        const eligibleResponse = await fetch("/api/mentor/reviews/eligible/me", {
          credentials: "include"
        });
        if (eligibleResponse.ok) {
          const eligible = await eligibleResponse.json();
          setEligibleReservations(
            Array.isArray(eligible)
              ? eligible.filter((item) => item.mentorId === reviewMentor.id)
              : []
          );
        }
      }
    } catch (error) {
      console.error("후기 삭제 오류:", error);
      alert("서버와 통신하는 중 오류가 발생했습니다.");
    }
  };

  const closeAllModals = () => {
    setSelectedMentor(null);
    setReviewMentor(null);
    setReservationMentor(null);
    setShowRegister(false);
    setDetailReservation(null);
    setRejectingReservation(null);
    setRejectReasonInput("");
  };

  const calendarDays = getCalendarDays();
  const registerCalendarDays = getRegisterCalendarDays();

  // 완료된 예약은 "나의 멘토링 기록"으로 이동해서 보여주고,
  // 받은 신청 목록에서는 완료된 예약을 숨긴다 (DB 데이터는 그대로 유지).
  const activeMyReservations = myReservations.filter(
    (item) => item.status !== "COMPLETED"
  );
  const completedMyReservations = myReservations.filter(
    (item) => item.status === "COMPLETED"
  );
  const visibleReceivedReservations = receivedReservations.filter(
    (item) => item.status !== "COMPLETED"
  );
  // 멘토(A) 입장에서 본인이 진행한 완료된 멘토링 기록
  const completedReceivedReservations = receivedReservations.filter(
    (item) => item.status === "COMPLETED"
  );

  const scrollToMentorExplore = () => {
    document
      .getElementById("mentor-explore")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="mentoring-page">
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
            내 코드와 고민을 가져오세요.
            <br />
            실무 개발자와 1:1로 해결해보세요.
          </p>
        </div>
      </section>

      <section className="mentoring-content">
        <div className="mentoring-intro">
          <div>
            <span className="section-label">
              FIND YOUR MENTOR
            </span>

            <h2>나에게 맞는 멘토를 찾아보세요.</h2>

            <p>
              기술과 상담 목적을 기준으로
              <br />
              지금 필요한 멘토를 찾아보세요.
            </p>
          </div>

          <div className="mentoring-cta-group">
            <button
              type="button"
              className="mentor-explore-button"
              onClick={scrollToMentorExplore}
            >
              멘토 둘러보기 →
            </button>

            {/*
              "멘토 등록하기"는 클릭할 때마다 항상 새로운 멘토링(MentoringOffering)을
              등록하는 버튼이다. 한 번 등록했다고 "수정하기"로 바뀌지 않는다.
              (기존 멘토링 수정은 "내가 등록한 멘토링"의 각 카드 안 [수정하기]로만 한다.)
            */}
            <button
              type="button"
              className="mentor-register-button"
              onClick={openOfferingCreateModal}
            >
              멘토 등록하기 →
            </button>
          </div>
        </div>

        {user && myMentor && (
          <div className="reservation-board-card my-offerings-section">
            <div className="offering-section-header">
              <div>
                <span className="section-label">MY MENTORING OFFERINGS</span>
                <h3>내가 등록한 멘토링</h3>
              </div>

              <button
                type="button"
                className="offering-add-button"
                onClick={openOfferingCreateModal}
              >
                + 멘토 등록하기
              </button>
            </div>

            {visibleMyOfferings.length > 0 ? (
              (() => {
                const totalPages = Math.max(
                  1,
                  Math.ceil(visibleMyOfferings.length / MY_OFFERINGS_PAGE_SIZE)
                );
                const currentPage = Math.min(myOfferingsPage, totalPages);
                const pageStart = (currentPage - 1) * MY_OFFERINGS_PAGE_SIZE;
                const pageItems = visibleMyOfferings.slice(
                  pageStart,
                  pageStart + MY_OFFERINGS_PAGE_SIZE
                );

                return (
                  <>
                    <div className="offering-manage-grid">
                      {pageItems.map((offering) => {
                        // 완료된 슬롯은 "내가 등록한 멘토링"에 계속 쌓아두지 않고
                        // "나의 멘토링 기록"에서만 확인하도록, 관리 카드에서는 숨긴다.
                        const slots = (
                          Array.isArray(offering.slots) ? offering.slots : []
                        ).filter((slot) => slot.reservationStatus !== "COMPLETED");
                        const skillTags = offering.skills
                          ? offering.skills
                              .split(",")
                              .map((tag) => tag.trim())
                              .filter(Boolean)
                          : [];
                        const fieldTags = offering.consultationFields
                          ? offering.consultationFields
                              .split(",")
                              .map((tag) => tag.trim())
                              .filter(Boolean)
                          : [];

                        return (
                          <article className="offering-manage-card" key={offering.id}>
                            <div className="offering-manage-card-title">
                              <div className="mentor-avatar tiny">
                                {myAvatarImage ? (
                                  <img
                                    src={myAvatarImage}
                                    alt={`${offering.mentorName} 프로필`}
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  (offering.mentorName || "M").charAt(0)
                                )}
                              </div>
                              <strong>{offering.title}</strong>
                            </div>

                            {(skillTags.length > 0 || fieldTags.length > 0) && (
                              <div className="offering-manage-tags">
                                {skillTags.slice(0, 3).map((tag) => (
                                  <span className="tag-skill" key={`s-${tag}`}>
                                    {tag}
                                  </span>
                                ))}
                                {fieldTags.slice(0, 2).map((tag) => (
                                  <span className="tag-field" key={`f-${tag}`}>
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {slots.length > 0 && (
                              <div className="offering-manage-slots">
                                {slots.map((slot) => {
                                  const slotLabel = `${Number(
                                    slot.date.slice(5, 7)
                                  )}/${Number(slot.date.slice(8, 10))} ${
                                    slot.startTime
                                  }`;

                                  if (slot.available) {
                                    return (
                                      <div
                                        key={`${slot.date}-${slot.startTime}`}
                                        className="offering-manage-slot available"
                                      >
                                        <span className="offering-manage-slot-time">
                                          {slotLabel}
                                        </span>
                                        <span className="offering-slot-status available">
                                          신청 가능
                                        </span>
                                      </div>
                                    );
                                  }

                                  const phase = getReservationPhase(
                                    {
                                      status: slot.reservationStatus,
                                      reservationDate: slot.date,
                                      rejectReason: null,
                                      paymentStatus: slot.paymentStatus
                                    },
                                    "mentor"
                                  );

                                  return (
                                    <div
                                      key={`${slot.date}-${slot.startTime}`}
                                      className="offering-manage-slot booked"
                                    >
                                      <div className="offering-manage-slot-header">
                                        <span className="offering-manage-slot-time">
                                          {slotLabel}
                                        </span>
                                        <em className={`reservation-status ${phase.key}`}>
                                          {phase.emoji} {phase.label}
                                        </em>
                                      </div>

                                      <span className="offering-manage-slot-applicant">
                                        신청자: {slot.applicantNickname}
                                      </span>

                                      {slot.reservationStatus === "PENDING" && (
                                        <div className="reservation-board-actions">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleReservationDecision(
                                                slot.reservationId,
                                                "approve"
                                              )
                                            }
                                          >
                                            승인
                                          </button>
                                          <button
                                            type="button"
                                            className="reject"
                                            onClick={() =>
                                              openRejectModal({
                                                id: slot.reservationId,
                                                memberNickname: slot.applicantNickname
                                              })
                                            }
                                          >
                                            거절
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <div className="offering-manage-actions">
                              <button
                                type="button"
                                className="offering-manage-edit-button"
                                onClick={() => openOfferingEditModal(offering)}
                              >
                                수정하기
                              </button>
                              <button
                                type="button"
                                className="offering-manage-delete-button"
                                onClick={() => openDeleteOfferingModal(offering)}
                              >
                                삭제
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    {totalPages > 1 && (
                      <nav className="offering-pagination" aria-label="내가 등록한 멘토링 페이지">
                        <button
                          type="button"
                          className="offering-pagination-arrow"
                          disabled={currentPage === 1}
                          onClick={() => setMyOfferingsPage(currentPage - 1)}
                        >
                          ‹
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                          (page) => (
                            <button
                              type="button"
                              key={page}
                              className={`offering-pagination-page ${
                                page === currentPage ? "active" : ""
                              }`}
                              onClick={() => setMyOfferingsPage(page)}
                            >
                              {page}
                            </button>
                          )
                        )}

                        <button
                          type="button"
                          className="offering-pagination-arrow"
                          disabled={currentPage === totalPages}
                          onClick={() => setMyOfferingsPage(currentPage + 1)}
                        >
                          ›
                        </button>
                      </nav>
                    )}
                  </>
                );
              })()
            ) : (
              <p className="offering-empty-text">
                아직 등록한 멘토링이 없습니다. 새로운 멘토링을
                등록해보세요.
              </p>
            )}
          </div>
        )}

        <div className="mentoring-filter" id="mentor-explore">
          {categories.map((item) => (
            <button
              type="button"
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

        <div className="mentor-grid-section">
        {filteredOfferings.length > 0 ? (
          (() => {
            const {
              pageItems: mentorGridPageItems,
              totalPages: mentorGridTotalPages,
              currentPage: mentorGridCurrentPage
            } = paginate(filteredOfferings, mentorGridPage, MENTOR_GRID_PAGE_SIZE);

            return (
              <>
                <div className="mentor-grid">
                  {mentorGridPageItems.map((offering) => {
                    const isMyCard = isMyOffering(offering);
              const mentorProfile = mentors.find(
                (mentor) => mentor.id === offering.mentorId
              );
              const image = getProfileImage(mentorProfile);

              return (
                <article
                  className={`mentor-card ${
                    isMyCard ? "my-mentor-card" : ""
                  }`}
                  key={offering.id}
                >
                  <div className="mentor-card-top">
                    <div className="mentor-basic">
                      <div className="mentor-type-badge-row">
                        <span>
                          {offering.mentoringType || "MENTOR"}
                        </span>
                        {isMyCard && (
                          <span className="my-mentor-card-badge">
                            내 멘토링
                          </span>
                        )}
                      </div>

                      <h3>{offering.title}</h3>

                      {mentorProfile ? (
                        <button
                          type="button"
                          className="mentor-card-mentor-link"
                          onClick={() => setSelectedMentor(mentorProfile)}
                        >
                          👤 {offering.mentorName} 멘토 프로필 보기
                        </button>
                      ) : (
                        <p className="mentor-card-mentor-name">
                          👤 {offering.mentorName}
                        </p>
                      )}
                    </div>

                    <div className="mentor-profile">
                      <div className="mentor-avatar">
                        {image ? (
                          <img
                            src={image}
                            alt={`${offering.mentorName} 프로필`}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          offering.mentorName.charAt(0)
                        )}
                      </div>
                    </div>
                  </div>

                  {offering.slots.length > 0 && (
                    <div className="mentor-card-schedules">
                      <small>예약 가능 일정</small>
                      {offering.slots.slice(0, 3).map((slot) => (
                        <span key={`${slot.date}-${slot.startTime}`}>
                          {`${Number(slot.date.slice(5, 7))}/${Number(
                            slot.date.slice(8, 10)
                          )}`}{" "}
                          · {slot.startTime} ~ {slot.endTime}
                        </span>
                      ))}
                      {offering.slots.length > 3 && (
                        <span>외 {offering.slots.length - 3}건</span>
                      )}
                    </div>
                  )}

                  <div className="mentor-consultation-tags">
                    {offering.fieldTags
                      .slice(0, 3)
                      .map((type) => (
                        <span key={type}>{type}</span>
                      ))}
                  </div>

                  <div className="mentor-skills">
                    {offering.skillTags.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>

                  <div className="mentor-card-bottom">
                    <div>
                      <small>1회 상담</small>

                      <strong>
                        {Number(
                          offering.price
                        ).toLocaleString()}
                        원
                      </strong>
                    </div>

                    {isMyCard ? (
                      <button
                        type="button"
                        className="mentor-card-edit-button"
                        onClick={() => openOfferingEditModal(offering)}
                      >
                        수정하기 →
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          openReservationForOffering(
                            {
                              id: offering.mentorId,
                              name: offering.mentorName,
                              profileImage: mentorProfile?.profileImage || ""
                            },
                            offering
                          )
                        }
                      >
                        신청하기 →
                      </button>
                    )}
                  </div>
                </article>
              );
                  })}
                </div>

                {renderPaginationNav(
                  mentorGridTotalPages,
                  mentorGridCurrentPage,
                  setMentorGridPage,
                  "공개 멘토링 페이지"
                )}
              </>
            );
          })()
        ) : (
          <div className="mentor-empty">
            {category === "전체"
              ? "신청 가능한 멘토링이 아직 없습니다."
              : `${category} 분야의 신청 가능한 멘토링이 아직 없습니다.`}
          </div>
        )}
        </div>

        {user &&
          (activeMyReservations.length > 0 ||
            visibleReceivedReservations.length > 0 ||
            completedMyReservations.length > 0 ||
            completedReceivedReservations.length > 0) && (
            <section className="mentoring-reservation-board">
              <div className="reservation-board-header reservation-board-full">
                <span className="section-label">MY MENTORING RECORDS</span>
                <h2>나의 멘토링 기록</h2>
              </div>

              {activeMyReservations.length > 0 && (
                <div className="reservation-board-card reservation-board-full">
                  <span className="section-label">MY REQUESTS</span>
                  <h3>내가 신청한 멘토링</h3>
                  {(() => {
                    const { pageItems, totalPages, currentPage } = paginate(
                      activeMyReservations,
                      myRequestsPage,
                      RECORDS_PAGE_SIZE
                    );

                    return (
                      <>
                        <div className="mentoring-record-grid">
                          {pageItems.map((item) => {
                            const phase = getReservationPhase(item);

                            return (
                        <article className="mentoring-record-card" key={item.id}>
                          <div className="mentoring-record-top">
                            <strong>{item.mentorName}</strong>
                            <em className={`reservation-status ${phase.key}`}>
                              {phase.emoji} {phase.label}
                            </em>
                          </div>

                          <span className="mentoring-record-datetime">
                            {item.reservationDate} · {item.reservationTime}
                          </span>

                          <div className="mentoring-record-actions">
                            {item.status === "APPROVED" &&
                              item.paymentStatus !== "PAID" && (
                                <button
                                  type="button"
                                  className="payment-cta-button"
                                  onClick={() =>
                                    navigate(
                                      `/payment?type=mentoring&id=${item.id}`
                                    )
                                  }
                                >
                                  결제하기
                                </button>
                              )}
                            {item.status === "APPROVED" &&
                              item.paymentStatus === "PAID" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleReservationDecision(item.id, "complete")
                                  }
                                >
                                  수업 완료
                                </button>
                              )}
                            <button
                              type="button"
                              className="mentoring-record-detail-link"
                              onClick={() =>
                                openReservationDetail(item, "applicant")
                              }
                            >
                              상세보기
                            </button>
                            {item.paymentStatus === "PAID" && (
                              <button
                                type="button"
                                className="mentoring-record-chat-link"
                                onClick={() => openChat(item, "applicant")}
                              >
                                💬 채팅
                              </button>
                            )}
                          </div>
                        </article>
                            );
                          })}
                        </div>
                        {renderPaginationNav(
                          totalPages,
                          currentPage,
                          setMyRequestsPage,
                          "내가 신청한 멘토링 페이지"
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {visibleReceivedReservations.length > 0 && (
                <div className="reservation-board-card reservation-board-full">
                  <span className="section-label">RECEIVED REQUESTS</span>
                  <h3>받은 멘토링 신청</h3>
                  {(() => {
                    const { pageItems, totalPages, currentPage } = paginate(
                      visibleReceivedReservations,
                      receivedRequestsPage,
                      RECORDS_PAGE_SIZE
                    );

                    return (
                      <>
                        <div className="mentoring-record-grid">
                          {pageItems.map((item) => {
                            const phase = getReservationPhase(item, "mentor");

                            return (
                        <article className="mentoring-record-card" key={item.id}>
                          <div className="mentoring-record-top">
                            <strong>{item.memberNickname}</strong>
                            <em className={`reservation-status ${phase.key}`}>
                              {phase.emoji} {phase.label}
                            </em>
                          </div>

                          <span className="mentoring-record-datetime">
                            {item.reservationDate} · {item.reservationTime}
                          </span>

                          <div className="mentoring-record-actions">
                            {item.status === "PENDING" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleReservationDecision(item.id, "approve")
                                  }
                                >
                                  승인
                                </button>
                                <button
                                  type="button"
                                  className="reject"
                                  onClick={() => openRejectModal(item)}
                                >
                                  거절
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              className="mentoring-record-detail-link"
                              onClick={() =>
                                openReservationDetail(item, "mentor")
                              }
                            >
                              상세보기
                            </button>
                            {item.paymentStatus === "PAID" && (
                              <button
                                type="button"
                                className="mentoring-record-chat-link"
                                onClick={() => openChat(item, "mentor")}
                              >
                                💬 채팅
                              </button>
                            )}
                          </div>
                        </article>
                            );
                          })}
                        </div>
                        {renderPaginationNav(
                          totalPages,
                          currentPage,
                          setReceivedRequestsPage,
                          "받은 멘토링 신청 페이지"
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {completedReceivedReservations.length > 0 && (
                <div className="reservation-board-card reservation-board-full">
                  <span className="section-label">MY MENTORING HISTORY</span>
                  <h3>나의 멘토링 기록 (멘토)</h3>
                  {(() => {
                    const { pageItems, totalPages, currentPage } = paginate(
                      completedReceivedReservations,
                      myHistoryMentorPage,
                      RECORDS_PAGE_SIZE
                    );

                    return (
                      <>
                        <div className="mentoring-record-grid">
                          {pageItems.map((item) => (
                            <article className="mentoring-record-card" key={item.id}>
                              <div className="mentoring-record-top">
                                <strong>{item.memberNickname}</strong>
                                <em className="reservation-status completed">
                                  ✓ 멘토링 완료
                                </em>
                              </div>

                              <span className="mentoring-record-datetime">
                                {item.reservationDate} · {item.reservationTime}
                              </span>

                              <div className="mentoring-record-actions">
                                <button
                                  type="button"
                                  className="mentoring-record-detail-link"
                                  onClick={() => openReservationDetail(item, "mentor")}
                                >
                                  상세보기
                                </button>
                                <button
                                  type="button"
                                  className="mentoring-record-chat-link"
                                  onClick={() => openChat(item, "mentor")}
                                >
                                  💬 채팅
                                </button>
                                <button
                                  type="button"
                                  className="mentoring-record-delete-link"
                                  onClick={() => hideMyRecord(item.id)}
                                >
                                  삭제
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                        {renderPaginationNav(
                          totalPages,
                          currentPage,
                          setMyHistoryMentorPage,
                          "나의 멘토링 기록(멘토) 페이지"
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {completedMyReservations.length > 0 && (
                <div className="reservation-board-card reservation-board-full">
                  <span className="section-label">MY MENTORING HISTORY</span>
                  <h3>나의 멘토링 기록</h3>
                  {(() => {
                    const { pageItems, totalPages, currentPage } = paginate(
                      completedMyReservations,
                      myHistoryApplicantPage,
                      RECORDS_PAGE_SIZE
                    );

                    return (
                      <>
                        <div className="mentoring-record-grid">
                          {pageItems.map((item) => {
                            const reviewNotWritten = myReviewEligibleIds.includes(
                              item.id
                            );

                            return (
                        <article className="mentoring-record-card" key={item.id}>
                          <div className="mentoring-record-top">
                            <strong>{item.mentorName}</strong>
                            <em className="reservation-status completed">
                              ✓ 멘토링 완료
                            </em>
                          </div>

                          <span className="mentoring-record-datetime">
                            {item.reservationDate} · {item.reservationTime}
                          </span>

                          <div className="mentoring-record-actions">
                            {reviewNotWritten ? (
                              <button
                                type="button"
                                className="mentoring-record-review-link"
                                onClick={() =>
                                  setReviewMentor({
                                    id: item.mentorId,
                                    name: item.mentorName
                                  })
                                }
                              >
                                후기 작성하기 →
                              </button>
                            ) : (
                              <span className="reservation-review-done">
                                ✓ 후기 작성 완료
                              </span>
                            )}
                            <button
                              type="button"
                              className="mentoring-record-detail-link"
                              onClick={() =>
                                openReservationDetail(item, "applicant")
                              }
                            >
                              상세보기
                            </button>
                            <button
                              type="button"
                              className="mentoring-record-chat-link"
                              onClick={() => openChat(item, "applicant")}
                            >
                              💬 채팅
                            </button>
                            <button
                              type="button"
                              className="mentoring-record-delete-link"
                              onClick={() => hideMyRecord(item.id)}
                            >
                              삭제
                            </button>
                          </div>
                        </article>
                            );
                          })}
                        </div>
                        {renderPaginationNav(
                          totalPages,
                          currentPage,
                          setMyHistoryApplicantPage,
                          "나의 멘토링 기록 페이지"
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </section>
          )}

        <section className="mentoring-value-section">
          <div>
            <span className="section-label">
              WHY EASYS MENTORING
            </span>

            <h2>문제 해결 중심의 1:1 멘토링</h2>

            <p className="mentoring-value-lead">
              내 코드를 직접 보여주고,
              <br />
              막힌 문제를 멘토와 함께 해결해보세요.
            </p>
          </div>

          <div className="mentoring-value-grid">
            <article>
              <span>01</span>

              <h3>내 코드를 가져오세요</h3>

              <p>
                현재 작성한 코드와 오류 상황을
                멘토에게 직접 보여줄 수 있습니다.
              </p>
            </article>

            <article>
              <span>02</span>

              <h3>문제에 맞는 멘토를 찾아보세요</h3>

              <p>
                기술뿐 아니라 코드 리뷰,
                프로젝트 구조 등 상담 목적에 맞춰 선택합니다.
              </p>
            </article>

            <article>
              <span>03</span>

              <h3>상담 후 솔직한 후기를 남겨주세요</h3>

              <p>
                실제 상담 경험을 바탕으로
                다음 사용자에게 도움이 되는 후기를 남길 수 있습니다.
              </p>
            </article>
          </div>
        </section>
      </section>

      {selectedMentor && (
        <div
          className="modal-background"
          onClick={() => setSelectedMentor(null)}
        >
          <div
            className="mentor-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="modal-close"
              onClick={() =>
                setSelectedMentor(null)
              }
            >
              ×
            </button>

            <div className="mentor-modal-profile">
              <div className="mentor-avatar large">
                {getProfileImage(selectedMentor) ? (
                  <img
                    src={getProfileImage(selectedMentor)}
                    alt={`${selectedMentor.name} 프로필`}
                  />
                ) : (
                  selectedMentor.name.charAt(0)
                )}
              </div>

              <div>
                <span>
                  {selectedMentor.mentoringType ||
                    "MENTOR"}
                </span>

                <h2>{selectedMentor.name}</h2>

                <p>{selectedMentor.career}</p>
              </div>
            </div>

            <div className="detail-rating">
              <strong>
                ★ {formatRating(selectedMentor.averageRating)}
              </strong>
              <span>후기 {selectedMentor.reviewCount || 0}개</span>

              <button
                type="button"
                onClick={() => {
                  setReviewMentor(selectedMentor);
                  setSelectedMentor(null);
                }}
              >
                후기 보기
              </button>
            </div>

            <div className="mentor-modal-section">
              <span>CAREER</span>

              <h3>실무 경력</h3>

              <p>
                {selectedMentor.careerDetail ||
                  selectedMentor.career ||
                  "등록된 경력 정보가 없습니다."}
              </p>
            </div>

            <div className="mentor-modal-section">
              <span>CERTIFICATES</span>

              <h3>자격증</h3>

              <div className="certificate-list">
                {selectedMentor.certificates.length >
                0 ? (
                  selectedMentor.certificates.map(
                    (certificate) => (
                      <span key={certificate}>
                        🏆 {certificate}
                      </span>
                    )
                  )
                ) : (
                  <span>
                    등록된 자격증이 없습니다.
                  </span>
                )}
              </div>
            </div>

            <div className="mentor-modal-section">
              <span>CONSULTATION</span>

              <h3>주로 상담 가능한 분야</h3>

              <div className="consultation-list">
                {selectedMentor.consultationTypes
                  .length > 0 ? (
                  selectedMentor.consultationTypes.map(
                    (type) => (
                      <span key={type}>{type}</span>
                    )
                  )
                ) : (
                  <span>
                    등록된 상담 분야가 없습니다.
                  </span>
                )}
              </div>
            </div>

            <div className="mentor-modal-section">
              <span>SKILLS</span>

              <h3>기술 분야</h3>

              <div className="mentor-skills">
                {selectedMentor.skills.length > 0 ? (
                  selectedMentor.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))
                ) : (
                  <span>
                    등록된 기술이 없습니다.
                  </span>
                )}
              </div>
            </div>

            <div className="mentor-modal-section">
              <span>ABOUT MENTOR</span>

              <h3>멘토 소개</h3>

              <p>
                {selectedMentor.description ||
                  "등록된 멘토 소개가 없습니다."}
              </p>
            </div>

            {hasMentorLinks(selectedMentor) && (
              <div className="mentor-modal-section">
                <span>LINKS</span>

                <h3>개발 활동</h3>

                {(() => {
                  const github = normalizeLinkUrl(selectedMentor.github, "github");
                  const velog = normalizeLinkUrl(selectedMentor.velog, "velog");
                  const portfolio = normalizeLinkUrl(selectedMentor.portfolio, "portfolio");

                  return (
                    <div className="mentor-link-groups">
                      {(github || velog) && (
                        <div className="mentor-link-group">
                          <strong>개발 블로그·코드</strong>
                          <div className="mentor-links">
                            {github && (
                              <a href={github} target="_blank" rel="noreferrer">
                                GitHub ↗
                              </a>
                            )}
                            {velog && (
                              <a href={velog} target="_blank" rel="noreferrer">
                                Velog ↗
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {portfolio && (
                        <div className="mentor-link-group">
                          <strong>포트폴리오</strong>
                          <div className="mentor-links">
                            <a href={portfolio} target="_blank" rel="noreferrer">
                              Portfolio ↗
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {selectedMentorOfferings.length > 0 &&
              !isMyMentorCard(selectedMentor) && (
                <div className="mentor-modal-section">
                  <span>MENTORING LIST</span>

                  <h3>{selectedMentor.name}님의 멘토링</h3>

                  <div className="mentor-offering-list">
                    {selectedMentorOfferings.map((offering) => (
                      <div className="mentor-offering-card" key={offering.id}>
                        <div className="mentor-offering-card-top">
                          <strong>{offering.title}</strong>
                          <span>
                            {Number(offering.price || 0).toLocaleString()}원
                          </span>
                        </div>

                        <div className="mentor-skills">
                          {(offering.skills
                            ? offering.skills
                                .split(",")
                                .map((item) => item.trim())
                                .filter(Boolean)
                            : []
                          ).map((skill) => (
                            <span key={skill}>{skill}</span>
                          ))}
                        </div>

                        {Array.isArray(offering.slots) &&
                          offering.slots.length > 0 && (
                            <div className="mentor-offering-slot-list">
                              {offering.slots.slice(0, 3).map((slot) => (
                                <div
                                  className="mentor-schedule-badge"
                                  key={`${slot.date}-${slot.startTime}`}
                                >
                                  <span className="badge-date">
                                    📅 {slot.date.replaceAll("-", ".")}
                                  </span>
                                  <span className="badge-time">
                                    ⏰ {slot.startTime} ~ {slot.endTime}
                                  </span>
                                </div>
                              ))}
                              {offering.slots.length > 3 && (
                                <span className="mentor-offering-slot-more">
                                  외 {offering.slots.length - 3}건 신청 가능
                                </span>
                              )}
                            </div>
                          )}

                        <button
                          type="button"
                          className="mentor-offering-apply-button"
                          onClick={() =>
                            openReservationForOffering(selectedMentor, offering)
                          }
                        >
                          신청하기 →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div className="mentor-modal-section">
              <span>AVAILABLE SCHEDULES</span>

              <h3>상담 가능한 일정 및 시간</h3>

              {selectedMentor.availableSchedules?.length >
              0 ? (
                <div className="mentor-available-schedule-list">
                  {selectedMentor.availableSchedules.map(
                    (schedule) => (
                      <div
                        className="mentor-schedule-badge"
                        key={schedule.date}
                      >
                        <span className="badge-date">
                          📅{" "}
                          {schedule.date.replaceAll(
                            "-",
                            "."
                          )}{" "}
                          (
                          {schedule.day ||
                            getWeekDayName(
                              new Date(
                                `${schedule.date}T00:00:00`
                              )
                            )}
                          )
                        </span>

                        <span className="badge-time">
                          ⏰ {schedule.startTime} ~{" "}
                          {schedule.endTime}
                        </span>
                      </div>
                    )
                  )}
                </div>
              ) : selectedMentor.availableDates?.length >
                0 ? (
                <div className="mentor-available-schedule-list">
                  {selectedMentor.availableDates.map(
                    (date) => (
                      <div
                        className="mentor-schedule-badge"
                        key={date}
                      >
                        <span className="badge-date">
                          📅 {date.replaceAll("-", ".")} (
                          {getWeekDayName(
                            new Date(`${date}T00:00:00`)
                          )}
                          )
                        </span>

                        {selectedMentor.availableStart && (
                          <span className="badge-time">
                            ⏰{" "}
                            {
                              selectedMentor.availableStart
                            }{" "}
                            ~{" "}
                            {
                              selectedMentor.availableEnd
                            }
                          </span>
                        )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p>등록된 상담 일정이 없습니다.</p>
              )}
            </div>

            <div className="mentor-modal-bottom">
              <div>
                <small>1회 상담</small>

                <strong>
                  {Number(
                    selectedMentor.price
                  ).toLocaleString()}
                  원
                </strong>
              </div>

              {isMyMentorCard(selectedMentor) ? (
                <button
                  type="button"
                  className="mentor-request-button my-mentor-edit"
                  onClick={() => {
                    setSelectedMentor(null);
                    openRegisterModal();
                  }}
                >
                  내 멘토 정보 수정하기 →
                </button>
              ) : (
                <button
                  type="button"
                  className="mentor-request-button"
                  onClick={() =>
                    openReservation(selectedMentor)
                  }
                >
                  1:1 상담 신청하기 →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {reviewMentor && (
        <div
          className="modal-background"
          onClick={() => setReviewMentor(null)}
        >
          <div
            className="review-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="modal-close"
              onClick={() =>
                setReviewMentor(null)
              }
            >
              ×
            </button>

            <span className="section-label">
              MENTOR REVIEWS
            </span>

            <h2>{reviewMentor.name}님의 후기</h2>

            <div className="review-summary">
              <strong>★ {formatRating(reviewSummary.averageRating)}</strong>
              <span>후기 {reviewSummary.reviewCount}개</span>
            </div>

            {user ? (
              editingReviewId || eligibleReservations.length > 0 ? (
                <form className="review-form" onSubmit={handleReviewSubmit}>
                  <span className="review-form-label">
                    {editingReviewId ? "후기 수정" : "후기 작성"}
                  </span>

                  {!editingReviewId && (
                    <select
                      value={reviewForm.reservationId}
                      onChange={(e) =>
                        setReviewForm((prev) => ({
                          ...prev,
                          reservationId: e.target.value
                        }))
                      }
                    >
                      <option value="">
                        후기를 작성할 상담을 선택해주세요
                      </option>
                      {eligibleReservations.map((item) => (
                        <option
                          key={item.reservationId}
                          value={String(item.reservationId)}
                        >
                          {item.reservationDate} {item.reservationTime}
                        </option>
                      ))}
                    </select>
                  )}

                  <select
                    value={reviewForm.rating}
                    onChange={(e) =>
                      setReviewForm((prev) => ({
                        ...prev,
                        rating: Number(e.target.value)
                      }))
                    }
                  >
                    {[5, 4, 3, 2, 1].map((score) => (
                      <option key={score} value={score}>
                        {renderStars(score)} ({score}점)
                      </option>
                    ))}
                  </select>

                  <textarea
                    placeholder="상담은 어떠셨나요? 다음 사용자에게 도움이 될 후기를 남겨주세요."
                    value={reviewForm.content}
                    onChange={(e) =>
                      setReviewForm((prev) => ({
                        ...prev,
                        content: e.target.value
                      }))
                    }
                  />

                  <div className="review-form-actions">
                    <button type="submit">
                      {editingReviewId ? "수정 완료" : "후기 등록"}
                    </button>

                    {editingReviewId && (
                      <button
                        type="button"
                        className="review-form-cancel"
                        onClick={() => {
                          setEditingReviewId(null);
                          setReviewForm({
                            reservationId: "",
                            rating: 5,
                            content: ""
                          });
                        }}
                      >
                        취소
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="review-guide">
                  <p>
                    작성 가능한 후기가 없습니다.
                    <br />
                    승인되고 결제가 완료된 상담 중, 상담 날짜가 지났고
                    아직 후기를 작성하지 않은 예약만 후기를 남길 수 있습니다.
                  </p>
                </div>
              )
            ) : (
              <div className="review-guide">
                <p>후기 작성은 로그인 후 이용할 수 있습니다.</p>
              </div>
            )}

            <div className="review-list">
              {reviewSummary.reviews.length > 0 ? (
                reviewSummary.reviews.map((review) => (
                  <article className="review-item" key={review.id}>
                    <div>
                      <strong>{renderStars(review.rating)}</strong>
                      <span>{review.authorNickname}</span>
                    </div>

                    <p>{review.content}</p>

                    {user && review.authorId === user.id && (
                      <div className="review-item-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReviewId(review.id);
                            setReviewForm({
                              reservationId: String(review.reservationId),
                              rating: review.rating,
                              content: review.content
                            });
                          }}
                        >
                          수정
                        </button>

                        <button
                          type="button"
                          className="review-item-delete"
                          onClick={() => handleReviewDelete(review.id)}
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </article>
                ))
              ) : (
                <div className="review-empty">
                  아직 등록된 후기가 없습니다.
                </div>
              )}
            </div>

            <button
              type="button"
              className="review-close-button"
              onClick={() =>
                setReviewMentor(null)
              }
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {reservationMentor && (
        <div
          className="modal-background"
          onClick={() =>
            setReservationMentor(null)
          }
        >
          <form
            className="reservation-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
            onSubmit={handleReservationSubmit}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() =>
                setReservationMentor(null)
              }
            >
              ×
            </button>

            <span className="section-label">
              1:1 MENTORING
            </span>

            <h2>멘토링 상담 신청</h2>

            <div className="reservation-mentor">
              <div className="mentor-avatar small">
                {getProfileImage(
                  reservationMentor
                ) ? (
                  <img
                    src={getProfileImage(
                      reservationMentor
                    )}
                    alt={`${reservationMentor.name} 프로필`}
                  />
                ) : (
                  reservationMentor.name.charAt(0)
                )}
              </div>

              <div>
                <strong>
                  {reservationMentor.name}
                </strong>

                <span>
                  {reservationMentor.career}
                </span>
              </div>
            </div>

            <div className="reservation-section">
              <label>
                무엇을 상담받고 싶나요?
              </label>

              <div className="check-grid">
                {reservationMentor.consultationTypes.map((type) => (
                  <label
                    className={`check-item ${
                      reservationForm.consultationTypes.includes(
                        type
                      )
                        ? "selected"
                        : ""
                    }`}
                    key={type}
                  >
                    <input
                      type="checkbox"
                      checked={reservationForm.consultationTypes.includes(
                        type
                      )}
                      onChange={() =>
                        toggleReservationArray(
                          "consultationTypes",
                          type
                        )
                      }
                    />

                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="reservation-section">
              <label>
                관련 기술은 무엇인가요?
              </label>

              <div className="check-grid skills-grid">
                {reservationMentor.skills.map((skill) => (
                  <label
                    className={`check-item ${
                      reservationForm.skills.includes(
                        skill
                      )
                        ? "selected"
                        : ""
                    }`}
                    key={skill}
                  >
                    <input
                      type="checkbox"
                      checked={reservationForm.skills.includes(
                        skill
                      )}
                      onChange={() =>
                        toggleReservationArray(
                          "skills",
                          skill
                        )
                      }
                    />

                    <span>{skill}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="reservation-section">
              <label>예약 날짜</label>

              <div className="reservation-calendar">
                <div className="reservation-calendar-header">
                  <button
                    type="button"
                    className="calendar-month-button"
                    onClick={() =>
                      moveCalendarMonth(-1)
                    }
                  >
                    ‹
                  </button>

                  <strong>
                    {calendarDate.getFullYear()}년{" "}
                    {calendarDate.getMonth() + 1}월
                  </strong>

                  <button
                    type="button"
                    className="calendar-month-button"
                    onClick={() =>
                      moveCalendarMonth(1)
                    }
                  >
                    ›
                  </button>
                </div>

                <div className="reservation-calendar-week">
                  {weekDays.map((day, index) => (
                    <span
                      key={day}
                      className={
                        index === 5
                          ? "saturday"
                          : index === 6
                          ? "sunday"
                          : ""
                      }
                    >
                      {day}
                    </span>
                  ))}
                </div>

                <div className="reservation-calendar-grid">
                  {calendarDays.map(
                    (date, index) => {
                      if (!date) {
                        return (
                          <div
                            className="reservation-calendar-empty"
                            key={`empty-${index}`}
                          />
                        );
                      }

                      const past =
                        isPastDate(date);
                      const available =
                        isAvailableMentorDay(
                          date
                        );
                      const booked = isBookedMentorDate(date);
                      const selected =
                        isSelectedDate(date);
                      const today =
                        isToday(date);

                      return (
                        <button
                          type="button"
                          key={formatDateString(
                            date
                          )}
                          className={`reservation-calendar-day ${
                            past ? "past" : ""
                          } ${
                            !available
                              ? "unavailable"
                              : ""
                          } ${
                            available && !booked
                              ? "available"
                              : ""
                          } ${
                            booked ? "booked" : ""
                          } ${
                            selected
                              ? "selected"
                              : ""
                          } ${
                            today ? "today" : ""
                          }`}
                          disabled={
                            past || !available || booked
                          }
                          onClick={() =>
                            handleCalendarDateClick(
                              date
                            )
                          }
                        >
                          <span>
                            {date.getDate()}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>

                <div className="reservation-calendar-selected">
                  {reservationForm.date ? (
                    <>
                      <span>선택한 날짜</span>
                      <strong>
                        {reservationForm.date.replaceAll("-", ".")}
                        {(() => {
                          const sched =
                            reservationMentor?.availableSchedules?.find(
                              (s) => s.date === reservationForm.date
                            );
                          if (sched?.day) return ` (${sched.day})`;
                          const dt = new Date(
                            `${reservationForm.date}T00:00:00`
                          );
                          return ` (${getWeekDayName(dt)})`;
                        })()}
                      </strong>
                      {(() => {
                        const sched =
                          reservationMentor?.availableSchedules?.find(
                            (s) => s.date === reservationForm.date
                          );
                        if (sched?.startTime && sched?.endTime) {
                          return (
                            <span className="reservation-time-badge">
                              상담 가능: {sched.startTime} ~ {sched.endTime}
                            </span>
                          );
                        }
                        if (
                          reservationMentor?.availableStart &&
                          reservationMentor?.availableEnd
                        ) {
                          return (
                            <span className="reservation-time-badge">
                              상담 가능: {reservationMentor.availableStart} ~{" "}
                              {reservationMentor.availableEnd}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </>
                  ) : (
                    <span>상담 가능한 날짜를 선택해주세요.</span>
                  )}
                </div>

                <div className="reservation-available-schedule-list">
                  <strong>상담 가능한 날짜</strong>
                  {parseSchedulesFromMentor(reservationMentor)
                    .filter(
                      (schedule) => !bookedReservationDates.includes(schedule.date)
                    )
                    .map((schedule) => (
                      <span key={schedule.date}>
                        {schedule.date.replaceAll("-", ".")} ({schedule.day}) · {schedule.startTime} ~ {schedule.endTime}
                      </span>
                    ))}
                </div>

                <div className="reservation-calendar-guide">
                  <span>● 선택 가능</span>
                  <span>● 예약 완료</span>
                  <span>○ 상담 불가</span>
                </div>
              </div>
            </div>

            {reservationForm.time && (
              <div className="reservation-fixed-time">
                <span>상담 시간</span>
                <strong>{reservationForm.time}</strong>
                <small>선택한 날짜의 전체 상담 시간으로 예약됩니다.</small>
              </div>
            )}

            <div className="reservation-section">
              <label htmlFor="problem">
                멘토에게 전달할 내용을 작성해주세요.
              </label>

              <textarea
                id="problem"
                name="problem"
                value={reservationForm.problem}
                onChange={
                  handleReservationChange
                }
                placeholder={
                  "예) Spring Security 로그인은 되는데 로그인 후 사용자 정보가 조회되지 않습니다.\n현재 시도한 방법이나 오류 메시지도 함께 적어주시면 좋아요."
                }
                maxLength={2000}
                required
              />

              <small className="input-guide">
                현재 코드 상황과 오류 메시지를
                함께 작성하면 멘토가 상담을
                준비하는 데 도움이 됩니다.
              </small>
            </div>

            <div className="reservation-section">
              <label>관련 파일 첨부</label>

              <div className="file-upload-box">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  hidden
                />

                {!selectedFile ? (
                  <button
                    type="button"
                    className="file-upload-button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                  >
                    📎 파일 선택
                  </button>
                ) : (
                  <div className="selected-file">
                    <span>
                      📎 {selectedFile.name}
                    </span>

                    <button
                      type="button"
                      onClick={removeFile}
                    >
                      삭제
                    </button>
                  </div>
                )}

                <small>
                  프로젝트 파일, 이미지, 문서 등을
                  첨부할 수 있습니다. 최대 20MB
                </small>
              </div>
            </div>

            <div className="reservation-price">
              <div>
                <small>1회 상담</small>

                <strong>
                  {Number(
                    reservationMentor.price
                  ).toLocaleString()}
                  원
                </strong>
              </div>

              <span>
                멘토가 신청을 승인하면 결제를 진행할 수 있습니다.
              </span>
            </div>

            <button
              type="submit"
              className="reservation-submit-button"
            >
              상담 신청하기 →
            </button>
          </form>
        </div>
      )}

      {showRegister && (
        <div
          className="modal-background"
          onClick={() =>
            setShowRegister(false)
          }
        >
          <form
            className="register-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
            onSubmit={handleRegisterSubmit}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() =>
                setShowRegister(false)
              }
            >
              ×
            </button>

            <span className="section-label">
              {registerMode === "offering"
                ? editingOfferingId
                  ? "EDIT YOUR MENTORING"
                  : "ADD NEW MENTORING"
                : isEditingMentor
                ? "EDIT YOUR MENTOR PROFILE"
                : "BECOME A MENTOR"}
            </span>

            <h2>
              {registerMode === "offering"
                ? editingOfferingId
                  ? "멘토링 수정"
                  : "멘토 등록하기"
                : isEditingMentor
                ? "내 멘토 정보 수정"
                : "멘토 등록"}
            </h2>

            <p className="register-description">
              {registerMode === "offering"
                ? "내가 등록한 멘토 프로필은 그대로 유지되고, 이 멘토링 하나만 등록/수정됩니다."
                : "내가 가진 경험과 지식을 공유하고 개발자 지망생들과 함께 성장해보세요."}
            </p>

            {registerMode === "profile" && (
              <div className="register-profile-preview">
                <div className="mentor-avatar large">
                  {user?.profileImageUrl ? (
                    <img
                      src={`/api${user.profileImageUrl}`}
                      alt="내 프로필"
                    />
                  ) : (
                    (
                      user?.nickname || "나"
                    ).charAt(0)
                  )}
                </div>

                <div>
                  <strong>
                    {user?.nickname ||
                      "로그인이 필요합니다."}
                  </strong>

                  <span>
                    프로필 이미지와 닉네임은
                    내 프로필 정보와 연동됩니다.
                  </span>
                </div>
              </div>
            )}

            <div className="register-section">
              <label htmlFor="title">
                {registerMode === "offering"
                  ? "멘토링 이름"
                  : "멘토링 제목"}
              </label>

              <input
                id="title"
                name="title"
                value={registerForm.title}
                onChange={handleRegisterChange}
                placeholder={
                  registerMode === "offering"
                    ? "예) Java 멘토링"
                    : "예) Spring Boot 백엔드 개발 멘토링"
                }
                maxLength={100}
                required
              />
            </div>

            {registerMode === "profile" && (
              <>
                <div className="register-section">
                  <label htmlFor="career">
                    경력
                  </label>

                  <input
                    id="career"
                    name="career"
                    value={registerForm.career}
                    onChange={handleRegisterChange}
                    placeholder="예) 백엔드 개발 5년차"
                    required
                  />
                </div>

                <div className="register-section">
                  <label htmlFor="careerDetail">
                    경력 상세
                  </label>

                  <textarea
                    id="careerDetail"
                    name="careerDetail"
                    value={registerForm.careerDetail}
                    onChange={handleRegisterChange}
                    placeholder="근무 경험, 주요 업무, 사용 기술 등을 작성해주세요."
                    rows={4}
                  />
                </div>

                <div className="register-section">
                  <label htmlFor="certificates">
                    자격증
                  </label>

                  <input
                    id="certificates"
                    name="certificates"
                    value={registerForm.certificates}
                    onChange={handleRegisterChange}
                    placeholder="예) 정보처리기사, SQLD"
                  />

                  <small>
                    여러 개라면 쉼표(,)로 구분해주세요.
                  </small>
                </div>
              </>
            )}

            <div className="register-section">
              <label>주요 기술</label>

              <div className="check-grid skills-grid">
                {skillOptions.map((skill) => (
                  <label
                    className={`check-item ${
                      registerForm.skills.includes(
                        skill
                      )
                        ? "selected"
                        : ""
                    }`}
                    key={skill}
                  >
                    <input
                      type="checkbox"
                      checked={registerForm.skills.includes(
                        skill
                      )}
                      onChange={() =>
                        toggleRegisterArray(
                          "skills",
                          skill
                        )
                      }
                    />

                    <span>{skill}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="register-section">
              <label>
                주로 상담 가능한 분야
              </label>

              <div className="check-grid">
                {consultationTypes.map((type) => (
                  <label
                    className={`check-item ${
                      registerForm.consultationTypes.includes(
                        type
                      )
                        ? "selected"
                        : ""
                    }`}
                    key={type}
                  >
                    <input
                      type="checkbox"
                      checked={registerForm.consultationTypes.includes(
                        type
                      )}
                      onChange={() =>
                        toggleRegisterArray(
                          "consultationTypes",
                          type
                        )
                      }
                    />

                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="register-section">
              <label>멘토링 방식</label>

              <div className="mentoring-type-grid">
                {["온라인", "오프라인"].map(
                  (type) => (
                    <button
                      type="button"
                      className={
                        registerForm.mentoringType ===
                        type
                          ? "active"
                          : ""
                      }
                      key={type}
                      onClick={() =>
                        setRegisterForm(
                          (prev) => ({
                            ...prev,
                            mentoringType: type
                          })
                        )
                      }
                    >
                      {type}
                    </button>
                  )
                )}
              </div>
            </div>

            {registerMode === "profile" && (
              <>
                <div className="register-section">
                  <label htmlFor="github">
                    GitHub
                  </label>

                  <input
                    id="github"
                    name="github"
                    value={registerForm.github}
                    onChange={handleRegisterChange}
                    placeholder="https://github.com/..."
                  />
                </div>

                <div className="register-section">
                  <label htmlFor="velog">
                    Velog
                  </label>

                  <input
                    id="velog"
                    name="velog"
                    value={registerForm.velog}
                    onChange={handleRegisterChange}
                    placeholder="https://velog.io/@..."
                  />
                </div>

                <div className="register-section">
                  <label htmlFor="portfolio">
                    Portfolio
                  </label>

                  <input
                    id="portfolio"
                    name="portfolio"
                    value={registerForm.portfolio}
                    onChange={handleRegisterChange}
                    placeholder="포트폴리오 주소"
                  />
                </div>

                <div className="register-section">
                  <label htmlFor="introduction">
                    멘토 소개
                  </label>

                  <textarea
                    id="introduction"
                    name="introduction"
                    value={
                      registerForm.introduction
                    }
                    onChange={handleRegisterChange}
                    placeholder="어떤 개발 경험이 있고 어떤 도움을 줄 수 있는지 작성해주세요."
                    rows={5}
                    maxLength={1000}
                    required
                  />
                </div>
              </>
            )}

            <div className="register-section">
              <label htmlFor="price">
                1회 상담 가격
              </label>

              <div className="price-input">
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  value={registerForm.price}
                  onChange={handleRegisterChange}
                  placeholder="30000"
                  required
                />

                <span>원</span>
              </div>
            </div>

            {/* 상담 가능한 날짜 및 시간 개별 설정 */}
            <div className="register-section">
              <label>
                상담 가능한 날짜 및 시간 설정
              </label>

              <small className="register-calendar-description">
                달력에서 상담이 가능한 날짜를 클릭하면 아래에 날짜별 시간 설정 카드가 생성됩니다.
                날짜마다 시작 시간과 종료 시간을 다르게 설정할 수 있습니다.
              </small>

              <div className="mentor-register-calendar">
                <div className="mentor-register-calendar-header">
                  <button
                    type="button"
                    onClick={() =>
                      moveRegisterCalendarMonth(
                        -1
                      )
                    }
                  >
                    ‹
                  </button>

                  <strong>
                    {registerCalendarDate.getFullYear()}
                    년{" "}
                    {registerCalendarDate.getMonth() +
                      1}
                    월
                  </strong>

                  <button
                    type="button"
                    onClick={() =>
                      moveRegisterCalendarMonth(
                        1
                      )
                    }
                  >
                    ›
                  </button>
                </div>

                <div className="mentor-register-calendar-week">
                  {weekDays.map((day, index) => (
                    <span
                      key={day}
                      className={
                        index === 5
                          ? "saturday"
                          : index === 6
                          ? "sunday"
                          : ""
                      }
                    >
                      {day}
                    </span>
                  ))}
                </div>

                <div className="mentor-register-calendar-grid">
                  {registerCalendarDays.map(
                    (date, index) => {
                      if (!date) {
                        return (
                          <div
                            className="mentor-register-calendar-empty"
                            key={`empty-${index}`}
                          />
                        );
                      }

                      const past =
                        isPastDate(date);
                      const selected =
                        isRegisterDateSelected(
                          date
                        );
                      const today =
                        isToday(date);

                      return (
                        <button
                          type="button"
                          key={formatDateString(
                            date
                          )}
                          className={`mentor-register-calendar-day ${
                            past ? "past" : ""
                          } ${
                            selected
                              ? "selected"
                              : ""
                          } ${
                            today ? "today" : ""
                          }`}
                          disabled={past}
                          onClick={() =>
                            toggleAvailableSchedule(
                              date
                            )
                          }
                        >
                          <span>
                            {date.getDate()}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>

                <div className="mentor-register-calendar-guide">
                  <span>● 선택 가능</span>
                  <span>● 선택됨</span>
                  <span>○ 지난 날짜</span>
                </div>
              </div>

              {/* 날짜별 상담 시간 개별 설정 카드 목록 */}
              <div className="schedule-config-section">
                <label className="schedule-config-label">
                  선택한 날짜별 상담 시간 ({registerForm.availableSchedules.length}일 선택됨)
                </label>

                {registerForm.availableSchedules.length > 0 ? (
                  <div className="schedule-config-list">
                    {registerForm.availableSchedules.map((schedule) => {
                      const locked = registerLockedDates.includes(schedule.date);

                      return (
                        <div
                          className={`schedule-config-item${locked ? " locked" : ""}`}
                          key={schedule.date}
                        >
                          <div className="schedule-config-header">
                            <span className="schedule-date-text">
                              📅 {schedule.date.replaceAll("-", ".")} ({schedule.day})
                            </span>
                            {locked ? (
                              <span className="schedule-lock-badge" title="이미 예약이 있어 수정/삭제할 수 없습니다.">
                                🔒 예약됨
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="schedule-delete-btn"
                                title="일정 삭제"
                                onClick={() => removeSchedule(schedule.date)}
                              >
                                × 삭제
                              </button>
                            )}
                          </div>

                          <div className="schedule-config-times">
                            <div className="schedule-time-field">
                              <small>시작 시간</small>
                              <input
                                type="time"
                                value={schedule.startTime}
                                onChange={(e) =>
                                  updateScheduleTime(schedule.date, "startTime", e.target.value)
                                }
                                disabled={locked}
                                required
                              />
                            </div>

                            <span className="schedule-time-divider">~</span>

                            <div className="schedule-time-field">
                              <small>종료 시간</small>
                              <input
                                type="time"
                                value={schedule.endTime}
                                onChange={(e) =>
                                  updateScheduleTime(schedule.date, "endTime", e.target.value)
                                }
                                disabled={locked}
                                required
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="schedule-config-empty">
                    <p>위 달력에서 상담이 가능한 날짜를 클릭하여 추가해주세요.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="register-notice">
              <strong>
                {registerMode === "offering"
                  ? editingOfferingId
                    ? "이 멘토링만 수정됩니다."
                    : "멘토링 등록 전 확인해주세요."
                  : isEditingMentor
                  ? "멘토 정보를 수정합니다."
                  : "멘토 등록 전 확인해주세요."}
              </strong>

              <p>
                {registerMode === "offering"
                  ? "여기서 등록/수정하는 멘토링은 다른 멘토링(예: Spring, React)이나 멘토 프로필 자체에는 영향을 주지 않습니다."
                  : "등록한 경력과 자격증 정보는 다른 사용자가 멘토를 선택할 때 확인할 수 있습니다. 상담 가능한 날짜와 시간도 예약 과정에서 사용됩니다."}
              </p>
            </div>

            <button
              type="submit"
              className="register-submit-button"
            >
              {registerMode === "offering"
                ? editingOfferingId
                  ? "멘토링 수정하기 →"
                  : "멘토링 등록하기 →"
                : isEditingMentor
                ? "멘토 정보 수정하기 →"
                : "멘토 등록하기 →"}
            </button>

            {registerMode === "profile" && isEditingMentor && (
              <button
                type="button"
                className="mentor-delete-button"
                onClick={handleDeleteMentor}
              >
                멘토 등록 삭제
              </button>
            )}

            <button
              type="button"
              className="mentor-cancel-button"
              onClick={() =>
                setShowRegister(false)
              }
            >
              취소
            </button>
          </form>
        </div>
      )}

      {detailReservation && (
        <div
          className="modal-background"
          onClick={() => setDetailReservation(null)}
        >
          <div
            className="reservation-detail-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setDetailReservation(null)}
            >
              ×
            </button>

            <span className="section-label">RESERVATION DETAIL</span>
            <h2>멘토링 상세</h2>

            {(() => {
              const { item, role } = detailReservation;
              const phase = getReservationPhase(item, role);
              const consultationTags = item.consultationTypes
                ? item.consultationTypes
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                : [];
              const skillTags = item.skills
                ? item.skills
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                : [];

              return (
                <>
                  <div className="reservation-detail-row">
                    <span>{role === "mentor" ? "신청자" : "멘토"}</span>
                    <strong>
                      {role === "mentor" ? item.memberNickname : item.mentorName}
                    </strong>
                  </div>

                  <div className="reservation-detail-row">
                    <span>멘토링</span>
                    <strong>
                      {item.offeringTitle ||
                        (item.skills ? `${item.skills} 멘토링` : "멘토링")}
                    </strong>
                  </div>

                  {consultationTags.length > 0 && (
                    <div className="reservation-detail-row">
                      <span>상담 분야</span>
                      <div className="reservation-tag-row">
                        {consultationTags.map((tag) => (
                          <em key={tag} className="reservation-tag">
                            {tag}
                          </em>
                        ))}
                      </div>
                    </div>
                  )}

                  {skillTags.length > 0 && (
                    <div className="reservation-detail-row">
                      <span>관련 기술</span>
                      <div className="reservation-tag-row">
                        {skillTags.map((tag) => (
                          <em key={tag} className="reservation-tag">
                            {tag}
                          </em>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="reservation-detail-row">
                    <span>예약 날짜</span>
                    <strong>{item.reservationDate}</strong>
                  </div>

                  <div className="reservation-detail-row">
                    <span>시간</span>
                    <strong>{item.reservationTime}</strong>
                  </div>

                  {item.createdAt && (
                    <div className="reservation-detail-row">
                      <span>신청 날짜</span>
                      <strong>
                        {item.createdAt.slice(0, 10).replaceAll("-", ".")}
                      </strong>
                    </div>
                  )}

                  <div className="reservation-detail-row">
                    <span>상태</span>
                    <em className={`reservation-status ${phase.key}`}>
                      {phase.emoji} {phase.label}
                    </em>
                  </div>

                  {phase.message && (
                    <p className="reservation-detail-message">
                      {phase.message}
                    </p>
                  )}

                  {role === "mentor" && item.problem && (
                    <div className="reservation-detail-block">
                      <span>신청 내용</span>
                      <p>{item.problem}</p>
                    </div>
                  )}

                  {role === "applicant" && item.problem && (
                    <div className="reservation-detail-block">
                      <span>내가 전달한 내용</span>
                      <p>{item.problem}</p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {chatReservation && (
        <div className="modal-background" onClick={closeChat}>
          <div
            className="mentoring-chat-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="modal-close" onClick={closeChat}>
              ×
            </button>

            <span className="section-label">MENTORING CHAT</span>
            <h2>
              {chatReservation.role === "mentor"
                ? chatReservation.item.memberNickname
                : chatReservation.item.mentorName}
            </h2>

            <div className="mentoring-chat-meta">
              <span>
                {chatReservation.item.offeringTitle ||
                  (chatReservation.item.skills
                    ? `${chatReservation.item.skills} 멘토링`
                    : "멘토링")}
              </span>
              <span>
                {chatReservation.item.reservationDate} ·{" "}
                {chatReservation.item.reservationTime}
              </span>
            </div>

            <div className="mentoring-chat-messages">
              {chatLoading && (
                <p className="mentoring-chat-empty">불러오는 중입니다...</p>
              )}

              {!chatLoading && chatMessages.length === 0 && (
                <p className="mentoring-chat-empty">
                  아직 주고받은 메시지가 없습니다.
                  <br />첫 메시지를 보내보세요.
                </p>
              )}

              {!chatLoading &&
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`mentoring-chat-bubble-row ${
                      message.senderId === user?.id ? "me" : ""
                    }`}
                  >
                    <div className="mentoring-chat-bubble">
                      <p>{message.content}</p>
                      <span>
                        {message.createdAt
                          ? message.createdAt.slice(11, 16)
                          : ""}
                      </span>
                    </div>
                  </div>
                ))}

              <div ref={chatBottomRef} />
            </div>

            <form
              className="mentoring-chat-input-form"
              onSubmit={handleSendChatMessage}
            >
              <input
                type="text"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="메시지를 입력하세요..."
                maxLength={1000}
              />
              <button type="submit">전송</button>
            </form>
          </div>
        </div>
      )}

      {rejectingReservation && (
        <div className="modal-background" onClick={closeRejectModal}>
          <div
            className="reject-reason-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={closeRejectModal}
            >
              ×
            </button>

            <span className="section-label">REJECT REQUEST</span>
            <h2>예약 거절</h2>

            <p className="reject-reason-guide">
              {rejectingReservation.memberNickname}님의 신청을 거절합니다.
              간단한 사유를 입력하면 신청자에게 함께 전달됩니다.
            </p>

            <label htmlFor="reject-reason">거절 사유 (선택)</label>
            <textarea
              id="reject-reason"
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              placeholder="예) 해당 시간에는 상담이 어렵습니다."
              maxLength={500}
            />

            <div className="reject-reason-actions">
              <button
                type="button"
                className="mentor-cancel-button"
                onClick={closeRejectModal}
              >
                취소
              </button>
              <button
                type="button"
                className="reject-confirm-button"
                onClick={submitRejectReservation}
              >
                거절하기
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingOffering && (
        <div className="modal-background" onClick={closeDeleteOfferingModal}>
          <div
            className="reject-reason-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={closeDeleteOfferingModal}
            >
              ×
            </button>

            <span className="section-label">DELETE MENTORING</span>
            <h2>멘토링 삭제</h2>

            <p className="reject-reason-guide">
              "{deletingOffering.title}" 멘토링을 삭제하시겠습니까?
              <br />
              예약이 진행 중인 멘토링은 삭제할 수 없으며, 이미 완료된 예약
              기록은 그대로 유지됩니다.
            </p>

            <div className="reject-reason-actions">
              <button
                type="button"
                className="mentor-cancel-button"
                onClick={closeDeleteOfferingModal}
              >
                취소
              </button>
              <button
                type="button"
                className="reject-confirm-button"
                onClick={confirmDeleteOffering}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Mentoring;
