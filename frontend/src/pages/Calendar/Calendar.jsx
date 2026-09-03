import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Calendar.css";
import calendarBg from "../../assets/images/calendar-bg.jpg";

const API_URL = "http://localhost:8080/api/calendar/personal";
const CATEGORY_STORAGE_KEY = "easys-calendar-categories";
// 모임 캘린더 조회/등록 API
//
// 주의: vite.config.js의 /api 프록시는 백엔드로 전달할 때 "/api" 접두사를
// 제거한다(rewrite). 대부분의 컨트롤러는 "/api" 없이 매핑돼 있어 그렇게
// 동작해야 맞지만, StudyGroupApiController는 "/api/study-groups"로 매핑돼
// 있어 접두사가 제거되면 존재하지 않는 경로("/study-groups")로 요청이
// 가서 항상 404가 났다. API_URL(개인 캘린더)과 동일하게 절대 경로로 백엔드에
// 직접 요청해 프록시의 접두사 제거를 우회한다.
const GROUP_API_URL = "http://localhost:8080/api/study-groups";

function toLocalDateTimeParam(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
}

function Calendar() {
  const navigate = useNavigate();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [schedules, setSchedules] = useState([]);
  const [activeTab, setActiveTab] = useState("personal");
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [categoryMap, setCategoryMap] = useState({});

  // 모임 캘린더 (스터디 예약 확정 시 자동 생성 + 수동 등록)
  const [groupSchedules, setGroupSchedules] = useState([]);
  const [upcomingGroupSchedules, setUpcomingGroupSchedules] = useState([]);

  const [form, setForm] = useState({
    title: "",
    content: "",
    startAt: "",
    endAt: "",
    type: "general",
  });

  /* ================================
     스크롤
  ================================= */

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /* ================================
     카테고리 정보 불러오기
  ================================= */

  useEffect(() => {
    try {
      const savedCategories = localStorage.getItem(
        CATEGORY_STORAGE_KEY
      );

      if (savedCategories) {
        setCategoryMap(JSON.parse(savedCategories));
      }
    } catch (error) {
      console.error("카테고리 정보 불러오기 오류:", error);
    }
  }, []);

  /* ================================
     개인 일정 조회
  ================================= */

  const loadSchedules = async () => {
    try {
      const response = await fetch(API_URL, {
        credentials: "include",
      });

      if (!response.ok) {
        let errorMessage = `일정을 불러오지 못했습니다. (HTTP ${response.status})`;

        try {
          const errorData = await response.json();

          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // JSON 형태의 오류 응답이 아닌 경우
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      console.log("내 개인 일정:", data);

      // 달력 그리드는 지난 날짜의 일정도 그대로 보여줘야 하므로 여기서는
      // 걸러내지 않는다 ("나의 일정" 목록에서만 종료된 일정을 숨긴다).
      setSchedules(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("캘린더 조회 오류:", error);
      setSchedules([]);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  // "나의 일정" 목록에서만 종료된 일정을 자동으로 숨기기 위한 시계 틱.
  // schedules 자체는 건드리지 않아 달력 그리드에는 영향이 없다.
  const [scheduleListTick, setScheduleListTick] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setScheduleListTick(Date.now());
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  /* ================================
     날짜 관련
  ================================= */

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = `${year}년 ${month + 1}월`;

  const firstDay = new Date(year, month, 1).getDay();

  const lastDate = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= lastDate; day++) {
    calendarDays.push(
      new Date(year, month, day)
    );
  }

  while (calendarDays.length % 7 !== 0) {
    calendarDays.push(null);
  }

  /* ================================
     오늘
  ================================= */

  const today = new Date();

  const isToday = (date) => {
    if (!date) return false;

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  /* ================================
     일정 날짜 비교
  ================================= */

  const getDateOnly = (date) => {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
  };

  const parseScheduleDate = (value) => {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
  };

  const isScheduleOnDate = (schedule, date) => {
    if (
      !date ||
      !schedule.startAt ||
      !schedule.endAt
    ) {
      return false;
    }

    const targetDate = getDateOnly(date);

    const startDate = parseScheduleDate(
      schedule.startAt
    );

    const endDate = parseScheduleDate(
      schedule.endAt
    );

    if (!startDate || !endDate) {
      return false;
    }

    return (
      targetDate >= startDate &&
      targetDate <= endDate
    );
  };

  /* ================================
     이전 / 다음 달
  ================================= */

  const moveMonth = (amount) => {
    setCurrentDate(
      new Date(year, month + amount, 1)
    );
  };

  /* ================================
     오늘
  ================================= */

  const moveToday = () => {
    setCurrentDate(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );
  };

  /* ================================
     모임 일정 조회 (현재 보고 있는 달 범위)
  ================================= */

  const loadGroupSchedules = async () => {
    try {
      const start = toLocalDateTimeParam(new Date(year, month, 1, 0, 0, 0));
      const end = toLocalDateTimeParam(new Date(year, month + 1, 0, 23, 59, 59));

      const response = await fetch(
        `${GROUP_API_URL}?start=${start}&end=${end}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        setGroupSchedules([]);
        return;
      }

      const data = await response.json();

      setGroupSchedules(
        Array.isArray(data)
          ? data.map((item) => ({ ...item, type: (item.type || "study").toLowerCase() }))
          : []
      );
    } catch (error) {
      console.error("모임 일정 조회 오류:", error);
      setGroupSchedules([]);
    }
  };

  useEffect(() => {
    loadGroupSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  /* ================================
     다가오는 모임 일정 조회
  ================================= */

  const loadUpcomingGroupSchedules = async () => {
    try {
      const response = await fetch(`${GROUP_API_URL}/upcoming`, {
        credentials: "include",
      });

      if (!response.ok) {
        setUpcomingGroupSchedules([]);
        return;
      }

      const data = await response.json();

      setUpcomingGroupSchedules(
        Array.isArray(data)
          ? data
              .map((item) => ({ ...item, type: (item.type || "study").toLowerCase() }))
              .filter((schedule) => !isScheduleEnded(schedule))
          : []
      );
    } catch (error) {
      console.error("다가오는 모임 일정 조회 오류:", error);
      setUpcomingGroupSchedules([]);
    }
  };

  useEffect(() => {
    loadUpcomingGroupSchedules();
  }, []);

  // 이용(모임) 종료 시각이 지났는지 확인 (스터디 모집 글의 예약 카드와
  // 동일하게, 지난 일정은 "다가오는 모임 일정"에서 자동으로 숨긴다)
  const isScheduleEnded = (schedule) => {
    const endAt = schedule.endAt || schedule.startAt;
    if (!endAt) return false;
    return new Date(endAt).getTime() <= Date.now();
  };

  // 새로고침 없이도 페이지를 보고 있는 동안 종료 시각이 지나면 사라지도록
  // 1분마다 다시 걸러낸다.
  useEffect(() => {
    const timer = setInterval(() => {
      setUpcomingGroupSchedules((prev) =>
        prev.filter((schedule) => !isScheduleEnded(schedule))
      );
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  // "나의 일정" 목록 전용: 달력 그리드(schedules)는 그대로 두고, 목록에
  // 보여줄 때만 종료된 일정을 제외한다. scheduleListTick이 1분마다 바뀌면서
  // 새로고침 없이도 다시 계산되게 한다.
  const visibleSchedules = useMemo(
    () => schedules.filter((schedule) => !isScheduleEnded(schedule)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schedules, scheduleListTick]
  );

  /* ================================
     입력값
  ================================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ================================
     일정 추가 모달
  ================================= */

  const openCreateModal = () => {
    setEditingSchedule(null);

    setForm({
      title: "",
      content: "",
      startAt: "",
      endAt: "",
      type:
        activeTab === "personal"
          ? "general"
          : "study",
    });

    setShowModal(true);
  };

  /* ================================
     일정 수정
  ================================= */

  const openEditModal = (schedule) => {
    setEditingSchedule(schedule);

    setForm({
      title: schedule.title || "",
      content: schedule.content || "",
      startAt: schedule.startAt
        ? schedule.startAt.slice(0, 16)
        : "",
      endAt: schedule.endAt
        ? schedule.endAt.slice(0, 16)
        : "",
      type:
        categoryMap[schedule.id] ||
        schedule.type ||
        "general",
    });

    setShowModal(true);
  };

  /* ================================
     모달 닫기
  ================================= */

  const closeModal = () => {
    setShowModal(false);
    setEditingSchedule(null);

    setForm({
      title: "",
      content: "",
      startAt: "",
      endAt: "",
      type:
        activeTab === "personal"
          ? "general"
          : "study",
    });
  };

  /* ================================
     카테고리 저장
  ================================= */

  const saveCategory = (scheduleId, type) => {
    const updatedMap = {
      ...categoryMap,
      [scheduleId]: type,
    };

    setCategoryMap(updatedMap);

    try {
      localStorage.setItem(
        CATEGORY_STORAGE_KEY,
        JSON.stringify(updatedMap)
      );
    } catch (error) {
      console.error(
        "카테고리 저장 오류:",
        error
      );
    }
  };

  /* ================================
     개인 일정 추가 / 수정
  ================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("일정 제목을 입력해주세요.");
      return;
    }

    if (!form.startAt || !form.endAt) {
      alert(
        "시작 시간과 종료 시간을 입력해주세요."
      );
      return;
    }

    if (
      new Date(form.startAt) >
      new Date(form.endAt)
    ) {
      alert(
        "시작 시간은 종료 시간보다 늦을 수 없습니다."
      );
      return;
    }

    const isEdit = Boolean(editingSchedule);

    // 모임 일정 등록 (수정 UI는 아직 없으므로 생성만 처리)
    if (activeTab === "group") {
      try {
        const response = await fetch(GROUP_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.content.trim(),
            type: form.type === "mentoring" ? "MENTORING" : "STUDY",
            startAt: form.startAt,
            endAt: form.endAt,
          }),
        });

        if (!response.ok) {
          let errorMessage = "모임 일정 등록에 실패했습니다.";

          try {
            const errorData = await response.json();
            if (errorData.message) {
              errorMessage = errorData.message;
            }
          } catch {
            // JSON 형태의 오류 응답이 아닌 경우
          }

          throw new Error(`${errorMessage} (HTTP ${response.status})`);
        }

        await Promise.all([loadGroupSchedules(), loadUpcomingGroupSchedules()]);

        closeModal();

        alert("모임 일정이 등록되었습니다.");
      } catch (error) {
        console.error("모임 일정 등록 오류:", error);
        alert(error.message);
      }

      return;
    }

    try {
      const url = isEdit
        ? `${API_URL}/${editingSchedule.id}`
        : API_URL;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content.trim(),
          startAt: form.startAt,
          endAt: form.endAt,
        }),
      });

      if (!response.ok) {
        let errorMessage = isEdit
          ? "일정 수정에 실패했습니다."
          : "일정 등록에 실패했습니다.";

        try {
          const errorData = await response.json();

          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // JSON 형태의 오류 응답이 아닌 경우
        }

        throw new Error(
          `${errorMessage} (HTTP ${response.status})`
        );
      }

      const savedSchedule =
        await response.json();

      if (savedSchedule?.id) {
        saveCategory(
          savedSchedule.id,
          form.type
        );
      }

      await loadSchedules();

      closeModal();

      alert(
        isEdit
          ? "일정이 수정되었습니다."
          : "일정이 등록되었습니다."
      );
    } catch (error) {
      console.error(
        isEdit
          ? "일정 수정 오류:"
          : "일정 등록 오류:",
        error
      );

      alert(error.message);
    }
  };

  /* ================================
     개인 일정 삭제
  ================================= */

  const handleDelete = async (scheduleId) => {
    const confirmed = window.confirm(
      "이 일정을 삭제하시겠습니까?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/${scheduleId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(
          "일정 삭제에 실패했습니다."
        );
      }

      setSchedules((prev) =>
        prev.filter(
          (schedule) =>
            schedule.id !== scheduleId
        )
      );

      const updatedMap = {
        ...categoryMap,
      };

      delete updatedMap[scheduleId];

      setCategoryMap(updatedMap);

      localStorage.setItem(
        CATEGORY_STORAGE_KEY,
        JSON.stringify(updatedMap)
      );

      alert("일정이 삭제되었습니다.");
    } catch (error) {
      console.error(
        "일정 삭제 오류:",
        error
      );

      alert(error.message);
    }
  };

  /* ================================
     시간 표시
  ================================= */

  const formatTime = (dateTime) => {
    if (!dateTime) return "";

    return new Date(
      dateTime
    ).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  /* ================================
     날짜 표시
  ================================= */

  const formatDate = (dateTime) => {
    if (!dateTime) return "";

    return dateTime
      .replace("T", " ")
      .slice(0, 16);
  };

  /* ================================
     개인 일정 카테고리
  ================================= */

  const getPersonalType = (schedule) => {
    return (
      categoryMap[schedule.id] ||
      schedule.type ||
      "general"
    );
  };

  const getPersonalTypeName = (type) => {
    if (type === "certificate") {
      return "자격증";
    }

    return "일반 일정";
  };

  /* ================================
     모임 카테고리
  ================================= */

  const getGroupTypeName = (type) => {
    if (type === "mentoring") {
      return "멘토링";
    }

    return "스터디";
  };

  /* ================================
     렌더링
  ================================= */

  return (
    <main className="calendar-page">
      {/* ================================
          HERO
      ================================= */}

      <section className="calendar-hero">
        <div
          className="calendar-hero-bg"
          style={{
            backgroundImage: `url(${calendarBg})`,
            transform: `scale(1.08) translateY(${scrollY * 0.35}px)`,
          }}
        />

        <div className="calendar-hero-overlay" />

        <div className="calendar-hero-content">
          <span className="calendar-eyebrow">
            EASYS CALENDAR
          </span>

          <h1>캘린더</h1>

          <p>
            나의 일정과 모임 일정을
            <br />
            한 곳에서 관리해보세요.
          </p>
        </div>
      </section>

      {/* ================================
          CONTENT
      ================================= */}

      <section className="calendar-content">
        {/* ================================
            TABS
        ================================= */}

        <div className="calendar-tabs">
          <button
            className={`calendar-tab ${
              activeTab === "personal"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveTab("personal")
            }
          >
            나의 캘린더
          </button>

          <button
            className={`calendar-tab ${
              activeTab === "group"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveTab("group")
            }
          >
            모임 캘린더
          </button>
        </div>

        {/* ==================================================
            나의 캘린더
        ================================================== */}

        {activeTab === "personal" && (
          <>
            <section className="schedule-section personal-schedule-section">
              <div className="section-heading">
                <div>
                  <span className="section-label">
                    MY SCHEDULE
                  </span>

                  <h2>나의 일정</h2>
                </div>

                <button
                  className="add-schedule-button"
                  onClick={openCreateModal}
                >
                  + 일정 추가
                </button>
              </div>

              <div className="calendar-legend personal-legend">
                <span>
                  <i className="legend-dot general" />
                  일반 일정
                </span>

                <span>
                  <i className="legend-dot certificate" />
                  자격증
                </span>
              </div>

              <div className="schedule-list">
                {visibleSchedules.length === 0 ? (
                  <div className="empty-schedule">
                    등록된 개인 일정이 없습니다.
                  </div>
                ) : (
                  visibleSchedules.map((schedule) => {
                    const type =
                      getPersonalType(
                        schedule
                      );

                    return (
                      <div
                        className={`schedule-item ${type}`}
                        key={schedule.id}
                      >
                        <div className="schedule-time">
                          {formatTime(
                            schedule.startAt
                          )}
                        </div>

                        <div
                          className={`schedule-color ${type}`}
                        />

                        <div className="schedule-info">
                          <div className="schedule-title-row">
                            <strong>
                              {schedule.title}
                            </strong>

                            <span
                              className={`schedule-type-badge ${type}`}
                            >
                              {getPersonalTypeName(
                                type
                              )}
                            </span>
                          </div>

                          <span>
                            {schedule.content ||
                              "내용 없음"}
                          </span>

                          <small>
                            {formatDate(
                              schedule.startAt
                            )}{" "}
                            ~{" "}
                            {formatDate(
                              schedule.endAt
                            )}
                          </small>
                        </div>

                        <div className="schedule-actions">
                          <button
                            className="schedule-edit-button"
                            onClick={() =>
                              openEditModal(
                                schedule
                              )
                            }
                          >
                            수정
                          </button>

                          <button
                            className="schedule-delete-button"
                            onClick={() =>
                              handleDelete(
                                schedule.id
                              )
                            }
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* 개인 달력 */}

            <section className="calendar-section">
              <div className="calendar-header">
                <div className="calendar-month">
                  <button
                    className="month-arrow"
                    onClick={() =>
                      moveMonth(-1)
                    }
                  >
                    ←
                  </button>

                  <h2>{monthName}</h2>

                  <button
                    className="month-arrow"
                    onClick={() =>
                      moveMonth(1)
                    }
                  >
                    →
                  </button>
                </div>

                <button
                  className="today-button"
                  onClick={moveToday}
                >
                  오늘
                </button>
              </div>

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
                  {calendarDays.map(
                    (date, index) => (
                      <div
                        className={`calendar-day ${
                          isToday(date)
                            ? "today"
                            : ""
                        }`}
                        key={index}
                      >
                        {date && (
                          <>
                            <span className="day-number">
                              {date.getDate()}
                            </span>

                            <div className="day-events">
                              {schedules
                                .filter(
                                  (schedule) =>
                                    isScheduleOnDate(
                                      schedule,
                                      date
                                    )
                                )
                                .map(
                                  (schedule) => {
                                    const type =
                                      getPersonalType(
                                        schedule
                                      );

                                    return (
                                      <div
                                        className={`calendar-event personal ${type}`}
                                        key={
                                          schedule.id
                                        }
                                        title={
                                          schedule.title
                                        }
                                      >
                                        {
                                          schedule.title
                                        }
                                      </div>
                                    );
                                  }
                                )}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            </section>
          </>
        )}

        {/* ==================================================
            모임 캘린더
        ================================================== */}

        {activeTab === "group" && (
          <>
            <section className="group-add-section">
              <div className="group-add-card">
                <div>
                  <span className="section-label">
                    GROUP SCHEDULE
                  </span>

                  <h3>
                    새로운 모임 일정을
                    <br />
                    등록해보세요.
                  </h3>

                  <p>
                    스터디룸 예약이 확정되면 자동으로 모임 일정이 등록됩니다.
                    <br />
                    별도의 모임 일정도 직접 등록할 수 있어요.
                  </p>
                </div>

                <button
                  className="add-schedule-button"
                  onClick={openCreateModal}
                >
                  + 모임 일정 추가
                </button>
              </div>
            </section>

            <section className="group-section group-upcoming-section">
              <div className="section-heading">
                <div>
                  <span className="section-label">
                    UPCOMING GROUP
                  </span>

                  <h2>다가오는 모임</h2>
                </div>

                <a
                  href="/study"
                  className="more-link"
                >
                  전체보기 →
                </a>
              </div>

              <div className="calendar-legend group-legend">
                <span>
                  <i className="legend-dot mentoring" />
                  멘토링
                </span>

                <span>
                  <i className="legend-dot study" />
                  스터디
                </span>
              </div>

              {upcomingGroupSchedules.length === 0 && (
                <p className="group-empty-message">
                  다가오는 모임 일정이 없습니다.
                </p>
              )}

              <div className="group-grid">
                {upcomingGroupSchedules
                  .slice(0, 3)
                  .map((schedule) => (
                    <article
                      className={`group-card ${schedule.type}`}
                      key={schedule.id}
                      onClick={() =>
                        schedule.studyId && navigate(`/study/${schedule.studyId}`)
                      }
                      style={{ cursor: schedule.studyId ? "pointer" : "default" }}
                    >
                      <div className="group-card-date">
                        <span>
                          {new Date(
                            schedule.startAt
                          )
                            .toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                              }
                            )
                            .toUpperCase()}
                        </span>

                        <strong>
                          {new Date(
                            schedule.startAt
                          ).getDate()}
                        </strong>
                      </div>

                      <div className="group-card-content">
                        <span
                          className={`group-category ${schedule.type}`}
                        >
                          {getGroupTypeName(
                            schedule.type
                          )}
                        </span>

                        <h3>
                          {schedule.title}
                        </h3>

                        <p>
                          {new Date(
                            schedule.startAt
                          ).toLocaleDateString(
                            "ko-KR",
                            {
                              weekday: "long",
                            }
                          )}{" "}
                          ·{" "}
                          {formatTime(
                            schedule.startAt
                          )}
                        </p>

                        <span className="group-members">
                          👥 {schedule.members}
                        </span>
                      </div>
                    </article>
                  ))}
              </div>
            </section>

            <section className="calendar-section group-calendar-section">
              <div className="calendar-header">
                <div className="calendar-month">
                  <button
                    className="month-arrow"
                    onClick={() =>
                      moveMonth(-1)
                    }
                  >
                    ←
                  </button>

                  <h2>{monthName}</h2>

                  <button
                    className="month-arrow"
                    onClick={() =>
                      moveMonth(1)
                    }
                  >
                    →
                  </button>
                </div>

                <button
                  className="today-button"
                  onClick={moveToday}
                >
                  오늘
                </button>
              </div>

              <div className="calendar-legend group-calendar-legend">
                <span>
                  <i className="legend-dot mentoring" />
                  멘토링
                </span>

                <span>
                  <i className="legend-dot study" />
                  스터디
                </span>
              </div>

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
                  {calendarDays.map(
                    (date, index) => (
                      <div
                        className={`calendar-day ${
                          isToday(date)
                            ? "today"
                            : ""
                        }`}
                        key={index}
                      >
                        {date && (
                          <>
                            <span className="day-number">
                              {date.getDate()}
                            </span>

                            <div className="day-events">
                              {groupSchedules
                                .filter(
                                  (schedule) =>
                                    isScheduleOnDate(
                                      schedule,
                                      date
                                    )
                                )
                                .map(
                                  (schedule) => (
                                    <div
                                      className={`calendar-event group ${schedule.type}`}
                                      key={
                                        schedule.id
                                      }
                                      onClick={() =>
                                        schedule.studyId &&
                                        navigate(`/study/${schedule.studyId}`)
                                      }
                                      style={{
                                        cursor: schedule.studyId
                                          ? "pointer"
                                          : "default"
                                      }}
                                      title={
                                        schedule.title
                                      }
                                    >
                                      {
                                        schedule.title
                                      }
                                    </div>
                                  )
                                )}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </section>

      {/* ==================================================
          일정 추가 / 수정 모달
      ================================================== */}

      {showModal && (
        <div
          className="schedule-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="schedule-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="schedule-modal-header">
              <div>
                <span className="modal-label">
                  {activeTab === "personal"
                    ? "MY SCHEDULE"
                    : "GROUP SCHEDULE"}
                </span>

                <h2>
                  {editingSchedule
                    ? "일정 수정"
                    : activeTab === "personal"
                    ? "일정 추가"
                    : "모임 일정 추가"}
                </h2>
              </div>

              <button
                type="button"
                className="schedule-modal-close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form
              className="schedule-form"
              onSubmit={handleSubmit}
            >
              {activeTab === "personal" && (
                <div className="schedule-type-field">
                  <span className="form-field-title">
                    일정 종류
                  </span>

                  <div className="schedule-type-options">
                    <label
                      className={`type-option ${
                        form.type === "general"
                          ? "selected general"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value="general"
                        checked={
                          form.type ===
                          "general"
                        }
                        onChange={handleChange}
                      />

                      <span className="type-option-icon general">
                        ✓
                      </span>

                      <span>
                        <strong>
                          일반 일정
                        </strong>

                        <small>
                          개인적인 일정
                        </small>
                      </span>
                    </label>

                    <label
                      className={`type-option ${
                        form.type ===
                        "certificate"
                          ? "selected certificate"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value="certificate"
                        checked={
                          form.type ===
                          "certificate"
                        }
                        onChange={handleChange}
                      />

                      <span className="type-option-icon certificate">
                        ✓
                      </span>

                      <span>
                        <strong>
                          자격증
                        </strong>

                        <small>
                          시험 및 공부 일정
                        </small>
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === "group" && (
                <div className="schedule-type-field">
                  <span className="form-field-title">
                    모임 종류
                  </span>

                  <div className="schedule-type-options">
                    <label
                      className={`type-option ${
                        form.type === "mentoring"
                          ? "selected mentoring"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value="mentoring"
                        checked={
                          form.type ===
                          "mentoring"
                        }
                        onChange={handleChange}
                      />

                      <span className="type-option-icon mentoring">
                        ✓
                      </span>

                      <span>
                        <strong>
                          멘토링
                        </strong>

                        <small>
                          멘토와 함께하는 일정
                        </small>
                      </span>
                    </label>

                    <label
                      className={`type-option ${
                        form.type === "study"
                          ? "selected study"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value="study"
                        checked={
                          form.type === "study"
                        }
                        onChange={handleChange}
                      />

                      <span className="type-option-icon study">
                        ✓
                      </span>

                      <span>
                        <strong>
                          스터디
                        </strong>

                        <small>
                          함께 공부하는 일정
                        </small>
                      </span>
                    </label>
                  </div>
                </div>
              )}

              <label>
                일정 제목

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder={
                    activeTab === "personal"
                      ? "예: Java 공부"
                      : "예: Spring Boot 스터디"
                  }
                  required
                />
              </label>

              <label>
                내용

                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  placeholder="일정 내용을 입력하세요."
                />
              </label>

              <label>
                시작 시간

                <input
                  type="datetime-local"
                  name="startAt"
                  value={form.startAt}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                종료 시간

                <input
                  type="datetime-local"
                  name="endAt"
                  value={form.endAt}
                  onChange={handleChange}
                  required
                />
              </label>

              <div className="schedule-form-buttons">
                <button
                  type="button"
                  className="schedule-cancel-button"
                  onClick={closeModal}
                >
                  취소
                </button>

                <button
                  type="submit"
                  className="schedule-submit-button"
                >
                  {editingSchedule
                    ? "수정하기"
                    : activeTab === "personal"
                    ? "일정 등록"
                    : "모임 일정 등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          우측 슬라이드 미니 캘린더 패널
      ================================================== */}
      <div className={`slide-calendar-panel ${isCalendarOpen ? "open" : ""}`} style={{
        position: "fixed",
        top: 0,
        right: isCalendarOpen ? "0" : "-100%",
        width: "350px",
        height: "100%",
        background: "#fff",
        transition: "right 0.3s ease-in-out",
        boxShadow: "-4px 0 15px rgba(0,0,0,0.1)",
        zIndex: 9999,
        padding: "20px",
        boxSizing: "border-box",
        overflowY: "auto"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "8px" }}>
          <h3 style={{ margin: 0, fontSize: "16px" }}>📅 미니 캘린더</h3>
          <button
            type="button"
            onClick={() => setIsCalendarOpen(false)}
            style={{ background: "#ff4d4f", color: "#fff", border: "none", width: "24px", height: "24px", borderRadius: "50%", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✕
          </button>
        </div>

        {/* 달력 월 이동 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <button type="button" onClick={() => moveMonth(-1)} style={{ border: "none", background: "#f1f5f9", cursor: "pointer", padding: "4px 8px", borderRadius: "4px" }}>←</button>
          <span style={{ fontWeight: "700", fontSize: "14px" }}>{monthName}</span>
          <button type="button" onClick={() => moveMonth(1)} style={{ border: "none", background: "#f1f5f9", cursor: "pointer", padding: "4px 8px", borderRadius: "4px" }}>→</button>
        </div>

        {/* 요일 헤더 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontSize: "11px", fontWeight: "600", color: "#666", marginBottom: "5px" }}>
          <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
        </div>

        {/* 달력 그리드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
          {calendarDays.map((date, index) => (
            <div key={index} style={{
              minHeight: "45px",
              background: date ? "#f8fafc" : "transparent",
              border: "1px solid #e2e8f0",
              borderRadius: "4px",
              padding: "2px",
              fontSize: "11px"
            }}>
              {date && (
                <>
                  <div style={{ fontWeight: "600", textAlign: "right", color: "#333" }}>{date.getDate()}</div>
                </>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <a href="/calendar" style={{ fontSize: "12px", color: "#4f46e5", textDecoration: "underline" }}>
            전체 캘린더 페이지로 이동하기 →
          </a>
        </div>
      </div>
    </main>
  );
}

export default Calendar;