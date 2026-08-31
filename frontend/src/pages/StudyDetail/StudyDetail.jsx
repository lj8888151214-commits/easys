import "./StudyDetail.css";

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";


function StudyDetail() {

  const { id } = useParams();

  const navigate = useNavigate();


  // =====================================================
  // 상태
  // =====================================================

  const [study, setStudy] = useState(null);

  const [currentUser, setCurrentUser] =
    useState(null);

  const [myApplication, setMyApplication] =
    useState(null);

  const [applications, setApplications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [applicationLoading, setApplicationLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // =====================================================
  // 실시간 채팅 관련 상태
  // =====================================================
  const socketRef = useRef(null);
  const myIdRef = useRef("");
  const chatContainerRef = useRef(null);
  const [messages, setMessages] = useState([
    { id: 1, text: "스터디 그룹 채팅방에 입장했습니다.", isSystem: true }
  ]);
  const [inputMessage, setInputMessage] = useState("");


  // =====================================================
  // 응답 처리
  // =====================================================

  async function readResponse(response) {

    const contentType =
      response.headers.get("content-type") || "";


    if (
      contentType.includes("application/json")
    ) {

      return await response.json();
    }


    const text =
      await response.text();


    throw new Error(
      text ||
      "서버 응답을 읽을 수 없습니다."
    );
  }


  // =====================================================
  // 스터디 조회
  // =====================================================

  async function fetchStudy() {

    const response =
      await fetch(
        `/api/study/${id}`,
        {
          credentials: "include"
        }
      );


    if (!response.ok) {

      throw new Error(
        "스터디 정보를 불러오지 못했습니다."
      );
    }


    return await readResponse(
      response
    );
  }


  // =====================================================
  // 현재 로그인 사용자
  // =====================================================

  async function fetchCurrentUser() {

    try {

      const response =
        await fetch(
          "/api/member/me",
          {
            credentials: "include"
          }
        );


      if (!response.ok) {

        setCurrentUser(null);

        return null;
      }


      const data =
        await readResponse(
          response
        );


      setCurrentUser(data);

      return data;


    } catch {

      setCurrentUser(null);

      return null;
    }
  }


  // =====================================================
  // 내가 신청한 스터디
  // =====================================================

  async function fetchMyApplication() {

    try {

      const response =
        await fetch(
          "/api/study/my-applications",
          {
            credentials: "include"
          }
        );


      if (!response.ok) {

        setMyApplication(null);

        return;
      }


      const data =
        await readResponse(
          response
        );


      const application =
        Array.isArray(data)
          ? data.find(
              (item) =>
                Number(item.studyId) ===
                Number(id)
            )
          : null;


      setMyApplication(
        application || null
      );


    } catch {

      setMyApplication(null);
    }
  }


  // =====================================================
  // 방장용 신청자 목록
  // =====================================================

  async function fetchApplications() {

    try {

      const response =
        await fetch(
          `/api/study/${id}/applications`,
          {
            credentials: "include"
          }
        );


      if (!response.ok) {

        setApplications([]);

        return;
      }


      const data =
        await readResponse(
          response
        );


      setApplications(
        Array.isArray(data)
          ? data
          : []
      );


    } catch (error) {

      console.error(
        "신청자 조회 오류:",
        error
      );

      setApplications([]);
    }
  }


  // =====================================================
  // 페이지 초기화
  // =====================================================

  useEffect(() => {

    async function loadPage() {

      try {

        setLoading(true);

        setError("");


        const [
          studyData,
          user
        ] = await Promise.all([
          fetchStudy(),
          fetchCurrentUser()
        ]);


        setStudy(studyData);


        if (user) {

          await fetchMyApplication();


          if (
            user.id &&
            studyData.memberId &&
            Number(user.id) ===
              Number(studyData.memberId)
          ) {

            await fetchApplications();
          }
        }


      } catch (error) {

        console.error(
          "스터디 상세 조회 오류:",
          error
        );


        setError(
          error.message ||
          "스터디 정보를 불러오지 못했습니다."
        );


      } finally {

        setLoading(false);
      }
    }


    loadPage();

  }, [id]);


  // =====================================================
  // 🌟 채팅창 노출 조건 판별
  // =====================================================
  const isParticipantOrOwner = isOwner() || myApplication?.status === "APPROVED";
  const currentMembersCount = Number(study?.currentMembers || 0);
  const showChat = isParticipantOrOwner && currentMembersCount >= 2;


  // =====================================================
  // 🌟 실시간 웹소켓 채팅 연결 (CamPage와 동일한 안정적 수신 구조)
  // =====================================================
  useEffect(() => {
    if (!showChat) return;

    const hostname = window.location.hostname;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${hostname}:8080/signal`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    const sendJoin = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "join",
          nickname: currentUser?.nickname || "참가자"
        }));
      }
    };

    ws.onopen = () => {
      sendJoin();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "init") {
          myIdRef.current = data.myId;
          sendJoin();
        } else if (data.type === "chat") {
          const isMine = String(data.senderId) === String(myIdRef.current);

          setMessages((prev) => {
            // 중복 방지 필터 (최근 3개 메시지 내역 대조)
            const isDuplicate = prev.slice(-3).some(
              (m) => m.text === data.text && m.nickname === data.nickname && m.time === data.time
            );

            if (isDuplicate) {
              return prev;
            }

            return [
              ...prev,
              {
                id: Date.now() + Math.random(),
                nickname: data.nickname,
                text: data.text,
                time: data.time,
                isSystem: data.isSystem || false,
                isMe: isMine
              }
            ];
          });
        }
      } catch (e) {}
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [showChat, currentUser]);


  const handleSendMessage = (e) => {
      e.preventDefault();
      if (!inputMessage.trim()) return;

      const currentText = inputMessage.trim();
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      const msgData = {
        type: "chat",
        senderId: myIdRef.current,
        nickname: currentUser?.nickname || "참가자",
        text: currentText,
        time: timeStr
      };

      // 1. 서버로 전송 (상대방 화면에 전달됨)
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(msgData));
      }

      // 2. 🌟 내 화면에도 즉시 추가 (내 화면 누락 방지)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          nickname: currentUser?.nickname || "참가자",
          text: currentText,
          time: timeStr,
          isSystem: false,
          isMe: true // 내 메시지로 지정하여 오른쪽에 배치
        }
      ]);

      setInputMessage("");
    };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);


  // =====================================================
  // 참여 신청 및 관리 함수들
  // =====================================================

  async function handleApply() {
    if (!currentUser) {
      alert("로그인이 필요한 기능입니다.");
      navigate("/login");
      return;
    }
    if (isOwner()) {
      alert("스터디 방장은 신청할 수 없습니다.");
      return;
    }
    if (study.status === "CLOSED") {
      alert("모집이 종료된 스터디입니다.");
      return;
    }
    if (myApplication) {
      alert("이미 신청한 스터디입니다.");
      return;
    }

    try {
      setApplicationLoading(true);
      const response = await fetch(`/api/study/${id}/apply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });
      const data = await readResponse(response);
      if (!response.ok) {
        throw new Error(data?.message || "스터디 참여 신청에 실패했습니다.");
      }
      setMyApplication(data);
      alert("스터디 참여 신청이 완료되었습니다.");
    } catch (error) {
      alert(error.message || "참여 신청에 실패했습니다.");
    } finally {
      setApplicationLoading(false);
    }
  }

  async function handleApprove(applicationId) {
    if (!window.confirm("이 신청을 승인하시겠습니까?")) return;

    try {
      setApplicationLoading(true);
      const response = await fetch(`/api/study/applications/${applicationId}/approve`, {
        method: "PUT",
        credentials: "include"
      });
      const data = await readResponse(response);
      if (!response.ok) {
        throw new Error(data?.message || "승인에 실패했습니다.");
      }
      await fetchApplications();
      const updatedStudy = await fetchStudy();
      setStudy(updatedStudy);
      alert("신청을 승인했습니다.");
    } catch (error) {
      alert(error.message || "신청 승인에 실패했습니다.");
    } finally {
      setApplicationLoading(false);
    }
  }

  async function handleReject(applicationId) {
    if (!window.confirm("이 신청을 거절하시겠습니까?")) return;

    try {
      setApplicationLoading(true);
      const response = await fetch(`/api/study/applications/${applicationId}/reject`, {
        method: "PUT",
        credentials: "include"
      });
      const data = await readResponse(response);
      if (!response.ok) {
        throw new Error(data?.message || "거절에 실패했습니다.");
      }
      await fetchApplications();
      alert("신청을 거절했습니다.");
    } catch (error) {
      alert(error.message || "신청 거절에 실패했습니다.");
    } finally {
      setApplicationLoading(false);
    }
  }

  async function handleCancelApplication() {
    if (!myApplication) return;
    if (!window.confirm("스터디 참여 신청을 취소하시겠습니까?")) return;

    try {
      setApplicationLoading(true);
      const response = await fetch(`/api/study/applications/${myApplication.id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) {
        const data = await readResponse(response);
        throw new Error(data?.message || "신청 취소에 실패했습니다.");
      }
      setMyApplication(null);
      alert("신청이 취소되었습니다.");
    } catch (error) {
      alert(error.message || "신청 취소에 실패했습니다.");
    } finally {
      setApplicationLoading(false);
    }
  }

  async function handleLeaveStudy() {
    if (!window.confirm("정말 스터디에서 탈퇴하시겠습니까?")) return;

    try {
      setApplicationLoading(true);
      const response = await fetch(`/api/study/${id}/leave`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) {
        const data = await readResponse(response);
        throw new Error(data?.message || "스터디 탈퇴에 실패했습니다.");
      }
      alert("스터디에서 탈퇴했습니다.");
      navigate("/study");
    } catch (error) {
      alert(error.message || "스터디 탈퇴에 실패했습니다.");
    } finally {
      setApplicationLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("정말 이 스터디를 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/study/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) {
        const data = await readResponse(response);
        throw new Error(data?.message || "스터디 삭제에 실패했습니다.");
      }
      alert("스터디가 삭제되었습니다.");
      navigate("/study");
    } catch (error) {
      alert(error.message || "스터디 삭제에 실패했습니다.");
    }
  }

  function isOwner() {
    return (
      currentUser &&
      study &&
      currentUser.id &&
      study.memberId &&
      Number(currentUser.id) === Number(study.memberId)
    );
  }


  if (loading) {
    return (
      <div className="study-detail-page">
        <div className="study-detail-loading">
          <div className="study-detail-spinner" />
          <p>스터디 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !study) {
    return (
      <div className="study-detail-page">
        <div className="study-detail-error">
          <h2>스터디를 찾을 수 없습니다.</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/study")}>스터디 목록으로</button>
        </div>
      </div>
    );
  }

  const currentMembers = Number(study.currentMembers || 0);
  const maxMembers = Number(study.maxMembers || 0);
  const progress = maxMembers > 0 ? Math.min(100, Math.round((currentMembers / maxMembers) * 100)) : 0;


  return (

    <main className="study-detail-page">

      <div className="study-detail-container">

        {/* 뒤로가기 */}
        <button
          className="study-detail-back"
          onClick={() => navigate("/study")}
        >
          ← 스터디 목록
        </button>


        {/* =================================================
            헤더
        ================================================= */}
        <section className="study-detail-header">
          <div>
            <div className="study-detail-badges">
              <span className="study-detail-category">{study.category}</span>
              <span className={`study-detail-status ${study.status === "CLOSED" ? "closed" : "recruiting"}`}>
                {study.status === "CLOSED" ? "모집완료" : "모집중"}
              </span>
            </div>

            <h1>{study.title}</h1>

            <p className="study-detail-author">
              작성자 <strong>{study.nickname}</strong>
            </p>
          </div>

          {isOwner() && (
            <div className="study-detail-owner-buttons">
              <button onClick={() => navigate(`/study/${id}/edit`)}>수정</button>
              <button className="danger" onClick={handleDelete}>삭제</button>
            </div>
          )}
        </section>


        {/* =================================================
            기본 정보
        ================================================= */}
        <section className="study-detail-info">
          <div>
            <span>모집 인원</span>
            <strong>{currentMembers} / {maxMembers}명</strong>
          </div>
          <div>
            <span>모집 상태</span>
            <strong>{study.status === "CLOSED" ? "모집완료" : "모집중"}</strong>
          </div>
          <div>
            <span>분야</span>
            <strong>{study.category}</strong>
          </div>
        </section>


        {/* =================================================
            진행률
        ================================================= */}
        <section className="study-detail-progress">
          <div className="study-detail-progress-title">
            <span>모집 현황</span>
            <strong>{progress}%</strong>
          </div>
          <div className="study-detail-progress-bar">
            <div style={{ width: `${progress}%` }} />
          </div>
        </section>


        {/* =================================================
            🌟 [6:4 그리드 레이아웃 시작]
        ================================================= */}
        <div className={`study-detail-grid-layout ${showChat ? "with-chat" : ""}`}>

          {/* 왼쪽: 스터디 소개 섹션 (비율 6) */}
          <div className="study-detail-main-section">

            {/* 내용 (스터디 소개) */}
            <section className="study-detail-content" style={{ marginTop: 0 }}>
              <span className="study-detail-label">ABOUT THIS STUDY</span>
              <h2>스터디 소개</h2>
              <p>{study.content}</p>
              <small>
                작성일 {study.createdAt ? new Date(study.createdAt).toLocaleString("ko-KR") : "-"}
              </small>
            </section>

          </div>


          {/* =================================================
              오른쪽: 실시간 채팅창 래퍼 (비율 4)
          ================================================= */}
          <div className="study-detail-chat-wrapper">
            <div className="cam-chat-panel" style={{ width: "100%", height: "100%", minHeight: "420px", display: "flex", flexDirection: "column", background: "#fff", border: "1px solid #e1e7e2", borderRadius: "20px", overflow: "hidden", boxShadow: "0 8px 30px rgba(0, 0, 0, 0.04)" }}>
              <div className="chat-header" style={{ padding: "16px 20px", background: "#17191c", color: "#fff", fontSize: "14px", fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>💬 스터디 실시간 채팅</span>
                <span style={{ fontSize: "11px", background: "rgba(46, 213, 115, 0.2)", color: "#2ed573", padding: "3px 10px", borderRadius: "20px", border: "1px solid #2ed573", fontWeight: "600" }}>
                  ● {currentMembersCount}명 참여중
                </span>
              </div>

              <div className="chat-messages-container" ref={chatContainerRef} style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", background: "#f8faf8" }}>
                {messages.map((msg) => (
                  <div key={msg.id} className={`chat-bubble-row ${msg.isSystem ? "system" : msg.isMe ? "me" : "other"}`} style={{ display: "flex", flexDirection: "column", alignItems: msg.isMe ? "flex-end" : "flex-start" }}>
                    {msg.isSystem ? (
                      <span className="chat-system-msg" style={{ fontSize: "11px", color: "#17191c", background: "#edf0f3", border: "1px solid #ddd", padding: "4px 10px", borderRadius: "14px", alignSelf: "center", fontWeight: "600" }}>{msg.text}</span>
                    ) : (
                      <>
                        <span style={{ fontSize: "11px", color: "#777", marginBottom: "3px" }}>{msg.nickname || "게스트"}</span>
                        <div className="chat-bubble" style={{ maxWidth: "85%", padding: "8px 12px", borderRadius: "12px", fontSize: "13px", wordBreak: "break-word", backgroundColor: msg.isMe ? "#17191c" : "#ffffff", color: msg.isMe ? "#ffffff" : "#222", border: msg.isMe ? "none" : "1px solid #e2e8e2" }}>
                          {msg.text}
                        </div>
                        <span style={{ fontSize: "10px", color: "#999", marginTop: "2px" }}>{msg.time}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <form className="chat-input-form" onSubmit={handleSendMessage} style={{ display: "flex", gap: "8px", background: "#fff", borderTop: "1px solid #eee", padding: "12px 16px", alignItems: "center" }}>
                <input
                  type="text"
                  className="chat-text-input"
                  placeholder="메시지를 입력하세요..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  style={{ flex: "1", border: "1px solid #ddd", borderRadius: "10px", outline: "none", fontSize: "13px", padding: "9px 14px", background: "#f9fafb" }}
                />
                <button type="submit" className="chat-send-btn" style={{ padding: "9px 18px", borderRadius: "10px", border: "none", background: "#17191c", color: "white", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>전송</button>
              </form>
            </div>
          </div>

        </div>


        {/* =================================================
            하단 영역 (일반 회원 신청/탈퇴 및 방장 신청 관리 박스)
        ================================================= */}

        {/* 일반 회원 영역 (참여 신청 / 취소 / 탈퇴) */}
        {!isOwner() && (
          <section className="study-detail-join">
            <div>
              <span>
                {myApplication?.status === "APPROVED"
                  ? "현재 참여 중인 스터디입니다."
                  : myApplication?.status === "PENDING"
                    ? "스터디장의 승인을 기다리고 있습니다."
                    : myApplication?.status === "REJECTED"
                      ? "참여 신청이 거절되었습니다."
                      : "함께 공부할 사람을 찾고 있나요?"}
              </span>
              <strong>
                {myApplication?.status === "APPROVED"
                  ? "스터디 활동을 시작해보세요."
                  : myApplication?.status === "PENDING"
                    ? "승인이 완료되면 스터디에 참여할 수 있습니다."
                    : "이 스터디에 참여해보세요."}
              </strong>
            </div>

            <div className="study-detail-join-buttons">
              {!myApplication && (
                <button
                  onClick={handleApply}
                  disabled={applicationLoading || study.status === "CLOSED"}
                >
                  {applicationLoading
                    ? "신청 중..."
                    : study.status === "CLOSED"
                      ? "모집 완료"
                      : "스터디 참여 신청"}
                </button>
              )}

              {myApplication?.status === "PENDING" && (
                <button
                  className="outline"
                  onClick={handleCancelApplication}
                  disabled={applicationLoading}
                >
                  신청 취소
                </button>
              )}

              {myApplication?.status === "APPROVED" && (
                <button
                  className="outline danger-text"
                  onClick={handleLeaveStudy}
                  disabled={applicationLoading}
                >
                  스터디 탈퇴
                </button>
              )}
            </div>
          </section>
        )}


        {/* 방장 신청자 관리 섹션 */}
        {isOwner() && (
          <section className="study-applications">
            <div className="study-applications-header">
              <div>
                <span>STUDY MANAGEMENT</span>
                <h2>참여 신청 관리</h2>
                <p>스터디에 참여 신청한 회원을 관리할 수 있습니다.</p>
              </div>
              <div className="study-application-count">
                <strong>{applications.length}</strong>
                <span>신청</span>
              </div>
            </div>

            {applications.length === 0 ? (
              <div className="study-applications-empty">
                <div>👥</div>
                <h3>아직 참여 신청자가 없습니다.</h3>
                <p>새로운 신청자가 생기면 이곳에서 확인할 수 있습니다.</p>
              </div>
            ) : (
              <div className="study-application-list">
                {applications.map((application) => (
                  <div className="study-application-item" key={application.id}>
                    <div className="study-application-user">
                      <div className="study-application-avatar">
                        {application.nickname?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <strong>{application.nickname}</strong>
                        <span>
                          신청일{" "}
                          {application.createdAt ? new Date(application.createdAt).toLocaleDateString("ko-KR") : "-"}
                        </span>
                      </div>
                    </div>

                    <div className="study-application-right">
                      <span className={`application-status ${application.status.toLowerCase()}`}>
                        {application.status === "PENDING" && "승인 대기"}
                        {application.status === "APPROVED" && "승인 완료"}
                        {application.status === "REJECTED" && "거절됨"}
                      </span>

                      {application.status === "PENDING" && (
                        <div className="application-buttons">
                          <button
                            className="approve"
                            onClick={() => handleApprove(application.id)}
                            disabled={applicationLoading}
                          >
                            승인
                          </button>
                          <button
                            className="reject"
                            onClick={() => handleReject(application.id)}
                            disabled={applicationLoading}
                          >
                            거절
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>

    </main>
  );
}


export default StudyDetail;