import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./FindAccount.css";


// =====================================================
// 비밀번호 찾기
// 이메일 인증(재사용: /api/email/send, /api/email/verify) 후
// 새 비밀번호를 등록한다.
// =====================================================

function ResetPasswordForm() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [verified, setVerified] = useState(false);

    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    // 인증번호 발송
    const sendCode = async () => {

        setError("");
        setMessage("");

        if (!email) {
            setError("이메일을 입력해주세요.");
            return;
        }

        try {

            const response = await fetch(
                "/api/email/send",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({ email })
                }
            );

            const text = await response.text();

            if (!response.ok) {
                throw new Error(text || "인증번호 발송에 실패했습니다.");
            }

            setMessage(text);

        } catch (err) {

            setError(err.message || "인증번호 발송에 실패했습니다.");
        }
    };


    // 인증번호 확인
    const verify = async () => {

        setError("");
        setMessage("");

        if (!code) {
            setError("인증번호를 입력해주세요.");
            return;
        }

        try {

            const response = await fetch(
                "/api/email/verify",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        verificationCode: code
                    })
                }
            );

            const text = await response.text();

            if (!response.ok) {
                throw new Error(text || "이메일 인증에 실패했습니다.");
            }

            setVerified(true);
            setMessage(text || "이메일 인증이 완료되었습니다.");

        } catch (err) {

            setVerified(false);
            setError(err.message || "이메일 인증에 실패했습니다.");
        }
    };


    // 비밀번호 재설정
    const submit = async (e) => {

        e.preventDefault();

        setError("");
        setMessage("");

        if (newPassword !== newPasswordConfirm) {
            setError("새 비밀번호가 일치하지 않습니다.");
            return;
        }

        setLoading(true);

        try {

            const response = await fetch(
                "/api/member/reset-password",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        newPassword,
                        newPasswordConfirm
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "비밀번호 재설정에 실패했습니다.");
            }

            setMessage("비밀번호가 재설정되었습니다. 로그인해주세요.");

            setTimeout(() => {
                navigate("/login");
            }, 800);

        } catch (err) {

            setError(err.message || "비밀번호 재설정에 실패했습니다.");

        } finally {

            setLoading(false);
        }
    };


    return (

        <form onSubmit={submit}>

            <span className="find-step">1. 이메일 인증</span>

            <label>
                이메일

                <div className="inline">

                    <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setVerified(false);
                        }}
                        required
                    />

                    <button type="button" onClick={sendCode}>
                        인증번호
                    </button>

                </div>
            </label>

            <label>
                인증번호

                <div className="inline">

                    <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />

                    <button type="button" onClick={verify}>
                        확인
                    </button>

                </div>
            </label>

            {verified && (
                <>
                    <span className="find-step">2. 새 비밀번호 설정</span>

                    <label>
                        새 비밀번호

                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </label>

                    <label>
                        새 비밀번호 확인

                        <input
                            type="password"
                            value={newPasswordConfirm}
                            onChange={(e) => setNewPasswordConfirm(e.target.value)}
                            required
                        />
                    </label>
                </>
            )}

            {message && <div className="auth-message">{message}</div>}
            {error && <div className="auth-error">{error}</div>}

            <button type="submit" disabled={loading || !verified}>
                {loading ? "변경 중..." : "비밀번호 재설정"}
            </button>

        </form>
    );
}


// =====================================================
// 비밀번호 찾기 페이지
// =====================================================

function FindAccount() {

    return (

        <main className="auth-page">

            <div className="auth-card find-card">

                <span className="auth-eyebrow">EASYS</span>

                <h1>비밀번호 찾기</h1>

                <p>가입한 이메일로 인증을 완료하면 새 비밀번호를 설정할 수 있어요.</p>

                <ResetPasswordForm />

                <div className="auth-links">
                    <Link to="/login">로그인으로 돌아가기</Link>
                </div>

            </div>

        </main>
    );
}

export default FindAccount;
