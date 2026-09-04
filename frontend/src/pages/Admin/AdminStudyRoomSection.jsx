import { useEffect, useState } from "react";

const API_BASE = "/api/admin";

const EMPTY_FORM = {
  name: "",
  location: "",
  description: "",
  minCapacity: 1,
  maxCapacity: 4,
  pricePerHour: "",
  imageUrl: "",
};

function formatPrice(price) {
  return Math.round(Number(price)).toLocaleString("ko-KR") + "원";
}

function AdminStudyRoomSection() {
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState("");

  const [formMode, setFormMode] = useState(null); // null | "create" | "edit"
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadRooms = async () => {
    try {
      setLoadingRooms(true);
      setRoomsError("");

      const response = await fetch(`${API_BASE}/study-rooms`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`스터디룸 목록을 불러오지 못했습니다. (HTTP ${response.status})`);
      }

      setRooms(await response.json());
    } catch (error) {
      console.error("관리자 스터디룸 목록 조회 오류:", error);
      setRoomsError(error.message || "스터디룸 목록을 불러오지 못했습니다.");
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const openCreateForm = () => {
    setFormMode("create");
    setEditingRoomId(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const openEditForm = (room) => {
    setFormMode("edit");
    setEditingRoomId(room.id);
    setForm({
      name: room.name,
      location: room.location,
      description: room.description || "",
      minCapacity: room.minCapacity,
      maxCapacity: room.maxCapacity,
      pricePerHour: room.pricePerHour,
      imageUrl: room.imageUrl || "",
    });
    setFormError("");
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingRoomId(null);
    setFormError("");
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError("");

    const payload = {
      name: form.name.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
      minCapacity: Number(form.minCapacity),
      maxCapacity: Number(form.maxCapacity),
      pricePerHour: Number(form.pricePerHour),
      imageUrl: form.imageUrl.trim(),
    };

    try {
      const url =
        formMode === "edit"
          ? `${API_BASE}/study-rooms/${editingRoomId}`
          : `${API_BASE}/study-rooms`;

      const response = await fetch(url, {
        method: formMode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        // JSON이 아닌 응답
      }

      if (!response.ok) {
        throw new Error((data && data.message) || text || "저장에 실패했습니다.");
      }

      closeForm();
      loadRooms();
    } catch (error) {
      console.error("스터디룸 저장 오류:", error);
      setFormError(error.message || "저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (room) => {
    const isActive = room.status === "ACTIVE";

    if (
      !window.confirm(
        isActive
          ? `"${room.name}"을(를) 운영 중지할까요? (예약/후기 목록에서 사라집니다)`
          : `"${room.name}"을(를) 다시 운영할까요?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        isActive
          ? `${API_BASE}/study-rooms/${room.id}`
          : `${API_BASE}/study-rooms/${room.id}/activate`,
        {
          method: isActive ? "DELETE" : "PUT",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("처리에 실패했습니다.");
      }

      loadRooms();
    } catch (error) {
      console.error("스터디룸 상태 변경 오류:", error);
      alert(error.message || "처리에 실패했습니다.");
    }
  };

  return (
    <section className="admin-section">
      <div className="admin-section-header">
        <h2>스터디룸 목록</h2>
        <button type="button" onClick={openCreateForm}>
          + 스터디룸 등록
        </button>
      </div>

      {formMode && (
        <form className="admin-room-form" onSubmit={handleSubmit}>
          <h3>{formMode === "edit" ? "스터디룸 수정" : "새 스터디룸 등록"}</h3>
          <div className="admin-form-grid">
            <label>
              이름
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                required
              />
            </label>

            <label>
              위치
              <input
                type="text"
                value={form.location}
                onChange={(e) => handleFormChange("location", e.target.value)}
                required
              />
            </label>

            <label>
              최소 인원
              <input
                type="number"
                min="1"
                value={form.minCapacity}
                onChange={(e) => handleFormChange("minCapacity", e.target.value)}
                required
              />
            </label>

            <label>
              최대 인원
              <input
                type="number"
                min="1"
                value={form.maxCapacity}
                onChange={(e) => handleFormChange("maxCapacity", e.target.value)}
                required
              />
            </label>

            <label>
              시간당 가격(원)
              <input
                type="number"
                min="0"
                value={form.pricePerHour}
                onChange={(e) => handleFormChange("pricePerHour", e.target.value)}
                required
              />
            </label>

            <label>
              이미지 URL
              <input
                type="text"
                value={form.imageUrl}
                onChange={(e) => handleFormChange("imageUrl", e.target.value)}
                placeholder="https://..."
              />
            </label>
          </div>

          <label className="admin-form-full">
            설명
            <textarea
              value={form.description}
              onChange={(e) => handleFormChange("description", e.target.value)}
            />
          </label>

          {formError && <p className="admin-form-error">{formError}</p>}

          <div className="admin-form-actions">
            <button type="button" className="ghost" onClick={closeForm}>
              취소
            </button>
            <button type="submit" disabled={submitting}>
              {submitting ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      )}

      {loadingRooms && <p className="admin-state-message">불러오는 중입니다...</p>}
      {!loadingRooms && roomsError && (
        <p className="admin-state-message error">{roomsError}</p>
      )}

      {!loadingRooms && !roomsError && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>위치</th>
                <th>인원</th>
                <th>가격</th>
                <th>평점</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id} className={room.status === "INACTIVE" ? "inactive" : ""}>
                  <td>{room.name}</td>
                  <td>{room.location}</td>
                  <td>{room.minCapacity}~{room.maxCapacity}명</td>
                  <td>{formatPrice(room.pricePerHour)}</td>
                  <td>{room.rating ? Number(room.rating).toFixed(1) : "-"}</td>
                  <td>
                    <span className={`admin-status ${room.status === "ACTIVE" ? "on" : "off"}`}>
                      {room.status === "ACTIVE" ? "운영중" : "중지됨"}
                    </span>
                  </td>
                  <td className="admin-row-actions">
                    <button type="button" onClick={() => openEditForm(room)}>
                      수정
                    </button>
                    <button
                      type="button"
                      className={room.status === "ACTIVE" ? "danger" : ""}
                      onClick={() => handleToggleStatus(room)}
                    >
                      {room.status === "ACTIVE" ? "삭제" : "복구"}
                    </button>
                  </td>
                </tr>
              ))}

              {rooms.length === 0 && (
                <tr>
                  <td colSpan={7} className="admin-state-message">
                    등록된 스터디룸이 없어요.
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

export default AdminStudyRoomSection;
