import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

import Home from "./pages/Home/Home.jsx";
import Calendar from "./pages/Calendar/Calendar";
import Streaming from "./pages/Streaming/Streaming";
import Mentoring from "./pages/Mentoring/Mentoring";
import Study from "./pages/Study/Study";
import StudyReservation from "./pages/StudyReservation/StudyReservation";
import Community from "./pages/Community/Community";

function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/streaming" element={<Streaming />} />
        <Route path="/mentor" element={<Mentoring />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/study" element={<Study />} />
        <Route path="/study-reservation" element={<StudyReservation />} />
        <Route path="/community" element={<Community />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;