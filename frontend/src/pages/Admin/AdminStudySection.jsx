import { useEffect, useState } from "react";

const API_BASE = "/api";

function formatDate(dateTime) {
  return dateTime.slice(0, 10).replace(/-/g, ".");
}

function AdminStudySection() {
  const [studies, setStudies] = useState([]);
  const [loadingStudies, setLoadingStudies] = useState(true);
  const [studiesError, setStudiesError] = useState("");

  const loadStudies = async () => {
    try {
      setLoadingStudies(true);
      setStudiesError("");

      const response = await fetch(`${API_BASE}/study`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`스터디 목록을 불러오지 못했습니다. (HTTP ${response.status})`);
      }

      setStudies(await response.json());
    } catch (error) {
      console.error("관리자 스터디 목록 조회 오류:", error);
      setStudiesError(error.message || "스터디 목록을 불러오지 못했습니다.");
      setStudies([]);
    } finally {
      setLoadingStudies(false);
    }
  };

  useEffect(() => {
    loadStudies();
  }, []);

  const handleDelete = async (study) => {
    if (
      !window.confirm(
        `"${study.title}" 스터디를 강제 삭제할까요? (참여 신청 정보도 함께 삭제됩니다)`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/study/${study.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "삭제에 실패했습니다.");
      }

      loadStudies();
    } catch (error) {
      console.error("스터디 삭제 오류:", error);
      alert(error.message || "삭제에 실패했습니다.");
    }
  };

  return (
    <section className="admin-section">
      <div className="admin-section-header">
        <h2>스터디(모임) 목록</h2>
      </div>

      {loadingStudies && <p className="admin-state-message">불러오는 중입니다...</p>}
      {!loadingStudies && studiesError && (
        <p className="admin-state-message error">{studiesError}</p>
      )}

      {!loadingStudies && !studiesError && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>제목</th>
                <th>방장</th>
                <th>분야</th>
                <th>인원</th>
                <th>상태</th>
                <th>생성일</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {studies.map((study) => (
                <tr key={study.id}>
                  <td className="admin-cell-title">{study.title}</td>
                  <td>{study.nickname}</td>
                  <td>{study.category}</td>
                  <td>{study.currentMembers}/{study.maxMembers}명</td>
                  <td>
                    <span
                      className={`admin-status ${
                        study.status === "RECRUITING" ? "on" : "off"
                      }`}
                    >
                      {study.status === "RECRUITING" ? "모집중" : "모집완료"}
                    </span>
                  </td>
                  <td>{formatDate(study.createdAt)}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="danger" onClick={() => handleDelete(study)}>
                        강제 삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {studies.length === 0 && (
                <tr>
                  <td colSpan={7} className="admin-state-message">
                    등록된 스터디가 없어요.
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

export default AdminStudySection;
