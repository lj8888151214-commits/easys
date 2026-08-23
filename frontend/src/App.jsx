import "./App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

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
import StudyDetail from "./pages/StudyDetail/StudyDetail";

// 페이지 이동 시 스크롤을 맨 위로 올려주는 헬퍼 컴포넌트
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
      {/* 페이지 전환 시 스크롤 최상단 이동 */}
      <ScrollToTop />

      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/streaming" element={<Streaming />} />
        <Route path="/mentor" element={<Mentoring />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/study" element={<Study />} />

        {/* 스터디 상세 페이지 (ID 파라미터 대응 및 기본 경로 모두 지정) */}
        <Route path="/study-detail" element={<StudyDetail />} />
        <Route path="/study/:id" element={<StudyDetail />} />

        <Route path="/study-reservation" element={<StudyReservation />} />
        <Route path="/community" element={<Community />} />
        <Route path="/login" element={<Login />} />
        <Route path="/member" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;