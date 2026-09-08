import { useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    searchParams.get("error") === "google"
      ? "구글 로그인에 실패했습니다. 다시 시도해주세요."
      : ""
  );
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

   try {
         const body = new URLSearchParams();
         body.set("username", email);
         body.set("password", password);

         // 🌟 현재 브라우저가 접속한 IP(또는 도메인)를 가져옴
         const backendHost = window.location.hostname;

         // 🌟 상대 경로 대신 명시적으로 8080 포트로 요청하도록 수정
         const response = await fetch("/api/login", {
           method: "POST",
           headers: { "Content-Type": "application/x-www-form-urlencoded" },
           body: body.toString(),
           credentials: "include",
         });

         console.log("🔥 로그인 응답 상태:", response.status);
      console.log("🔥 로그인 응답 URL:", response.url);

      if (!response.ok) throw new Error("로그인 실패");

      console.log("🔥 로그인 성공!");

      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      console.error("❌ 로그인 오류:", err);
      setError("이메일 또는 비밀번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-drop auth-drop-1"></div>
      <div className="auth-drop auth-drop-2"></div>
      <div className="auth-drop auth-drop-3"></div>
      <div className="auth-drop auth-drop-4"></div>
      <div className="auth-drop auth-drop-5"></div>

      <form className="auth-card" onSubmit={submit}>
        <span className="auth-eyebrow">EASYS</span>
        <h1>로그인</h1>
        <p>이지스 스터디에 다시 오신 것을 환영해요.</p>

        <label>
          이메일
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>

        <label>
          비밀번호
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" disabled={loading}>{loading ? "로그인 중..." : "로그인"}</button>

        <div className="auth-divider"><span>또는</span></div>

        <a className="google-login-button" href="/oauth2/authorization/google">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9C16.66 14.2 17.64 11.9 17.64 9.2z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.35 2.83.94 4.03z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"/>
          </svg>
          구글로 로그인
        </a>

        <div className="auth-links">
          <Link to="/find-account">비밀번호 찾기</Link>
        </div>

        <div className="auth-links">
          <span>계정이 없나요?</span>
          <Link to="/member">회원가입</Link>
        </div>
      </form>
    </main>
  );
}

export default Login;