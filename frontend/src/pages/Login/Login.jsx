import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const body = new URLSearchParams();

      body.set("username", email);
      body.set("password", password);

      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
        credentials: "include",
        redirect: "follow",
      });

      console.log("로그인 응답 상태:", response.status);
      console.log("로그인 응답 URL:", response.url);

      if (!response.ok || response.url.includes("/login?error=true")) {
        throw new Error("로그인 실패");
      }

      navigate(location.state?.from || "/", {
        replace: true,
      });

    } catch (err) {
      console.error("로그인 오류:", err);
      setError("이메일 또는 비밀번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <span className="auth-eyebrow">EASYS</span>

        <h1>로그인</h1>

        <p>
          이지스 스터디에 다시 오신 것을 환영해요.
        </p>

        <label>
          이메일
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          비밀번호
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </button>

        <div className="auth-links">
          <span>계정이 없나요?</span>
          <Link to="/member">회원가입</Link>
        </div>
      </form>
    </main>
  );
}

export default Login;