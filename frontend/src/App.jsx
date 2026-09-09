import "./App.css";
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation
} from "react-router-dom";

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import AiChatbot from "./components/AiChatbot/AiChatbot";

import Home from "./pages/Home/Home.jsx";
import Calendar from "./pages/Calendar/Calendar";
import Streaming from "./pages/Streaming/Streaming";
import Mentoring from "./pages/Mentoring/Mentoring";
import Study from "./pages/Study/Study";
import StudyReservation from "./pages/StudyReservation/StudyReservation";

import Community from "./pages/Community/Community";

import Login from "./pages/Login/Login";
import FindAccount from "./pages/FindAccount/FindAccount";
import Signup from "./pages/Signup/Signup";
import Profile from "./pages/Profile/Profile";
import PasswordChange from "./pages/PasswordChange/PasswordChange";

import StudyCreate from "./pages/StudyCreate/StudyCreate";
import StudyDetail from "./pages/StudyDetail/StudyDetail";
import StudyEdit from "./pages/StudyEdit/StudyEdit";
import CamPage from "./pages/Streaming/CamPage";
import Admin from "./pages/Admin/Admin";

import Payment from "./pages/Payment/Payment";
import PaymentSuccess from "./pages/Payment/PaymentSuccess";
import PaymentFail from "./pages/Payment/PaymentFail";


// =====================================================
// 페이지 이동 시 스크롤 최상단
// =====================================================

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}


// =====================================================
// App
// =====================================================

function App() {
  // AI 챗봇 채팅창 열림 상태. PC에서는 이 컴포넌트(AiChatbot)의 플로팅 버튼이,
  // 모바일에서는 Header 안의 AI 아이콘이 같은 채팅창을 열고 닫아야 해서
  // (둘은 형제 컴포넌트라 직접 상태를 공유할 수 없음) 여기 App에서 관리한다.
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const toggleAiChat = () => setIsAiChatOpen((prev) => !prev);
  const closeAiChat = () => setIsAiChatOpen(false);

  return (
    <BrowserRouter>

      <ScrollToTop />

      <Header isAiChatOpen={isAiChatOpen} onToggleAiChat={toggleAiChat} />

      <Routes>

        {/* =================================================
            메인
        ================================================= */}

        <Route
          path="/"
          element={<Home />}
        />


        {/* =================================================
            스트리밍
        ================================================= */}

        <Route
          path="/streaming"
          element={<Streaming />}
        />
{/* =================================================
            캠 스트리밍
        ================================================= */}
        <Route
          path="/streaming/cam"
          element={<CamPage />}
        />

        {/* =================================================
            멘토링
        ================================================= */}
        <Route
          path="/mentor"
          element={<Mentoring />}
        />


        {/* =================================================
            캘린더
        ================================================= */}

        <Route
          path="/calendar"
          element={<Calendar />}
        />


        {/* =================================================
            스터디 목록
        ================================================= */}

        <Route
          path="/study"
          element={<Study />}
        />


        {/* =================================================
            스터디 생성
        ================================================= */}

        <Route
          path="/study/create"
          element={<StudyCreate />}
        />


        {/* =================================================
            스터디 수정
        ================================================= */}

        <Route
          path="/study/:id/edit"
          element={<StudyEdit />}
        />


        {/* =================================================
            스터디 상세
        ================================================= */}

        <Route
          path="/study/:id"
          element={<StudyDetail />}
        />


        {/* =================================================
            스터디 예약
        ================================================= */}

        <Route
          path="/study-reservation"
          element={<StudyReservation />}
        />


        {/* =================================================
            커뮤니티 목록
        ================================================= */}

        <Route
          path="/community"
          element={<Community />}
        />


        {/* =================================================
            커뮤니티 글 작성
        ================================================= */}

        <Route
          path="/community/write"
          element={<Community />}
        />


        {/* =================================================
            커뮤니티 게시글 상세
            /community/1
            /community/2
            /community/3
            ...
        ================================================= */}

        <Route
          path="/community/:id"
          element={<Community />}
        />


        {/* =================================================
            결제 (멘토링/스터디 공통)
        ================================================= */}

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


        {/* =================================================
            로그인
        ================================================= */}

        <Route
          path="/login"
          element={<Login />}
        />


        {/* =================================================
            아이디 / 비밀번호 찾기
        ================================================= */}

        <Route
          path="/find-account"
          element={<FindAccount />}
        />


        {/* =================================================
            회원가입
        ================================================= */}

        <Route
          path="/member"
          element={<Signup />}
        />


        {/* =================================================
            프로필
        ================================================= */}

        <Route
          path="/profile"
          element={<Profile />}
        />


        {/* =================================================
            비밀번호 변경
        ================================================= */}

        <Route
          path="/profile/password"
          element={<PasswordChange />}
        />


        {/* =================================================
            관리자
        ================================================= */}

        <Route
          path="/admin"
          element={<Admin />}
        />

      </Routes>

      <Footer />

      <AiChatbot isOpen={isAiChatOpen} onToggle={toggleAiChat} onClose={closeAiChat} />

    </BrowserRouter>
  );
}

export default App;
