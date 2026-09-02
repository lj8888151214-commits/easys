import { Link, useSearchParams } from "react-router-dom";
import "./Payment.css";

const BACK_LINKS = {
  mentoring: { to: "/mentor", label: "멘토링으로 돌아가기" },
  study: { to: "/study-reservation", label: "스터디 예약으로 돌아가기" }
};

export default function PaymentFail() {
  const [searchParams] = useSearchParams();
  const message =
    searchParams.get("message") || "결제가 취소되었거나 실패했습니다.";
  const backLink = BACK_LINKS[searchParams.get("type")] || BACK_LINKS.mentoring;

  return (
    <div className="payment-page">
      <div className="payment-card">
        <span className="payment-fail-icon">✕</span>
        <h2>결제에 실패했습니다</h2>
        <p className="payment-notice">{message}</p>
        <Link to={backLink.to} className="payment-submit-button payment-link-button">
          {backLink.label}
        </Link>
      </div>
    </div>
  );
}
