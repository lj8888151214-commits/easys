import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Header.css";

import logo from "../../assets/images/logo.png";
import logoSecond from "../../assets/images/logo_second.png";
import NotificationBell from "./NotificationBell";

const NAV_ITEMS = [
  { to: "/streaming", label: "스트리밍" },
  { to: "/mentor", label: "멘토링" },
  { to: "/calendar", label: "캘린더" },
  { to: "/study", label: "스터디" },
  { to: "/study-reservation", label: "카페 예약/결제" },
  { to: "/community", label: "커뮤니티" },
];

// Home처럼 Hero 이미지/영상 위에 헤더가 얹히는 페이지는 최상단에서 투명
// 헤더가 자연스럽지만, 아래 페이지들은 Hero가 없는 일반 내부 페이지라
// 처음부터 컬러(흰 배경 + #9dc5a8) 헤더를 써야 한다.
// 목록에 없는 다른 페이지는 기존 그대로(최상단 투명 → 스크롤 시 컬러) 동작한다.
//
// Hero가 있어 기존 방식(투명 → 스크롤 시 컬러)이 그대로 맞는 페이지:
// "/", "/streaming", "/mentor", "/calendar", "/study", "/study-reservation",
// "/community"(글쓰기/상세 포함) — 전부 최상단에 hero 섹션이 있어 투명 헤더가 자연스럽다.
const COLORED_HEADER_PATHS = [
  "/login",
  "/member",
  "/admin",
  "/study/create",
  "/profile",
  "/profile/password",
  "/payment",
  "/payment/success",
  "/payment/fail",
];

function isColoredHeaderPath(pathname) {
  if (COLORED_HEADER_PATHS.includes(pathname)) {
    return true;
  }

  // "/streaming/cam"은 ?roomId=... 쿼리스트링이 붙어서 들어오므로 접두사로 확인한다.
  if (pathname.startsWith("/streaming/cam")) {
    return true;
  }

  // 스터디 상세("/study/:id")와 수정("/study/:id/edit")도 hero가 없다.
  // 목록("/study")과 생성("/study/create", 위에서 이미 처리)은 제외해야 하므로
  // "/study/" 바로 다음에 오는 한 구간을 id로 보고, 그 값이 "create"가 아닐 때만 적용한다.
  const studyDetailMatch = /^\/study\/([^/]+)(?:\/edit)?$/.exec(pathname);
  if (studyDetailMatch && studyDetailMatch[1] !== "create") {
    return true;
  }

  return false;
}

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Hero가 없는 일반 내부 페이지는 스크롤 여부와 무관하게 처음부터
  // 컬러 헤더를 강제한다. 기존 스크롤 감지 로직(아래)은 그대로 두고,
  // 렌더링 시 scrolled와 OR로 합쳐서 클래스를 결정한다.
  const forceColoredHeader = isColoredHeaderPath(location.pathname);

  // =========================================================
  // 로그인 사용자 확인
  // =========================================================
  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await fetch("/api/member/me", {
          method: "GET",
          credentials: "include",
        });

        console.log("🔥 /api/member/me 상태:", response.status);

        if (response.status === 401) {
          setUser(null);
          return;
        }

        if (!response.ok) {
          console.log("❌ 사용자 정보 조회 실패:", response.status);
          setUser(null);
          return;
        }

        const data = await response.json();

        console.log("🔥 현재 로그인 사용자:", data);

        setUser(data);
      } catch (error) {
        console.error("❌ 사용자 정보를 불러오지 못했습니다.", error);
        setUser(null);
      }
    };

    getUser();
  }, [location.pathname]);

  // =========================================================
  // 스크롤
  // =========================================================
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // =========================================================
  // 모바일 메뉴
  // =========================================================
  const handleMenuToggle = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  // =========================================================
  // 로그아웃
  // =========================================================
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      console.log("🔥 로그아웃 상태:", response.status);

      setUser(null);
      setMenuOpen(false);

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error("❌ 로그아웃 오류:", error);
    }
  };

  // =========================================================
  // 프로필 이미지
  // =========================================================
  const profileImage =
    user?.profileImageUrl
      ? `/api${user.profileImageUrl}`
      : "/default-profile.svg";

  const isScrolledStyle = scrolled || forceColoredHeader;

  return (
    <header className={`main-header ${isScrolledStyle ? "scrolled" : ""}`}>
      <div className="header-container">

        {/* =====================================================
            로고
        ===================================================== */}
        <Link to="/" className="header-logo">
          <img
            src={logo}
            alt="이지스"
            className="logo logo-primary"
          />

          <img
            src={logoSecond}
            alt="이지스"
            className="logo logo-secondary"
          />
        </Link>

        {/* =====================================================
            PC 메뉴
        ===================================================== */}
        <nav className="main-nav">
          <ul>
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <Link to={item.to}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* =====================================================
            오른쪽 영역
        ===================================================== */}
        <div className="header-right">

          {/* 검색 */}
          <div className="header-search">
            <form action="/search" method="get">
              <input
                type="text"
                name="keyword"
                placeholder="검색어를 입력하세요"
              />

              <button type="submit" aria-label="검색">
                🔍
              </button>
            </form>
          </div>

          {/* ===================================================
              로그인 상태
          =================================================== */}
          <div className="header-member">

            {user ? (
              <div className="user-member">

                {/* 알림 */}
                <NotificationBell />

                {/* 프로필 이미지 */}
                <Link
                  to="/profile"
                  className="profile-link"
                  aria-label="프로필"
                >
                  <img
                    src={profileImage}
                    alt="프로필"
                    className="header-profile-image"
                    onError={(e) => {
                      e.currentTarget.src =
                        "/default-profile.svg";
                    }}
                  />
                </Link>

                {/* 닉네임 */}
                <Link
                  to="/profile"
                  className="user-nickname"
                >
                  {user.nickname ||
                    user.name ||
                    "마이페이지"}
                </Link>

                {/* 관리자 링크 */}
                {user.role === "ADMIN" && (
                  <Link
                    to="/admin"
                    className="admin-link"
                  >
                    관리자
                  </Link>
                )}

                {/* PC 로그아웃 */}
                <button
                  type="button"
                  className="logout-btn"
                  onClick={handleLogout}
                >
                  로그아웃
                </button>

              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="login-btn"
                >
                  로그인
                </Link>

                <Link
                  to="/member"
                  className="signup-btn"
                >
                  회원가입
                </Link>
              </>
            )}

          </div>
        </div>

        {/* =====================================================
            모바일 햄버거
        ===================================================== */}
        <button
          type="button"
          className={`mobile-menu-btn ${
            menuOpen ? "active" : ""
          }`}
          onClick={handleMenuToggle}
          aria-expanded={menuOpen}
          aria-label="모바일 메뉴"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* =======================================================
          모바일 메뉴
      ======================================================= */}
      <div
        className={`mobile-menu ${
          menuOpen ? "active" : ""
        }`}
      >
        <nav>

          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={handleMenuClose}
            >
              {item.label}
            </Link>
          ))}

          <div className="mobile-menu-divider"></div>

          <div className="mobile-member">

            {user ? (
              <Link
                to="/profile"
                className="mobile-profile-link"
                onClick={handleMenuClose}
              >
                <img
                  src={profileImage}
                  alt="프로필"
                  className="mobile-profile-image"
                  onError={(e) => {
                    e.currentTarget.src =
                      "/default-profile.svg";
                  }}
                />

                <span>
                  {user.nickname ||
                    user.name ||
                    "마이페이지"}
                </span>
              </Link>
            ) : null}

            {user && user.role === "ADMIN" && (
              <Link
                to="/admin"
                onClick={handleMenuClose}
              >
                관리자
              </Link>
            )}

            {!user && (
              <>
                <Link
                  to="/login"
                  onClick={handleMenuClose}
                >
                  로그인
                </Link>

                <Link
                  to="/member"
                  onClick={handleMenuClose}
                >
                  회원가입
                </Link>
              </>
            )}

          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;