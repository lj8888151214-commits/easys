import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./MiniCalendar.css";
import "../Calendar/Calendar.css";

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function formatRange(startAt, endAt) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const pad = (n) => String(n).padStart(2, "0");
  const day = `${start.getMonth() + 1}월 ${start.getDate()}일`;
  const startTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
  const endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
  return `${day} ${startTime} ~ ${endTime}`;
}

export function MiniCalendar({
  isCalendarOpen,
  setIsCalendarOpen,
  calendarDate,
  moveMiniMonth,
  roomSchedules,
  isHost,
  hostNickname,
  onCreateSchedule,
  onAddToMyCalendar,
  onDeleteSchedule,
  onDeleteMyCopy,
}) {
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const calMonthName = `${calYear}년 ${calMonth + 1}월`;
  const calFirstDay = new Date(calYear, calMonth, 1).getDay();
  const calLastDate = new Date(calYear, calMonth + 1, 0).getDate();

  const miniCalendarDays = [];
  for (let i = 0; i < calFirstDay; i++) {
    miniCalendarDays.push(null);
  }
  for (let day = 1; day <= calLastDate; day++) {
    miniCalendarDays.push(new Date(calYear, calMonth, day));
  }
  while (miniCalendarDays.length % 7 !== 0) {
    miniCalendarDays.push(null);
  }

  const today = new Date();
  const isToday = (date) =>
    date &&
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const schedules = Array.isArray(roomSchedules) ? roomSchedules : [];

  // 방장 전용: 날짜 선택 + 일정 추가
  const [selectedDate, setSelectedDate] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newForm, setNewForm] = useState({ title: "", content: "", startAt: "", endAt: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 달이 바뀌면 이전에 선택했던 날짜는 초기화한다.
  useEffect(() => {
    setSelectedDate(null);
  }, [calYear, calMonth]);

  const handleSelectDate = (date) => {
    setSelectedDate((prev) =>
      prev && toDateStr(prev) === toDateStr(date) ? null : date
    );
  };

  const openAddModal = () => {
    if (!selectedDate) return;
    const dateStr = toDateStr(selectedDate);
    setNewForm({
      title: "",
      content: "",
      startAt: `${dateStr}T09:00`,
      endAt: `${dateStr}T10:00`,
    });
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitNewSchedule = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // 중복 클릭/중복 제출 방지
    if (!newForm.title.trim()) {
      alert("일정 제목을 입력해주세요.");
      return;
    }
    if (!newForm.startAt || !newForm.endAt) {
      alert("시작/종료 시간을 입력해주세요.");
      return;
    }
    if (new Date(newForm.startAt) > new Date(newForm.endAt)) {
      alert("시작 시간은 종료 시간보다 늦을 수 없습니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onCreateSchedule({
        title: newForm.title.trim(),
        content: newForm.content.trim(),
        startAt: newForm.startAt,
        endAt: newForm.endAt,
      });

      if (success) {
        closeAddModal();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 시청자 전용: 방장 일정 클릭 -> 확인창 -> 내 캘린더에 추가
  const [confirmSchedule, setConfirmSchedule] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // 시청자가 이미 추가한 원본 일정의 id -> 자신의 사본 id 매핑.
  // 이 매핑이 있는 원본을 다시 클릭하면 "추가"가 아니라 "취소" 확인창을 띄운다.
  // (새로고침하면 초기화되지만, 별도 API/스키마 없이 최소 변경으로 구현하기 위함)
  const [copiedMap, setCopiedMap] = useState({});

  const closeConfirm = () => setConfirmSchedule(null);

  const handleConfirmAdd = async () => {
    if (!confirmSchedule || isConfirming) return; // 중복 클릭 방지
    setIsConfirming(true);
    try {
      const created = await onAddToMyCalendar(confirmSchedule);
      if (created) {
        setCopiedMap((prev) => ({ ...prev, [confirmSchedule.id]: created.id }));
        closeConfirm();
      }
    } finally {
      setIsConfirming(false);
    }
  };

  // 일정 취소(삭제) 확인창. kind가 "original"이면 방장의 원본 일정,
  // "copy"면 시청자 자신이 복사해둔 사본을 취소하는 것이다.
  const [cancelTarget, setCancelTarget] = useState(null); // { schedule, kind }
  const [isCancelling, setIsCancelling] = useState(false);

  const closeCancel = () => setCancelTarget(null);

  const handleConfirmCancel = async () => {
    if (!cancelTarget || isCancelling) return; // 중복 클릭 방지
    setIsCancelling(true);
    try {
      let success = false;
      if (cancelTarget.kind === "original") {
        success = await onDeleteSchedule(cancelTarget.schedule);
      } else {
        const copyId = copiedMap[cancelTarget.schedule.id];
        success = await onDeleteMyCopy(copyId);
        if (success) {
          setCopiedMap((prev) => {
            const next = { ...prev };
            delete next[cancelTarget.schedule.id];
            return next;
          });
        }
      }
      if (success) {
        closeCancel();
      }
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div
      className={`mini-calendar-panel ${isCalendarOpen ? "open" : ""}`}
    >
      <div className="mini-cal-header">
        <h3>📅 모임 미니 캘린더</h3>
        <button
          type="button"
          className="mini-cal-close-button"
          onClick={() => setIsCalendarOpen(false)}
        >
          ✕
        </button>
      </div>

      <div className="mini-cal-month-nav">
        <button type="button" onClick={() => moveMiniMonth(-1)}>←</button>
        <span>{calMonthName}</span>
        <button type="button" onClick={() => moveMiniMonth(1)}>→</button>
      </div>

      <div className="mini-cal-weekdays">
        <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
      </div>

      <div className="mini-cal-grid">
        {miniCalendarDays.map((date, index) => {
          const dateStr = date ? toDateStr(date) : "";
          const matchedSchedules = date
            ? schedules.filter((s) => s.startAt && s.startAt.startsWith(dateStr))
            : [];
          const isSelected = isHost && selectedDate && date && toDateStr(selectedDate) === dateStr;

          return (
            <div
              key={index}
              className={[
                "mini-cal-day",
                !date ? "empty" : "",
                isToday(date) ? "today" : "",
                matchedSchedules.length > 0 ? "has-schedule" : "",
                isSelected ? "selected" : "",
                isHost && date ? "clickable" : "",
              ].filter(Boolean).join(" ")}
              onClick={isHost && date ? () => handleSelectDate(date) : undefined}
            >
              {date && (
                <>
                  <span className="mini-cal-day-number">{date.getDate()}</span>
                  <div className="mini-cal-day-events">
                    {matchedSchedules.map((sch) => {
                      const alreadyCopied = Boolean(copiedMap[sch.id]);
                      return (
                        <div
                          key={sch.id}
                          className="mini-cal-event clickable"
                          title={
                            isHost
                              ? `${sch.title} (클릭해서 취소)`
                              : alreadyCopied
                              ? `${sch.title} (이미 추가함, 클릭해서 취소)`
                              : sch.title
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isHost) {
                              setCancelTarget({ schedule: sch, kind: "original" });
                            } else if (alreadyCopied) {
                              setCancelTarget({ schedule: sch, kind: "copy" });
                            } else {
                              setConfirmSchedule(sch);
                            }
                          }}
                        >
                          {alreadyCopied && !isHost ? "✓ " : ""}
                          <span className="rec-badge">REC</span>
                          {sch.title}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {isHost && selectedDate && (
        <div className="mini-cal-selected-bar">
          <span>{selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 선택됨</span>
          <button type="button" className="mini-cal-add-button" onClick={openAddModal}>
            + 일정 추가
          </button>
        </div>
      )}

      <div className="mini-cal-footer">
        <a href="/calendar" target="_blank" rel="noopener noreferrer">
          전체 캘린더 페이지로 이동하기 →
        </a>
      </div>

      {isHost && isAddModalOpen && createPortal(
        <div className="schedule-modal-overlay mini-cal-modal-overlay" onClick={closeAddModal}>
          <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="schedule-modal-header">
              <div>
                <span className="modal-label">STREAM SCHEDULE</span>
                <h2>일정 추가</h2>
              </div>
              <button type="button" className="schedule-modal-close" onClick={closeAddModal}>
                ×
              </button>
            </div>

            <form className="schedule-form" onSubmit={submitNewSchedule}>
              <label>
                일정 제목
                <input
                  type="text"
                  name="title"
                  value={newForm.title}
                  onChange={handleFormChange}
                  placeholder="예: 자바수업"
                  required
                />
              </label>

              <label>
                내용
                <textarea
                  name="content"
                  value={newForm.content}
                  onChange={handleFormChange}
                  placeholder="일정 내용을 입력하세요."
                />
              </label>

              <label>
                시작 시간
                <input
                  type="datetime-local"
                  name="startAt"
                  value={newForm.startAt}
                  onChange={handleFormChange}
                  required
                />
              </label>

              <label>
                종료 시간
                <input
                  type="datetime-local"
                  name="endAt"
                  value={newForm.endAt}
                  onChange={handleFormChange}
                  required
                />
              </label>

              <div className="schedule-form-buttons">
                <button type="button" className="schedule-cancel-button" onClick={closeAddModal} disabled={isSubmitting}>
                  취소
                </button>
                <button type="submit" className="schedule-submit-button" disabled={isSubmitting}>
                  {isSubmitting ? "등록 중..." : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {!isHost && confirmSchedule && createPortal(
        <div className="schedule-modal-overlay mini-cal-modal-overlay" onClick={closeConfirm}>
          <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="schedule-modal-header">
              <div>
                <span className="modal-label">ADD TO MY CALENDAR</span>
                <h2>캘린더에 추가하시겠습니까?</h2>
              </div>
              <button type="button" className="schedule-modal-close" onClick={closeConfirm}>
                ×
              </button>
            </div>

            <div className="mini-cal-confirm-body">
              <strong>
                <span className="rec-badge">REC</span>
                {hostNickname || "스트리머"}님 {confirmSchedule.title}
              </strong>
              <p>{formatRange(confirmSchedule.startAt, confirmSchedule.endAt)}</p>
            </div>

            <div className="schedule-form-buttons">
              <button type="button" className="schedule-cancel-button" onClick={closeConfirm} disabled={isConfirming}>
                취소
              </button>
              <button type="button" className="schedule-submit-button" onClick={handleConfirmAdd} disabled={isConfirming}>
                {isConfirming ? "추가 중..." : "추가"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {cancelTarget && createPortal(
        <div className="schedule-modal-overlay mini-cal-modal-overlay" onClick={closeCancel}>
          <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="schedule-modal-header">
              <div>
                <span className="modal-label">CANCEL SCHEDULE</span>
                <h2>이 일정을 취소하시겠습니까?</h2>
              </div>
              <button type="button" className="schedule-modal-close" onClick={closeCancel}>
                ×
              </button>
            </div>

            <div className="mini-cal-confirm-body">
              <strong>
                <span className="rec-badge">REC</span>
                {cancelTarget.kind === "copy"
                  ? `${hostNickname || "스트리머"}님 ${cancelTarget.schedule.title}`
                  : cancelTarget.schedule.title}
              </strong>
              <p>{formatRange(cancelTarget.schedule.startAt, cancelTarget.schedule.endAt)}</p>
              {cancelTarget.kind === "original" && (
                <p>이 방을 보고 있는 다른 사람들의 화면에서도 함께 사라집니다.</p>
              )}
            </div>

            <div className="schedule-form-buttons">
              <button type="button" className="schedule-cancel-button" onClick={closeCancel} disabled={isCancelling}>
                닫기
              </button>
              <button type="button" className="schedule-submit-button" onClick={handleConfirmCancel} disabled={isCancelling}>
                {isCancelling ? "취소 중..." : "일정 취소"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
