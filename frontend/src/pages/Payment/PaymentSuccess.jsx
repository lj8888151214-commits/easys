import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "./Payment.css";

// =====================================================
// 토스 결제창에서 successUrl로 리다이렉트되는 페이지.
// paymentKey/orderId/amount를 그대로 서버에 전달해 결제를 최종 승인한다.
// (여러 번 마운트되어도 승인 요청이 중복되지 않도록 ref로 막는다.)
// =====================================================

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("confirming");
  const confirmedRef = useRef(false);
  const type = searchParams.get("type") || "mentoring";
  const backTo = type === "study" ? "/profile" : "/mentor";
  const backLabel = type === "study" ? "내 예약 내역으로 돌아가기" : "멘토링으로 돌아가기";

  useEffect(() => {
    if (confirmedRef.current) return;
    confirmedRef.current = true;

    const type = searchParams.get("type") || "mentoring";
    const targetId = searchParams.get("id");

    const confirmPayment = async () => {
      try {
        const response = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            orderId: searchParams.get("orderId"),
            paymentKey: searchParams.get("paymentKey"),
            amount: Number(searchParams.get("amount"))
          })
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          navigate(
            `/payment/fail?type=${type}&id=${targetId}&message=${encodeURIComponent(
              data?.message || "결제 승인에 실패했습니다."
            )}`
          );
          return;
        }

        setStatus("done");
      } catch (err) {
        console.error("결제 승인 오류:", err);
        navigate(
          `/payment/fail?type=${type}&id=${targetId}&message=${encodeURIComponent(
            "서버와 통신하는 중 오류가 발생했습니다."
          )}`
        );
      }
    };

    confirmPayment();
  }, [searchParams, navigate]);

  return (
    <div className="payment-page">
      <div className="payment-card">
        {status === "confirming" ? (
          <p>결제를 승인하는 중입니다...</p>
        ) : (
          <>
            <span className="payment-success-icon">✓</span>
            <h2>결제가 완료되었습니다</h2>
            <p className="payment-notice">
              결제금액{" "}
              {Number(searchParams.get("amount") || 0).toLocaleString()}원
            </p>
            <Link to={backTo} className="payment-submit-button payment-link-button">
              {backLabel}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
