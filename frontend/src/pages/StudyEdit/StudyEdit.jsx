import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams
} from "react-router-dom";

import "./StudyEdit.css";

// 스터디 시간은 1시간 단위로만 선택 가능 (00:00 ~ 23:00)
const HOUR_OPTIONS = Array.from(
  { length: 24 },
  (_, hour) => `${String(hour).padStart(2, "0")}:00`
);


function StudyEdit() {

  const navigate = useNavigate();

  const { id } = useParams();


  // =====================================================
  // 수정할 스터디 정보
  // =====================================================

  const [form, setForm] = useState({
    title: "",
    category: "",
    topic: "",
    studyDate: "",
    startTime: "",
    endTime: "",
    content: "",
    maxMembers: 2
  });


  // =====================================================
  // 상태
  // =====================================================

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");


  // =====================================================
  // 기존 스터디 정보 조회
  // =====================================================

  useEffect(() => {

    if (!id) {

      setError(
        "스터디 번호가 없습니다."
      );

      setLoading(false);

      return;
    }


    loadStudy();

  }, [id]);


  // =====================================================
  // 스터디 조회
  // =====================================================

  const loadStudy = async () => {

    try {

      setLoading(true);

      setError("");


      console.log(
        "수정할 스터디 조회:",
        `/api/study/${id}`
      );


      const response =
        await fetch(
          `/api/study/${id}`,
          {
            method: "GET",
            credentials: "include"
          }
        );


      const text =
        await response.text();


      console.log(
        "스터디 조회 상태:",
        response.status
      );


      console.log(
        "스터디 조회 응답:",
        text
      );


      if (
        response.status === 401 ||
        response.status === 403
      ) {

        alert(
          "로그인이 필요한 기능입니다."
        );

        navigate("/login");

        return;

      }


      if (!response.ok) {

        throw new Error(
          "스터디 정보를 불러오지 못했습니다."
        );

      }


      let data;


      try {

        data =
          JSON.parse(text);

      }

      catch (jsonError) {

        console.error(
          "JSON 변환 실패:",
          jsonError
        );

        throw new Error(
          "서버에서 올바른 데이터를 받지 못했습니다."
        );

      }


      console.log(
        "수정할 스터디:",
        data
      );


      // =================================================
      // 기존 데이터 → 수정 폼
      // =================================================

      setForm({

        title:
          data.title || "",

        category:
          data.category || "",

        topic:
          data.topic || "",

        studyDate:
          data.studyDate || "",

        startTime:
          data.startTime
            ? data.startTime.slice(0, 5)
            : "",

        endTime:
          data.endTime
            ? data.endTime.slice(0, 5)
            : "",

        content:
          data.content || "",

        maxMembers:
          Number(
            data.maxMembers || 2
          )

      });

    }

    catch (error) {

      console.error(
        "스터디 조회 오류:",
        error
      );


      setError(
        error.message ||
        "스터디 정보를 불러오지 못했습니다."
      );

    }

    finally {

      setLoading(false);

    }

  };


  // =====================================================
  // 입력값 변경
  // =====================================================

  const handleChange = (e) => {

    const {
      name,
      value
    } = e.target;


    setForm((prev) => ({

      ...prev,

      [name]:
        name === "maxMembers"
          ? Number(value)
          : value

    }));


    setError("");

  };


  // =====================================================
  // 수정 저장
  // =====================================================

  const handleSubmit = async (e) => {

    e.preventDefault();


    setError("");


    // ===================================================
    // 값 정리
    // ===================================================

    const title =
      form.title.trim();

    const category =
      form.category.trim();

    const topic =
      form.topic.trim();

    const studyDate =
      form.studyDate;

    const startTime =
      form.startTime;

    const endTime =
      form.endTime;

    const content =
      form.content.trim();

    const maxMembers =
      Number(form.maxMembers);


    // ===================================================
    // 제목 검사
    // ===================================================

    if (!title) {

      setError(
        "스터디 제목을 입력해주세요."
      );

      return;

    }


    if (title.length > 100) {

      setError(
        "스터디 제목은 100자 이하로 입력해주세요."
      );

      return;

    }


    // ===================================================
    // 분야 검사
    // ===================================================

    if (!category) {

      setError(
        "스터디 분야를 입력해주세요."
      );

      return;

    }


    if (category.length > 30) {

      setError(
        "스터디 분야는 30자 이하로 입력해주세요."
      );

      return;

    }


    // ===================================================
    // 주제 검사
    // ===================================================

    if (!topic) {

      setError(
        "스터디 주제를 입력해주세요."
      );

      return;

    }

    if (topic.length > 150) {

      setError(
        "스터디 주제는 150자 이하로 입력해주세요."
      );

      return;

    }


    // ===================================================
    // 일정 검사
    // ===================================================

    if (!studyDate || !startTime || !endTime) {

      setError(
        "스터디 날짜와 시작/종료 시간을 입력해주세요."
      );

      return;

    }

    if (startTime >= endTime) {

      setError(
        "시작 시간은 종료 시간보다 빨라야 합니다."
      );

      return;

    }

    const scheduleMinutes =
      (Number(endTime.slice(0, 2)) * 60 + Number(endTime.slice(3, 5))) -
      (Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(3, 5)));

    if (scheduleMinutes % 60 !== 0) {

      setError(
        "스터디 시간은 1시간 단위로 설정해주세요. (예: 14:00 ~ 16:00)"
      );

      return;

    }


    // ===================================================
    // 내용 검사
    // ===================================================

    if (!content) {

      setError(
        "스터디 소개를 입력해주세요."
      );

      return;

    }


    // ===================================================
    // 모집 인원 검사
    // ===================================================

    if (
      !Number.isInteger(maxMembers) ||
      maxMembers < 2
    ) {

      setError(
        "최대 모집 인원은 2명 이상이어야 합니다."
      );

      return;

    }


    if (maxMembers > 100) {

      setError(
        "최대 모집 인원은 100명 이하로 입력해주세요."
      );

      return;

    }


    // ===================================================
    // 서버 요청
    // ===================================================

    try {

      setSaving(true);


      console.log(
        "스터디 수정 요청:",
        {
          title,
          category,
          topic,
          studyDate,
          startTime,
          endTime,
          content,
          maxMembers
        }
      );


      const response =
        await fetch(
          `/api/study/${id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json"
            },

            credentials: "include",

            body: JSON.stringify({

              title,

              category,

              topic,

              studyDate,

              startTime: `${startTime}:00`,

              endTime: `${endTime}:00`,

              content,

              maxMembers

            })
          }
        );


      const text =
        await response.text();


      console.log(
        "스터디 수정 상태:",
        response.status
      );


      console.log(
        "스터디 수정 응답:",
        text
      );


      // =================================================
      // 권한 없음
      // =================================================

      if (
        response.status === 401 ||
        response.status === 403
      ) {

        alert(
          "스터디를 수정할 권한이 없습니다."
        );

        return;

      }


      // =================================================
      // 서버 오류
      // =================================================

      if (!response.ok) {

        let message =
          "스터디 수정에 실패했습니다.";


        try {

          const data =
            text
              ? JSON.parse(text)
              : null;


          if (data?.message) {

            message =
              data.message;

          }

          else if (data?.error) {

            message =
              data.error;

          }

        }

        catch {

          if (text) {

            message = text;

          }

        }


        throw new Error(
          message
        );

      }


      // =================================================
      // 성공
      // =================================================

      console.log(
        "스터디 수정 성공"
      );


      alert(
        "스터디가 수정되었습니다."
      );


      // 상세 페이지로 이동
      navigate(
        `/study/${id}`
      );

    }

    catch (error) {

      console.error(
        "스터디 수정 오류:",
        error
      );


      setError(
        error.message ||
        "스터디 수정에 실패했습니다."
      );

    }

    finally {

      setSaving(false);

    }

  };


  // =====================================================
  // 취소
  // =====================================================

  const handleCancel = () => {

    navigate(
      `/study/${id}`
    );

  };


  // =====================================================
  // 로딩
  // =====================================================

  if (loading) {

    return (

      <main className="study-edit-page">

        <section className="study-edit-container">

          <div className="study-edit-loading">

            <div className="study-edit-spinner" />

            <p>
              스터디 정보를 불러오는 중입니다...
            </p>

          </div>

        </section>

      </main>

    );

  }


  // =====================================================
  // 조회 오류
  // =====================================================

  if (error && !form.title) {

    return (

      <main className="study-edit-page">

        <section className="study-edit-container">

          <div className="study-edit-error">

            <div>
              ⚠️
            </div>

            <h2>
              스터디 정보를 불러오지 못했습니다.
            </h2>

            <p>
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/study/${id}`
                )
              }
            >
              상세 페이지로 돌아가기
            </button>

          </div>

        </section>

      </main>

    );

  }


  // =====================================================
  // 화면
  // =====================================================

  return (

    <main className="study-edit-page">

      <section className="study-edit-container">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="study-edit-header">

          <span>
            EASYS STUDY
          </span>

          <h1>
            스터디 수정
          </h1>

          <p>
            스터디 정보를 수정할 수 있습니다.
          </p>

        </div>


        {/* =================================================
            FORM
        ================================================= */}

        <form
          className="study-edit-form"
          onSubmit={handleSubmit}
        >


          {/* =================================================
              제목
          ================================================= */}

          <div className="study-edit-field">

            <label htmlFor="title">
              스터디 제목
            </label>

            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              maxLength={100}
              disabled={saving}
            />

            <span className="study-edit-count">
              {form.title.length} / 100
            </span>

          </div>


          {/* =================================================
              분야
          ================================================= */}

          <div className="study-edit-field">

            <label htmlFor="category">
              스터디 분야
            </label>

            <input
              id="category"
              name="category"
              type="text"
              value={form.category}
              onChange={handleChange}
              maxLength={30}
              placeholder="예: Java, Python, Spring Boot"
              disabled={saving}
            />

            <small>
              분야는 원하는 내용을 자유롭게 입력할 수 있습니다.
            </small>

          </div>


          {/* =================================================
              주제
          ================================================= */}

          <div className="study-edit-field">

            <label htmlFor="topic">
              스터디 주제
            </label>

            <input
              id="topic"
              name="topic"
              type="text"
              value={form.topic}
              onChange={handleChange}
              maxLength={150}
              placeholder="예: Spring Boot와 JPA 기초"
              disabled={saving}
            />

          </div>


          {/* =================================================
              일정
          ================================================= */}

          <div className="study-edit-field">

            <label htmlFor="studyDate">
              스터디 날짜
            </label>

            <input
              id="studyDate"
              name="studyDate"
              type="date"
              value={form.studyDate}
              onChange={handleChange}
              disabled={saving}
            />

          </div>

          <div className="study-edit-field study-edit-time-field">

            <label htmlFor="startTime">
              시작 시간
            </label>

            <select
              id="startTime"
              name="startTime"
              value={form.startTime}
              onChange={handleChange}
              disabled={saving}
            >
              <option value="" disabled>
                선택
              </option>

              {HOUR_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>

            <label htmlFor="endTime">
              종료 시간
            </label>

            <select
              id="endTime"
              name="endTime"
              value={form.endTime}
              onChange={handleChange}
              disabled={saving}
            >
              <option value="" disabled>
                선택
              </option>

              {HOUR_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>

            <small>
              이 일정 그대로 스터디룸 예약 시간으로 사용되며, 1시간 단위로만 설정할 수 있습니다.
            </small>

          </div>


          {/* =================================================
              모집 인원
          ================================================= */}

          <div className="study-edit-field">

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
              disabled={saving}
            />

            <small>
              현재 참여 인원보다 적은 숫자로 변경할 수 없습니다.
            </small>

          </div>


          {/* =================================================
              내용
          ================================================= */}

          <div className="study-edit-field">

            <label htmlFor="content">
              스터디 소개
            </label>

            <textarea
              id="content"
              name="content"
              value={form.content}
              onChange={handleChange}
              rows="10"
              disabled={saving}
            />

          </div>


          {/* =================================================
              오류
          ================================================= */}

          {error && (

            <div className="study-edit-error-message">

              {error}

            </div>

          )}


          {/* =================================================
              BUTTON
          ================================================= */}

          <div className="study-edit-actions">

            <button
              type="button"
              className="study-edit-cancel"
              onClick={handleCancel}
              disabled={saving}
            >
              취소
            </button>


            <button
              type="submit"
              className="study-edit-submit"
              disabled={saving}
            >

              {saving
                ? "저장 중..."
                : "수정 완료"
              }

            </button>

          </div>

        </form>

      </section>

    </main>

  );

}


export default StudyEdit;