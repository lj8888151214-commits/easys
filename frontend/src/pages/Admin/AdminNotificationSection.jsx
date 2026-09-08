import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const API_BASE = "/api/admin";

function AdminNotificationSection() {

    const [searchParams, setSearchParams] = useSearchParams();

    const [linked, setLinked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [unlinking, setUnlinking] = useState(false);

    const loadStatus = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(`${API_BASE}/kakao-notify/status`, {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`연결 상태를 확인하지 못했습니다. (HTTP ${response.status})`);
            }

            const data = await response.json();
            setLinked(!!data.linked);
        } catch (err) {
            setError(err.message || "연결 상태를 확인하지 못했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStatus();
    }, []);

    // 카카오 인가 후 /admin?kakaoLinked=1(또는 0)로 돌아왔을 때 안내 메시지 표시
    useEffect(() => {
        const kakaoLinked = searchParams.get("kakaoLinked");

        if (kakaoLinked === "1") {
            setMessage("카카오톡 알림이 연결되었습니다.");
            loadStatus();
        } else if (kakaoLinked === "0") {
            setError("카카오톡 연결에 실패했습니다. 다시 시도해주세요.");
        }

        if (kakaoLinked !== null) {
            searchParams.delete("kakaoLinked");
            setSearchParams(searchParams, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleUnlink = async () => {
        if (!window.confirm("카카오톡 알림 연결을 해제할까요?")) return;

        setUnlinking(true);
        setError("");
        setMessage("");

        try {
            const response = await fetch(`${API_BASE}/kakao-notify/unlink`, {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("연결 해제에 실패했습니다.");
            }

            setLinked(false);
            setMessage("카카오톡 알림 연결을 해제했습니다.");
        } catch (err) {
            setError(err.message || "연결 해제에 실패했습니다.");
        } finally {
            setUnlinking(false);
        }
    };

    return (
        <section className="admin-section">
            <div className="admin-section-header">
                <h2>알림 설정</h2>
            </div>

            <div className="admin-room-form" style={{ maxWidth: 520 }}>
                <h3>카카오톡 알림 (관리자 전용)</h3>

                <p style={{ margin: 0, color: "#5c655f", fontSize: 13, lineHeight: 1.6 }}>
                    스터디룸 예약 결제가 완료되면 지금처럼 이메일로도 안내되고,
                    아래에서 카카오 계정을 연결해두면 같은 알림을 카카오톡
                    "나에게 보내기"로도 받을 수 있어요. (관리자 본인에게만 전송되며,
                    예약한 회원에게 카카오톡을 보내는 기능은 아닙니다.)
                </p>

                {loading && <p className="admin-state-message">확인하는 중입니다...</p>}

                {!loading && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className={`admin-status ${linked ? "on" : "off"}`}>
                            {linked ? "연결됨" : "연결 안 됨"}
                        </span>

                        {!linked && (
                            <a
                                href="/api/admin/kakao-notify/authorize"
                                style={{
                                    padding: "10px 16px",
                                    borderRadius: 9,
                                    background: "#fee500",
                                    color: "#3c1e1e",
                                    fontWeight: 700,
                                    textDecoration: "none",
                                }}
                            >
                                카카오톡으로 연결하기
                            </a>
                        )}

                        {linked && (
                            <button
                                type="button"
                                onClick={handleUnlink}
                                disabled={unlinking}
                                style={{
                                    padding: "10px 16px",
                                    border: "1px solid #e1e7e2",
                                    borderRadius: 9,
                                    background: "#edf1ed",
                                    color: "#5c655f",
                                    fontFamily: "inherit",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                }}
                            >
                                {unlinking ? "해제 중..." : "연결 해제"}
                            </button>
                        )}
                    </div>
                )}

                {message && <p className="admin-form-error" style={{ color: "#2e7d46" }}>{message}</p>}
                {error && <p className="admin-form-error">{error}</p>}
            </div>
        </section>
    );
}

export default AdminNotificationSection;
