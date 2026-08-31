import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./PasswordChange.css";


function PasswordChange() {

  const navigate = useNavigate();


  // =====================================================
  // 입력값
  // =====================================================

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");


  // =====================================================
  // 메시지
  // =====================================================

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");


  // =====================================================
  // 로딩
  // =====================================================

  const [loading, setLoading] = useState(false);


  // =====================================================
  // 비밀번호 변경
  // =====================================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    setMessage("");
    setError("");


    // -------------------------------------------------
    // 빈칸 검사
    // -------------------------------------------------

    if (
      !currentPassword.trim() ||
      !newPassword.trim() ||
      !newPasswordConfirm.trim()
    ) {

      setError(
        "모든 비밀번호를 입력해주세요."
      );

      return;
    }


    // -------------------------------------------------
    // 새 비밀번호 일치 검사
    // -------------------------------------------------

    if (
      newPassword !== newPasswordConfirm
    ) {

      setError(
        "새 비밀번호가 일치하지 않습니다."
      );

      return;
    }


    // -------------------------------------------------
    // 비밀번호 형식 검사
    //
    // 영문
    // 숫자
    // 특수문자
    // 8자 이상
    // -------------------------------------------------

    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[~!@#$%^&*()_+`=\-\[\]{}|;':",./<>?]).{8,}$/;


    if (
      !passwordRegex.test(newPassword)
    ) {

      setError(
        "비밀번호는 영어 + 숫자 + 특수문자를 포함하여 8자 이상이어야 합니다."
      );

      return;
    }


    try {

      setLoading(true);


      // =================================================
      // 비밀번호 변경 API
      //
      // Vite proxy
      //
      // /api/member/me/password
      //       ↓
      // localhost:8080/member/me/password
      // =================================================

      const response = await fetch(
        "/api/member/me/password",
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            currentPassword,
            newPassword,
            newPasswordConfirm,
          }),
        }
      );


      // =================================================
      // 서버 응답
      // =================================================

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";


      let data;


      if (
        contentType.includes(
          "application/json"
        )
      ) {

        data =
          await response.json();

      } else {

        const text =
          await response.text();

        data = {
          message: text,
        };
      }


      // =================================================
      // 실패
      // =================================================

      if (!response.ok) {

        throw new Error(
          data.message ||
          "비밀번호 변경에 실패했습니다."
        );
      }


      // =================================================
      // 성공
      // =================================================

      setMessage(
        "비밀번호가 성공적으로 변경되었습니다."
      );


      // 입력값 초기화

      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");


    } catch (err) {

      console.error(
        "비밀번호 변경 오류:",
        err
      );


      setError(
        err.message ||
        "비밀번호 변경 중 오류가 발생했습니다."
      );


    } finally {

      setLoading(false);

    }
  };


  // =====================================================
  // 화면
  // =====================================================

  return (

    <main className="password-change-page">

      <section className="password-change-card">


        {/* =================================================
            제목
        ================================================= */}

        <div className="password-change-header">

          <span>
            ACCOUNT SECURITY
          </span>

          <h1>
            비밀번호 변경
          </h1>

          <p>
            안전한 비밀번호로 변경해주세요.
          </p>

        </div>


        {/* =================================================
            비밀번호 변경 Form
        ================================================= */}

        <form
          className="password-change-form"
          onSubmit={handleSubmit}
        >


          {/* =================================================
              현재 비밀번호
          ================================================= */}

          <div className="form-group">

            <label htmlFor="currentPassword">
              현재 비밀번호
            </label>

            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) =>
                setCurrentPassword(
                  e.target.value
                )
              }
              placeholder="현재 비밀번호를 입력해주세요."
              autoComplete="current-password"
            />

          </div>


          {/* =================================================
              새 비밀번호
          ================================================= */}

          <div className="form-group">

            <label htmlFor="newPassword">
              새 비밀번호
            </label>

            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(
                  e.target.value
                )
              }
              placeholder="영문 + 숫자 + 특수문자 8자 이상"
              autoComplete="new-password"
            />

            <small>
              영문, 숫자, 특수문자를 포함하여
              8자 이상 입력해주세요.
            </small>

          </div>


          {/* =================================================
              새 비밀번호 확인
          ================================================= */}

          <div className="form-group">

            <label htmlFor="newPasswordConfirm">
              새 비밀번호 확인
            </label>

            <input
              id="newPasswordConfirm"
              type="password"
              value={newPasswordConfirm}
              onChange={(e) =>
                setNewPasswordConfirm(
                  e.target.value
                )
              }
              placeholder="새 비밀번호를 다시 입력해주세요."
              autoComplete="new-password"
            />

          </div>


          {/* =================================================
              성공 메시지
          ================================================= */}

          {message && (

            <div className="success-message">
              {message}
            </div>

          )}


          {/* =================================================
              오류 메시지
          ================================================= */}

          {error && (

            <div className="error-message">
              {error}
            </div>

          )}


          {/* =================================================
              버튼
          ================================================= */}

          <div className="password-button-area">

            <button
              type="button"
              className="cancel-button"
              onClick={() =>
                navigate("/profile")
              }
              disabled={loading}
            >
              돌아가기
            </button>


            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >

              {loading
                ? "변경 중..."
                : "비밀번호 변경"}

            </button>

          </div>

        </form>

      </section>

    </main>
  );
}


export default PasswordChange;