import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams
} from "react-router-dom";

import "./StudyEdit.css";


function StudyEdit() {

  const navigate = useNavigate();

  const { id } = useParams();


  // =====================================================
  // 수정할 스터디 정보
  // =====================================================

  const [form, setForm] = useState({
    title: "",
    category: "",
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