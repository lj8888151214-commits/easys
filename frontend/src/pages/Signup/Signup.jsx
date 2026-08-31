import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Signup.css";

function Signup() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        birthday: "",
        email: "",
        password: "",
        passwordConfirm: "",
        nickname: ""
    });

    const [code, setCode] = useState("");
    const [verified, setVerified] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [loading, setLoading] = useState(false);


    // 입력값 변경
    const change = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };


    // 이메일 인증번호 발송
    const sendCode = async () => {

        setError("");
        setMessage("");

        if (!form.email) {

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

                    body: JSON.stringify({
                        email: form.email
                    })
                }
            );

            const text = await response.text();

            if (!response.ok) {

                throw new Error(
                    text ||
                    "인증번호 발송에 실패했습니다."
                );
            }

            setMessage(text);

        } catch (error) {

            setError(
                error.message ||
                "인증번호 발송에 실패했습니다."
            );
        }
    };


    // 이메일 인증번호 확인
    const verify = async () => {

        setError("");
        setMessage("");

        if (!form.email) {

            setError("이메일을 입력해주세요.");

            return;
        }

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
                        email: form.email,
                        verificationCode: code
                    })
                }
            );

            const text = await response.text();

            if (!response.ok) {

                throw new Error(
                    text ||
                    "이메일 인증에 실패했습니다."
                );
            }

            setVerified(true);

            setMessage(
                text ||
                "이메일 인증이 완료되었습니다."
            );

        } catch (error) {

            setVerified(false);

            setError(
                error.message ||
                "이메일 인증에 실패했습니다."
            );
        }
    };


    // 회원가입
    const submit = async (e) => {

        e.preventDefault();

        setError("");
        setMessage("");

        if (!verified) {

            setError(
                "이메일 인증을 먼저 완료해주세요."
            );

            return;
        }

        if (form.password !== form.passwordConfirm) {

            setError(
                "비밀번호가 일치하지 않습니다."
            );

            return;
        }

        setLoading(true);

        try {

            const response = await fetch(
                "/api/member",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(form)
                }
            );

            const text = await response.text();

            let data = {};

            try {

                data = text
                    ? JSON.parse(text)
                    : {};

            } catch {

                data = {
                    message: text
                };
            }

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    text ||
                    "회원가입에 실패했습니다."
                );
            }

            setMessage(
                "회원가입이 완료되었습니다."
            );


            // 성공했을 때만 로그인 페이지로 이동
            setTimeout(() => {

                navigate("/login");

            }, 500);

        } catch (error) {

            setError(
                error.message ||
                "회원가입에 실패했습니다."
            );

        } finally {

            setLoading(false);
        }
    };


    return (

        <main className="auth-page">

            <form
                className="auth-card signup-card"
                onSubmit={submit}
            >

                <span className="auth-eyebrow">
                    EASYS
                </span>

                <h1>
                    회원가입
                </h1>

                <p>
                    간단한 정보 입력 후 이메일 인증을 완료해주세요.
                </p>


                {/* 생년월일 */}

                <label>
                    생년월일 (6자리)

                    <input
                        name="birthday"
                        value={form.birthday}
                        onChange={change}
                        maxLength="6"
                        required
                    />
                </label>


                {/* 이메일 */}

                <label>
                    이메일

                    <div className="inline">

                        <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={(e) => {

                                change(e);

                                setVerified(false);
                            }}
                            required
                        />

                        <button
                            type="button"
                            onClick={sendCode}
                        >
                            인증번호
                        </button>

                    </div>
                </label>


                {/* 인증번호 */}

                <label>
                    인증번호

                    <div className="inline">

                        <input
                            value={code}
                            onChange={(e) =>
                                setCode(e.target.value)
                            }
                        />

                        <button
                            type="button"
                            onClick={verify}
                        >
                            확인
                        </button>

                    </div>
                </label>


                {/* 닉네임 */}

                <label>
                    닉네임

                    <input
                        name="nickname"
                        value={form.nickname}
                        onChange={change}
                        maxLength="10"
                        required
                    />
                </label>


                {/* 비밀번호 */}

                <label>
                    비밀번호

                    <input
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={change}
                        required
                    />
                </label>


                {/* 비밀번호 확인 */}

                <label>
                    비밀번호 확인

                    <input
                        name="passwordConfirm"
                        type="password"
                        value={form.passwordConfirm}
                        onChange={change}
                        required
                    />
                </label>


                {/* 성공 메시지 */}

                {message && (

                    <div className="auth-message">
                        {message}
                    </div>

                )}


                {/* 에러 메시지 */}

                {error && (

                    <div className="auth-error">
                        {error}
                    </div>

                )}


                {/* 회원가입 버튼 */}

                <button
                    type="submit"
                    disabled={loading}
                >
                    {loading
                        ? "가입 중..."
                        : "회원가입"
                    }
                </button>


                <div className="auth-links">

                    <span>
                        이미 계정이 있나요?
                    </span>

                    <Link to="/login">
                        로그인
                    </Link>

                </div>

            </form>

        </main>
    );
}

export default Signup;