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
  { to: "/study-reservation", label: "스터디 예약/결제" },
  { to: "/community", label: "커뮤니티" },
];

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <header className={`main-header ${scrolled ? "scrolled" : ""}`}>
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