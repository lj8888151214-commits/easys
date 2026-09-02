import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import "./Payment.css";

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY;

// =====================================================
// 공통 결제 페이지.
//
// 멘토링/스터디 등 상품 종류(type)와 대상 id(id)만 쿼리스트링으로
// 받아서, 상품명/금액 등은 서버에서 조회한 값을 그대로 표시한다.
// 스터디 결제가 추가되면 이 맵에 한 줄만 추가하면 된다.
// =====================================================

const PAYMENT_INFO_ENDPOINTS = {
  mentoring: (id) => `/api/payments/mentoring/${id}`,
  study: (id) => `/api/payments/study/${id}`
};

export default function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "mentoring";
  const targetId = searchParams.get("id");

  const [user, setUser] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/member/me", {
          credentials: "include"
        });
        if (response.ok) {
          setUser(await response.json());
        }
      } catch (err) {
        console.error("사용자 정보 조회 오류:", err);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const endpointBuilder = PAYMENT_INFO_ENDPOINTS[type];

    if (!endpointBuilder || !targetId) {
      setError("잘못된 결제 요청입니다.");
      setLoading(false);
      return;
    }

    const fetchPaymentInfo = async () => {
      try {
        const response = await fetch(endpointBuilder(targetId), {
          credentials: "include"
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          setError(data?.message || "결제 정보를 불러오지 못했습니다.");
          return;
        }

        setPaymentInfo(data);
      } catch (err) {
        console.error("결제 정보 조회 오류:", err);
        setError("서버와 통신하는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentInfo();
  }, [type, targetId]);

  const handlePay = async () => {
    if (!paymentInfo || submitting || paymentInfo.status === "PAID") return;

    setSubmitting(true);

    try {
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({
        customerKey: user ? `MEMBER_${user.id}` : ANONYMOUS
      });

      await payment.requestPayment({
        method: "CARD",
        amount: {
          currency: "KRW",
          value: paymentInfo.amount
        },
        orderId: paymentInfo.orderId,
        orderName: paymentInfo.orderName,
        successUrl: `${window.location.origin}/payment/success?type=${type}&id=${targetId}`,
        failUrl: `${window.location.origin}/payment/fail?type=${type}&id=${targetId}`,
        customerEmail: user?.email,
        customerName: user?.nickname,
        card: {
          useEscrow: false,
          flowMode: "DEFAULT",
          useCardPoint: false,
          useAppCardOnly: false
        }
      });
    } catch (err) {
      if (err?.code !== "USER_CANCEL") {
        console.error("결제 요청 오류:", err);
        alert(err?.message || "결제 요청 중 오류가 발생했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="payment-page">
        <div className="payment-card">불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-page">
        <div className="payment-card">
          <p className="payment-error">{error}</p>
          <button
            type="button"
            className="payment-back-button"
            onClick={() => navigate(-1)}
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const alreadyPaid = paymentInfo.status === "PAID";

  return (
    <div className="payment-page">
      <div className="payment-card">
        <span className="section-label">PAYMENT</span>
        <h2>결제하기</h2>

        <div className="payment-summary">
          <div className="payment-summary-row">
            <span>상품명</span>
            <strong>{paymentInfo.orderName}</strong>
          </div>
          <div className="payment-summary-row">
            <span>주문번호</span>
            <strong>{paymentInfo.orderId}</strong>
          </div>
          <div className="payment-summary-row payment-amount-row">
            <span>결제 금액</span>
            <strong>{Number(paymentInfo.amount).toLocaleString()}원</strong>
          </div>
        </div>

        {alreadyPaid ? (
          <p className="payment-notice">이미 결제가 완료되었습니다.</p>
        ) : (
          <button
            type="button"
            className="payment-submit-button"
            disabled={submitting}
            onClick={handlePay}
          >
            {submitting ? "결제창 여는 중..." : "토스페이먼츠로 결제하기"}
          </button>
        )}
      </div>
    </div>
  );
}
