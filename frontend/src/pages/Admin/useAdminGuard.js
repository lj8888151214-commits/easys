import { useEffect, useState } from "react";

// 관리자 페이지 진입 시 로그인 + 권한을 확인하는 공용 훅
// 실제 차단은 백엔드(SecurityConfig)가 하므로, 이건 화면 노출용 UX 가드다.
export function useAdminGuard() {
  const [status, setStatus] = useState("checking"); // checking | admin | forbidden

  useEffect(() => {
    let cancelled = false;

    const checkAdmin = async () => {
      try {
        const response = await fetch("/api/member/me", {
          credentials: "include",
        });

        if (!response.ok) {
          if (!cancelled) setStatus("forbidden");
          return;
        }

        const data = await response.json();

        if (!cancelled) {
          setStatus(data.role === "ADMIN" ? "admin" : "forbidden");
        }
      } catch (error) {
        console.error("관리자 권한 확인 오류:", error);
        if (!cancelled) setStatus("forbidden");
      }
    };

    checkAdmin();

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
