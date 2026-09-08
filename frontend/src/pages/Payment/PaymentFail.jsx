import { Link, useSearchParams } from "react-router-dom";
import "./Payment.css";

export default function PaymentFail() {
  const [searchParams] = useSearchParams();
  const message =
    searchParams.get("message") || "결제가 취소되었거나 실패했습니다.";
  const type = searchParams.get("type") || "mentoring";
  const backTo = type === "study" ? "/profile" : "/mentor";
  const backLabel = type === "study" ? "내 예약 내역으로 돌아가기" : "멘토링으로 돌아가기";

  return (
    <div className="payment-page">
      <div className="payment-card">
        <span className="payment-fail-icon">✕</span>
        <h2>결제에 실패했습니다</h2>
        <p className="payment-notice">{message}</p>
        <Link to={backTo} className="payment-submit-button payment-link-button">
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
