import { useState } from "react";
import { Link } from "react-router-dom";
import "./Admin.css";
import { useAdminGuard } from "./useAdminGuard";
import AdminStudyRoomSection from "./AdminStudyRoomSection";
import AdminCommunitySection from "./AdminCommunitySection";
import AdminStudySection from "./AdminStudySection";

const TABS = [
  { key: "rooms", label: "스터디룸 관리" },
  { key: "community", label: "커뮤니티 관리" },
  { key: "study", label: "스터디 관리" },
];

function Admin() {
  const guardStatus = useAdminGuard();
  const [activeTab, setActiveTab] = useState("rooms");

  if (guardStatus === "checking") {
    return <main className="admin-page admin-state">권한을 확인하는 중입니다...</main>;
  }

  if (guardStatus === "forbidden") {
    return (
      <main className="admin-page admin-state">
        <p>관리자만 접근할 수 있는 페이지입니다.</p>
        <Link to="/">홈으로 돌아가기</Link>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="admin-header">
        <h1>관리자 대시보드</h1>
        <p>사이트 데이터를 관리자 권한으로 직접 관리할 수 있습니다.</p>
      </div>

      <nav className="admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`admin-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "rooms" && <AdminStudyRoomSection />}
      {activeTab === "community" && <AdminCommunitySection />}
      {activeTab === "study" && <AdminStudySection />}
    </main>
  );
}

export default Admin;
