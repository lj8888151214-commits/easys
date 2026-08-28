import "./App.css";
import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation
} from "react-router-dom";

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

import Home from "./pages/Home/Home.jsx";
import Calendar from "./pages/Calendar/Calendar";
import Streaming from "./pages/Streaming/Streaming";
import Mentoring from "./pages/Mentoring/Mentoring";
import Study from "./pages/Study/Study";
import StudyReservation from "./pages/StudyReservation/StudyReservation";
import Community from "./pages/Community/Community";

import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import Profile from "./pages/Profile/Profile";
import PasswordChange from "./pages/PasswordChange/PasswordChange";

import StudyCreate from "./pages/StudyCreate/StudyCreate";
import StudyDetail from "./pages/StudyDetail/StudyDetail";
import StudyEdit from "./pages/StudyEdit/StudyEdit";

import Payment from "./pages/Payment/Payment";
import PaymentSuccess from "./pages/Payment/PaymentSuccess";
import PaymentFail from "./pages/Payment/PaymentFail";


// 페이지 이동 시 스크롤 최상단
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}


function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <Header />

      <Routes>
        {/* 메인 */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* 스트리밍 */}
        <Route
          path="/streaming"
          element={<Streaming />}
        />

        {/* 멘토링 */}
        <Route
          path="/mentor"
          element={<Mentoring />}
        />

        {/* 캘린더 */}
        <Route
          path="/calendar"
          element={<Calendar />}
        />

        {/* 스터디 목록 */}
        <Route
          path="/study"
          element={<Study />}
        />

        {/* 스터디 생성 */}
        <Route
          path="/study/create"
          element={<StudyCreate />}
        />

        {/* 스터디 수정 */}
        <Route
          path="/study/:id/edit"
          element={<StudyEdit />}
        />

        {/* 스터디 상세 */}
        <Route
          path="/study/:id"
          element={<StudyDetail />}
        />

        {/* 스터디 예약 */}
        <Route
          path="/study-reservation"
          element={<StudyReservation />}
        />

        {/* 커뮤니티 */}
        <Route
          path="/community"
          element={<Community />}
        />

        {/* 결제 (멘토링/스터디 공통) */}
        <Route
          path="/payment"
          element={<Payment />}
        />
        <Route
          path="/payment/success"
          element={<PaymentSuccess />}
        />
        <Route
          path="/payment/fail"
          element={<PaymentFail />}
        />

        {/* 로그인 */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* 회원가입 */}
        <Route
          path="/member"
          element={<Signup />}
        />

        {/* 프로필 */}
        <Route
          path="/profile"
          element={<Profile />}
        />

        {/* 비밀번호 변경 */}
        <Route
          path="/profile/password"
          element={<PasswordChange />}
        />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;