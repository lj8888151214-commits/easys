import "./Footer.css";

function Footer() {
  return (
    <footer className="main-footer">

      <div className="footer-container">

        {/* FOOTER TOP */}
        <div className="footer-top">

          {/* 로고 */}
          <div className="footer-logo">

            <span className="footer-logo-text">
              이지스
            </span>

            <span className="footer-tagline">
              너무 쉽죠? · 혼자 공부하지 말고, 함께 시작해보세요.
            </span>

          </div>


          {/* 링크 */}
          <ul className="footer-links">

            <li>
              <a href="#">
                회사소개
              </a>
            </li>

            <li>
              <a href="#">
                이용약관
              </a>
            </li>

            <li>
              <a href="#">
                <strong>
                  개인정보처리방침
                </strong>
              </a>
            </li>

            <li>
              <a href="#">
                고객센터
              </a>
            </li>

            <li>
              <a href="#">
                제휴문의
              </a>
            </li>

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