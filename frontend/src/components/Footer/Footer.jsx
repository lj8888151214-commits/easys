import { Link } from "react-router-dom";
import "./Footer.css";

import easyFtLogo from "../../assets/images/easy_ft.png";

const FOOTER_LINKS = [
  { to: "/streaming", label: "스트리밍" },
  { to: "/mentor", label: "멘토링" },
  { to: "/calendar", label: "캘린더" },
  { to: "/study", label: "스터디" },
  { to: "/study-reservation", label: "스터디 예약/결제" },
  { to: "/community", label: "커뮤니티" },
];

function Footer() {
  return (
    <footer className="main-footer">

      <div className="footer-container">

        {/* FOOTER TOP */}
        <div className="footer-top">

          {/* 로고 */}
          <div className="footer-logo">

            <img
              src={easyFtLogo}
              alt="이지스"
              className="footer-logo-image"
            />

            <span className="footer-tagline">
              너무 쉽죠? · 혼자 공부하지 말고, 함께 시작해보세요.
            </span>

          </div>


          {/* 링크 */}
          <ul className="footer-links">

            {FOOTER_LINKS.map((item) => (
              <li key={item.to}>
                <Link to={item.to}>
                  {item.label}
                </Link>
              </li>
            ))}

          </ul>

        </div>


        {/* FOOTER BOTTOM */}
        <div className="footer-bottom">

          <p>
            상호명: (주)이지스
            &nbsp;|&nbsp;
            대표자: Oho
            &nbsp;|&nbsp;
            사업자등록번호: 123-45-67890
          </p>

          <p>
            주소: 인천 부평구 The Legend
            &nbsp;|&nbsp;
            고객센터: 02-1234-5678
            &nbsp;|&nbsp;
            이메일: 1234@1234
          </p>

          <p className="copyright">
            Copyright © 2026 EGIS Inc. All rights reserved.
          </p>

        </div>

      </div>

    </footer>
  );
}

export default Footer;