import { useEffect, useState } from "react";
import "./Header.css";

import logo from "../../assets/images/logo.png";
import logoSecond from "../../assets/images/logo_second.png";

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleMenuToggle = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  return (
    <header className={`main-header ${scrolled ? "scrolled" : ""}`}>
      <div className="header-container">
        <a href="/" className="header-logo">
          <img src={logo} alt="이지스" className="logo logo-primary" />
          <img src={logoSecond} alt="이지스" className="logo logo-secondary" />
        </a>

        <nav className="main-nav">
          <ul>
            <li><a href="/streaming">스트리밍</a></li>
            <li><a href="/mentor">멘토링</a></li>
            <li><a href="/calendar">캘린더</a></li>
            <li><a href="/study">스터디</a></li>
            <li><a href="/study-reservation">스터디 예약/결제</a></li>
            <li><a href="/community">커뮤니티</a></li>
          </ul>
        </nav>

        <div className="header-right">
          <div className="header-search">
            <form action="/search" method="get">
              <input type="text" name="keyword" placeholder="검색어를 입력하세요" />
              <button type="submit">🔍</button>
            </form>
          </div>

          <div className="header-member guest-member">
            <a href="/login" className="login-btn">로그인</a>
            <a href="/member" className="signup-btn">회원가입</a>
          </div>
        </div>

        <button
          type="button"
          className={`mobile-menu-btn ${menuOpen ? "active" : ""}`}
          id="mobileMenuBtn"
          onClick={handleMenuToggle}
          aria-expanded={menuOpen}
          aria-label="모바일 메뉴"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div className={`mobile-menu ${menuOpen ? "active" : ""}`} id="mobileMenu">
        <nav>
          <a href="/streaming" onClick={handleMenuClose}>스트리밍</a>
          <a href="/mentor" onClick={handleMenuClose}>멘토링</a>
          <a href="/calendar" onClick={handleMenuClose}>캘린더</a>
          <a href="/study" onClick={handleMenuClose}>스터디</a>
          <a href="/study-reservation" onClick={handleMenuClose}>스터디 예약/결제</a>
          <a href="/community" onClick={handleMenuClose}>커뮤니티</a>

          <div className="mobile-menu-divider"></div>

          <div className="mobile-member">
            <a href="/login" onClick={handleMenuClose}>로그인</a>
            <a href="/member" onClick={handleMenuClose}>회원가입</a>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;