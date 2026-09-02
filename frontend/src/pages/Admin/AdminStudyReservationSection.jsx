import { useEffect, useState } from "react";

const API_BASE = "/api/admin";

const STATUS_LABEL = {
  PENDING: { label: "결제 대기", className: "pending" },
  PAID: { label: "승인 대기", className: "paid" },
  CONFIRMED: { label: "확정", className: "on" },
  CANCELLED: { label: "취소됨", className: "off" },
};

function formatPrice(price) {
  return Math.round(Number(price)).toLocaleString("ko-KR") + "원";
}

function formatTime(time) {
  return time ? time.slice(0, 5) : "-";
}

function AdminStudyReservationSection() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approvingId, setApprovingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const loadReservations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/reservations`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`예약 목록을 불러오지 못했습니다. (HTTP ${response.status})`);
      }

      setReservations(await response.json());
    } catch (err) {
      console.error("관리자 스터디룸 예약 목록 조회 오류:", err);
      setError(err.message || "예약 목록을 불러오지 못했습니다.");
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const handleApprove = async (reservation) => {
    if (
      !window.confirm(
        `${reservation.memberNickname}님의 "${reservation.studyRoomName}" 예약을 승인할까요?`
      )
    ) {
      return;
    }

    setApprovingId(reservation.id);

    try {
      const response = await fetch(
        `${API_BASE}/reservations/${reservation.id}/approve`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const text = await response.text();
      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        // JSON이 아닌 응답
      }

      if (!response.ok) {
        throw new Error((data && data.message) || text || "승인에 실패했습니다.");
      }

      loadReservations();
    } catch (err) {
      console.error("예약 승인 오류:", err);
      alert(err.message || "승인에 실패했습니다.");
    } finally {
      setApprovingId(null);
    }
  };

  const handleCancel = async (reservation) => {
    const isConfirmed = reservation.status === "CONFIRMED";
    const actionLabel = isConfirmed ? "취소" : "거절";

    if (
      !window.confirm(
        isConfirmed
          ? `${reservation.memberNickname}님의 "${reservation.studyRoomName}" 예약을 취소할까요? 카페 사정으로 인한 취소로 안내 메일이 발송되고, 결제도 함께 취소됩니다.`
          : `${reservation.memberNickname}님의 "${reservation.studyRoomName}" 예약을 거절할까요? (결제도 함께 취소됩니다)`
      )
    ) {
      return;
    }

    setCancellingId(reservation.id);

    try {
      const response = await fetch(
        `${API_BASE}/reservations/${reservation.id}/cancel`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const text = await response.text();
      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        // JSON이 아닌 응답
      }

      if (!response.ok) {
        throw new Error((data && data.message) || text || `${actionLabel}에 실패했습니다.`);
      }

      loadReservations();
    } catch (err) {
      console.error(`예약 ${actionLabel} 오류:`, err);
      alert(err.message || `${actionLabel}에 실패했습니다.`);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <section className="admin-section">
      <div className="admin-section-header">
        <h2>스터디룸 예약 관리</h2>
      </div>

      {loading && <p className="admin-state-message">불러오는 중입니다...</p>}
      {!loading && error && <p className="admin-state-message error">{error}</p>}

      {!loading && !error && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>예약자</th>
                <th>스터디룸</th>
                <th>날짜</th>
                <th>시간</th>
                <th>인원</th>
                <th>결제 금액</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => {
                const statusInfo =
                  STATUS_LABEL[reservation.status] || {
                    label: reservation.status,
                    className: "",
                  };

                return (
                  <tr key={reservation.id}>
                    <td>
                      <div className="admin-cell-stack">
                        <strong>{reservation.memberNickname}</strong>
                        <small>{reservation.memberEmail}</small>
                      </div>
                    </td>
                    <td>
                      <div className="admin-cell-stack">
                        <strong>{reservation.studyRoomName}</strong>
                        <small>{reservation.location}</small>
                      </div>
                    </td>
                    <td>{reservation.reservationDate}</td>
                    <td>
                      {formatTime(reservation.startTime)} ~ {formatTime(reservation.endTime)}
                    </td>
                    <td>{reservation.peopleCount}명</td>
                    <td>{formatPrice(reservation.totalPrice)}</td>
                    <td>
                      <span className={`admin-status ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        {reservation.status === "PAID" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(reservation)}
                              disabled={approvingId === reservation.id || cancellingId === reservation.id}
                            >
                              {approvingId === reservation.id ? "승인 중..." : "승인"}
                            </button>
                            <button
                              type="button"
                              className="danger"
                              onClick={() => handleCancel(reservation)}
                              disabled={approvingId === reservation.id || cancellingId === reservation.id}
                            >
                              {cancellingId === reservation.id ? "거절 중..." : "거절"}
                            </button>
                          </>
                        )}
                        {reservation.status === "CONFIRMED" && (
                          <button
                            type="button"
                            className="danger"
                            onClick={() => handleCancel(reservation)}
                            disabled={cancellingId === reservation.id}
                          >
                            {cancellingId === reservation.id ? "취소 중..." : "취소"}
                          </button>
                        )}
                        {reservation.status !== "PAID" && reservation.status !== "CONFIRMED" && "-"}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {reservations.length === 0 && (
                <tr>
                  <td colSpan={8} className="admin-state-message">
                    예약 내역이 없어요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default AdminStudyReservationSection;
