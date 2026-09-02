import React from "react";

export function MiniCalendar({ isCalendarOpen, setIsCalendarOpen, calendarDate, moveMiniMonth, groupSchedules }) {
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

  return (
   <div className={`slide-calendar-panel ${isCalendarOpen ? "open" : ""}`} style={{
         position: "absolute",
         top: 0,
         right: 0,
         width: "360px",
         height: "500px",
         background: "#fff",
         transform: isCalendarOpen ? "translateX(0)" : "translateX(100%)",
         transition: "transform 0.3s ease-in-out",
         boxShadow: "-4px 0 15px rgba(0,0,0,0.1)",
         zIndex: 20,
         padding: "15px",
         boxSizing: "border-box",
         overflowY: "auto",
         display: "block",
         visibility: isCalendarOpen ? "visible" : "hidden"
       }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #eee", paddingBottom: "8px" }}>
        <h3 style={{ margin: 0, fontSize: "16px" }}>📅 모임 미니 캘린더</h3>
        <button
          type="button"
          onClick={() => setIsCalendarOpen(false)}
          style={{ background: "#ff4d4f", color: "#fff", border: "none", width: "24px", height: "24px", borderRadius: "50%", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <button type="button" onClick={() => moveMiniMonth(-1)} style={{ border: "none", background: "#f1f5f9", cursor: "pointer", padding: "4px 8px", borderRadius: "4px" }}>←</button>
        <span style={{ fontWeight: "700", fontSize: "14px" }}>{calMonthName}</span>
        <button type="button" onClick={() => moveMiniMonth(1)} style={{ border: "none", background: "#f1f5f9", cursor: "pointer", padding: "4px 8px", borderRadius: "4px" }}>→</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontSize: "11px", fontWeight: "600", color: "#666", marginBottom: "5px" }}>
        <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {miniCalendarDays.map((date, index) => {
          const dateStr = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : "";
          const matchedSchedules = date ? groupSchedules.filter(s => s.startAt && s.startAt.startsWith(dateStr)) : [];

          return (
            <div key={index} style={{
              minHeight: "55px",
              background: date ? "#f8fafc" : "transparent",
              border: "1px solid #e2e8f0",
              borderRadius: "4px",
              padding: "2px",
              fontSize: "10px",
              overflow: "hidden"
            }}>
              {date && (
                <>
                  <div style={{ fontWeight: "600", textAlign: "right", color: "#333", marginBottom: "2px" }}>{date.getDate()}</div>
                  {matchedSchedules.map((sch) => (
                    <div key={sch.id || sch.title} title={sch.title} style={{ background: "#4f46e5", color: "#fff", borderRadius: "2px", padding: "1px 2px", marginBottom: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {sch.title}
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <a href="/calendar" target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#4f46e5", textDecoration: "underline" }}>
          전체 캘린더 페이지로 이동하기 →
        </a>
      </div>
    </div>
  );
}