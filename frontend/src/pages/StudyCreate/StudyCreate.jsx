import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudyCreate.css";

function StudyCreate() {
  const navigate = useNavigate();

  // =====================================================
  // 입력값
  // =====================================================

  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "",
    maxMembers: 2
  });

  // =====================================================
  // 상태
  // =====================================================

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // 입력값 변경
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "maxMembers" ? Number(value) : value
    }));

    setError("");
  };

  // =====================================================
  // 스터디 생성
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // ---------------------------------------------------
    // 입력값 정리
    // ---------------------------------------------------

    const title = form.title.trim();
    const content = form.content.trim();
    const category = form.category.trim();
    const maxMembers = Number(form.maxMembers);

    // ---------------------------------------------------
    // 제목 검사
    // ---------------------------------------------------

    if (!title) {
      setError("스터디 제목을 입력해주세요.");
      return;
    }

    if (title.length > 100) {
      setError("스터디 제목은 100자 이하로 입력해주세요.");
      return;
    }

    // ---------------------------------------------------
    // 분야 검사
    // ---------------------------------------------------

    if (!category) {
      setError("스터디 분야를 입력해주세요.");
      return;
    }

    if (category.length > 30) {
      setError("스터디 분야는 30자 이하로 입력해주세요.");
      return;
    }

    // ---------------------------------------------------
    // 내용 검사
    // ---------------------------------------------------

    if (!content) {
      setError("스터디 소개를 입력해주세요.");
      return;
    }

    // ---------------------------------------------------
    // 모집 인원 검사
    // ---------------------------------------------------

    if (!Number.isInteger(maxMembers) || maxMembers < 2) {
      setError("최대 모집 인원은 2명 이상이어야 합니다.");
      return;
    }

    if (maxMembers > 100) {
      setError("최대 모집 인원은 100명 이하로 입력해주세요.");
      return;
    }

    // ===================================================
    // 서버 요청
    // ===================================================

    try {
      setLoading(true);

      console.log("스터디 생성 요청:", {
        title,
        content,
        category,
        maxMembers
      });

      const response = await fetch("/api/study", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          title,
          content,
          category,
          maxMembers
        })
      });

      // -------------------------------------------------
      // 응답 확인
      // -------------------------------------------------

      const text = await response.text();

      console.log("스터디 생성 응답 상태:", response.status);
      console.log("스터디 생성 응답:", text);

      let data = null;

      try {
        if (text) {
          data = JSON.parse(text);
        }
      } catch (jsonError) {
        console.log("JSON 응답이 아닙니다.", jsonError);
      }

      // -------------------------------------------------
      // 로그인 필요
      // -------------------------------------------------

      if (response.status === 401 || response.status === 403) {
        alert("로그인이 필요한 기능입니다.");
        navigate("/login");
        return;
      }

      // -------------------------------------------------
      // 서버 오류
      // -------------------------------------------------

      if (!response.ok) {
        let message = "스터디 생성에 실패했습니다.";

        if (data?.message) {
          message = data.message;
        } else if (data?.error) {
          message = data.error;
        } else if (text) {
          message = text;
        }

        throw new Error(message);
      }

      // =================================================
      // 생성 성공
      // =================================================

      console.log("스터디 생성 성공:", data);

      alert("스터디가 성공적으로 생성되었습니다!");

      // -------------------------------------------------
      // 생성된 스터디 ID가 있으면
      // 바로 상세 페이지로 이동
      // -------------------------------------------------

      if (data?.id) {
        navigate(`/study/${data.id}`);
        return;
      }

      // -------------------------------------------------
      // ID가 없는 경우
      // 스터디 목록으로 이동
      // -------------------------------------------------

      navigate("/study");

    } catch (error) {
      console.error("스터디 생성 오류:", error);

      setError(
        error.message ||
        "스터디 생성에 실패했습니다."
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // 취소
  // =====================================================

  const handleCancel = () => {
    navigate("/study");
  };

  // =====================================================
  // 화면
  // =====================================================

  return (
    <main className="study-create-page">

      {/* =================================================
          BACKGROUND DROPS
          커뮤니티보다 적게 배치
      ================================================= */}

      <div className="study-create-drops" aria-hidden="true">
        <span className="study-create-drop study-drop-1"></span>
        <span className="study-create-drop study-drop-2"></span>
        <span className="study-create-drop study-drop-3"></span>
        <span className="study-create-drop study-drop-4"></span>
      </div>

      {/* =================================================
          CONTAINER
      ================================================= */}

      <section className="study-create-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="study-create-header">

          <span>
            EASYS STUDY
          </span>

          <h1>
            새로운 스터디 만들기
          </h1>

          <p>
            함께 공부할 사람들을 모집해보세요.
          </p>

        </div>

        {/* =================================================
            FORM
        ================================================= */}

        <form
          className="study-create-form"
          onSubmit={handleSubmit}
        >

          {/* =================================================
              스터디 제목
          ================================================= */}

          <div className="form-field">

            <label htmlFor="title">
              스터디 제목
            </label>

            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="예: Java Spring 같이 공부해요"
              maxLength={100}
              disabled={loading}
            />

            <span className="field-count">
              {form.title.length}
              {" / "}
              100
            </span>

          </div>

          {/* =================================================
              스터디 분야
          ================================================= */}

          <div className="form-field">

            <label htmlFor="category">
              스터디 분야
            </label>

            <input
              id="category"
              name="category"
              type="text"
              value={form.category}
              onChange={handleChange}
              placeholder="예: Java, Spring Boot, JPA, 백엔드"
              maxLength={30}
              disabled={loading}
            />

            <small>
              공부할 분야를 자유롭게 입력해주세요.
            </small>

          </div>

          {/* =================================================
              모집 인원
          ================================================= */}

          <div className="form-field">

            <label htmlFor="maxMembers">
              최대 모집 인원
            </label>

            <input
              id="maxMembers"
              name="maxMembers"
              type="number"
              min="2"
              max="100"
              value={form.maxMembers}
              onChange={handleChange}
              disabled={loading}
            />

            <small>
              방장을 포함한 전체 인원입니다.
            </small>

          </div>

          {/* =================================================
              스터디 소개
          ================================================= */}

          <div className="form-field">

            <label htmlFor="content">
              스터디 소개
            </label>

            <textarea
              id="content"
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder={
                "스터디 목적, 진행 방식, 일정 등을 자유롭게 작성해주세요."
              }
              rows="10"
              disabled={loading}
            />

          </div>

          {/* =================================================
              오류
          ================================================= */}

          {error && (
            <div className="study-create-error">
              {error}
            </div>
          )}

          {/* =================================================
              버튼
          ================================================= */}

          <div className="study-create-actions">

            <button
              type="button"
              className="study-cancel-button"
              onClick={handleCancel}
              disabled={loading}
            >
              취소
            </button>

            <button
              type="submit"
              className="study-submit-button"
              disabled={loading}
            >
              {loading
                ? "생성 중..."
                : "스터디 만들기"
              }
            </button>

          </div>

        </form>

      </section>

    </main>
  );
}

export default StudyCreate;