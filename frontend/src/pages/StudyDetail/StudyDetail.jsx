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

  const [studyReservations, setStudyReservations] =
    useState([]);

  // 채팅창 크게 보기 (스터디 소개를 숨기고 채팅창을 확대)
  const [chatExpanded, setChatExpanded] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [applicationLoading, setApplicationLoading] =
    useState(false);

  // 스터디 탈퇴 확인 팝업 표시 여부
  const [showLeaveConfirm, setShowLeaveConfirm] =
    useState(false);

  const [error, setError] =
    useState("");

  // =====================================================
  // 실시간 채팅 관련 상태
  // =====================================================
  const socketRef = useRef(null);
  const myIdRef = useRef("");
  const chatContainerRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [completing, setCompleting] = useState(false);


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

      return application || null;

    } catch {

      setMyApplication(null);

      return null;
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
  // 스터디룸 예약 여부 (방장만 사용)
  // =====================================================

  // 예약 이용 종료 시각이 이미 지났는지 확인 (지난 예약은 카드에서 자동으로 숨긴다)
  function isReservationEnded(reservation) {

    if (!reservation.reservationDate || !reservation.endTime) {
      return false;
    }

    const endAt = new Date(
      `${reservation.reservationDate}T${reservation.endTime}`
    );

    return endAt.getTime() <= Date.now();
  }

  // 방장이 예약한 스터디룸을 다른 팀원들도 볼 수 있도록, 내 예약만이 아니라
  // 이 스터디의 예약 전체를 조회한다 (방장/승인된 참여자만 접근 가능, 서버에서 검증).
  async function fetchMyReservationForStudy() {

    try {

      const response = await fetch(
        `/api/reservations/study/${id}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        setStudyReservations([]);
        return;
      }

      const data = await readResponse(response);

      const reservations =
        Array.isArray(data)
          ? data.filter(
              (item) =>
                item.status !== "CANCELLED" &&
                !isReservationEnded(item)
            )
          : [];

      setStudyReservations(reservations);

    } catch {
      setStudyReservations([]);
    }
  }


  // =====================================================
  // 이용 시간이 지난 예약 카드 자동 숨김
  //
  // 새로고침 없이도 페이지를 보고 있는 동안 이용 종료 시각이
  // 지나면 목록에서 사라지도록 1분마다 다시 걸러낸다.
  // =====================================================

  useEffect(() => {

    const timer = setInterval(() => {

      setStudyReservations((prev) =>
        prev.filter((reservation) => !isReservationEnded(reservation))
      );

    }, 60 * 1000);

    return () => clearInterval(timer);

  }, []);


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

          const myApp = await fetchMyApplication();

          const isOwnerUser =
            user.id &&
            studyData.memberId &&
            Number(user.id) ===
              Number(studyData.memberId);


          if (isOwnerUser) {

            await fetchApplications();
          }

          // 방장이 예약한 스터디룸은 방장뿐 아니라 승인된 참여자도 볼 수 있다.
          if (isOwnerUser || myApp?.status === "APPROVED") {

            await fetchMyReservationForStudy();
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
  // 채팅 시간 표시 형식
  // =====================================================
  function formatChatTime(dateTime) {
    if (!dateTime) return "";
    const date = new Date(dateTime);
    if (Number.isNaN(date.getTime())) return "";
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function toMessageItem(dto, myId) {
    return {
      id: dto.id,
      memberId: dto.memberId,
      nickname: dto.nickname,
      profileImageUrl: dto.profileImageUrl,
      text: dto.content,
      time: formatChatTime(dto.createdAt),
      isSystem: false,
      isMe: myId != null && Number(myId) === Number(dto.memberId)
    };
  }

  // =====================================================
  // 채팅 기록 조회 (DB 저장분) - 새로고침/재입장해도 유지된다
  // =====================================================
  async function loadChatHistory() {
    try {
      const response = await fetch(`/api/study/${id}/chat/messages`, {
        credentials: "include"
      });

      if (!response.ok) return;

      const data = await readResponse(response);

      setMessages(
        Array.isArray(data)
          ? data.map((item) => toMessageItem(item, currentUser?.id))
          : []
      );
    } catch (error) {
      console.error("채팅 기록 조회 오류:", error);
    }
  }

  useEffect(() => {
    if (!showChat) return;
    loadChatHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showChat, id, currentUser?.id]);


  // =====================================================
  // 🌟 실시간 웹소켓 채팅 연결 (CamPage와 동일한 안정적 수신 구조)
  //
  // roomId를 study-{id}로 지정해 스터디별로 방을 분리한다(기존에는 roomId를
  // 지정하지 않아 모든 스터디/스트리밍 세션이 같은 "default-room"을 공유했다).
  // 백엔드(WebSocketConfig)는 이 roomId에 대해 방장/승인된 참여자인지 다시
  // 검증하므로, 여기서는 화면 노출 조건(showChat)만 맞으면 연결을 시도한다.
  // =====================================================
  useEffect(() => {
    if (!showChat) return;

    const hostname = window.location.hostname;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${hostname}:8080/signal?roomId=study-${id}`;
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
            // DB에 저장된 메시지 id 기준으로 중복(본인이 보낸 메시지가 다시 돌아오는 경우 등)을 걸러낸다.
            if (data.messageId != null && prev.some((m) => m.id === data.messageId)) {
              return prev;
            }

            return [
              ...prev,
              {
                id: data.messageId ?? `${Date.now()}-${Math.random()}`,
                nickname: data.nickname,
                profileImageUrl: data.profileImageUrl,
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
  }, [showChat, currentUser, id]);


  const handleSendMessage = async (e) => {
      e.preventDefault();
      const content = inputMessage.trim();
      if (!content) return;

      setInputMessage("");

      try {
        const response = await fetch(`/api/study/${id}/chat/messages`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content })
        });

        const data = await readResponse(response);

        if (!response.ok) {
          throw new Error(data?.message || "메시지 전송에 실패했습니다.");
        }

        // 1. 내 화면에 즉시 추가 (서버가 저장한 값 그대로 사용 - 작성자/시간 위조 불가)
        setMessages((prev) => [...prev, toMessageItem(data, currentUser?.id)]);

        // 2. 다른 참여자들에게 실시간 중계 (저장은 이미 위 REST 호출에서 끝났다)
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: "chat",
            senderId: myIdRef.current,
            nickname: data.nickname,
            profileImageUrl: data.profileImageUrl,
            text: data.content,
            time: formatChatTime(data.createdAt),
            messageId: data.id
          }));
        }
      } catch (error) {
        alert(error.message || "메시지 전송에 실패했습니다.");
        setInputMessage(content);
      }
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

  async function confirmLeaveStudy() {
    setShowLeaveConfirm(false);

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

  function getStudyStatusLabel(status) {
    if (status === "COMPLETED") return "완료";
    if (status === "CLOSED") return "모집완료";
    return "모집중";
  }

  async function handleCompleteStudy() {
    if (!window.confirm("스터디를 완료 처리하시겠습니까? 완료 후에는 진행 중인 스터디 목록에서 사라집니다.")) return;

    try {
      setCompleting(true);
      const response = await fetch(`/api/study/${id}/complete`, {
        method: "PUT",
        credentials: "include"
      });
      const data = await readResponse(response);
      if (!response.ok) {
        throw new Error(data?.message || "스터디 완료 처리에 실패했습니다.");
      }
      setStudy(data);
      alert("스터디가 완료 처리되었습니다.");
    } catch (error) {
      alert(error.message || "스터디 완료 처리에 실패했습니다.");
    } finally {
      setCompleting(false);
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
          ←
        </button>


        {/* =================================================
            헤더
        ================================================= */}
        <section className="study-detail-header">
          <div>
            <div className="study-detail-badges">
              <span className="study-detail-category">{study.category}</span>
              <span className={`study-detail-status ${study.status === "RECRUITING" ? "recruiting" : "closed"}`}>
                {getStudyStatusLabel(study.status)}
              </span>
            </div>

            <h1>{study.title}</h1>

            <p className="study-detail-author">
              작성자 <strong>{study.nickname}</strong>
            </p>
          </div>

          {isOwner() && (
            <div className="study-detail-owner-buttons">
              {study.status !== "COMPLETED" && (
                <button
                  onClick={handleCompleteStudy}
                  disabled={completing}
                >
                  {completing ? "처리 중..." : "스터디 완료"}
                </button>
              )}
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
            <strong>{getStudyStatusLabel(study.status)}</strong>
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
            스터디룸 예약 (방장은 예약/결제, 승인된 참여자는 조회만 가능)
        ================================================= */}
        {(isOwner() || myApplication?.status === "APPROVED") && (
          <section className="study-detail-reservation">

            <div className="study-detail-reservation-title">
              <span className="study-detail-reservation-icon">📅</span>
              <div>
                <strong>스터디룸 예약</strong>
                <small>
                  {isOwner()
                    ? "정해진 일정에 맞는 스터디룸을 예약하고 결제해보세요."
                    : "방장이 예약한 스터디룸 일정이에요."}
                </small>
              </div>
            </div>

            {studyReservations.length > 0 ? (
              <ul className="study-detail-reservation-list">
                {studyReservations.map((reservation) => {

                  const statusLabel =
                    reservation.status === "PENDING" ? "결제 대기"
                    : reservation.status === "PAID" ? "결제 완료"
                    : reservation.status === "CONFIRMED" ? "예약 확정"
                    : reservation.status;

                  const statusClass =
                    reservation.status === "PENDING" ? "pending"
                    : reservation.status === "PAID" ? "paid"
                    : reservation.status === "CONFIRMED" ? "confirmed"
                    : "";

                  return (
                    <li key={reservation.id}>
                      <div className="study-detail-reservation-info">
                        <strong>{reservation.studyRoomName}</strong>
                        <span className="study-detail-reservation-time">
                          {reservation.reservationDate} · {reservation.startTime?.slice(0, 5)} ~{" "}
                          {reservation.endTime?.slice(0, 5)}
                        </span>
                      </div>

                      <div className="study-detail-reservation-actions">
                        <span className={`study-detail-reservation-status ${statusClass}`}>
                          {statusLabel}
                        </span>
                        {isOwner() && reservation.status === "PENDING" && (
                          <button onClick={() => navigate(`/payment?type=study&id=${reservation.id}`)}>
                            결제 이어하기
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="study-detail-reservation-empty">
                아직 예약된 스터디룸이 없어요.
              </p>
            )}

            {isOwner() && (
              <div className="study-detail-reservation-new">
                <button
                  type="button"
                  className="study-detail-reservation-new-button"
                  onClick={() => navigate(`/study-reservation?studyId=${id}`)}
                >
                  <span className="study-detail-reservation-new-plus">+</span>
                  새로 예약하기
                </button>
              </div>
            )}

          </section>
        )}


        {/* =================================================
            🌟 [6:4 그리드 레이아웃 시작]
        ================================================= */}
        <div
          className={`study-detail-grid-layout ${showChat ? "with-chat" : ""} ${
            chatExpanded ? "chat-expanded" : ""
          }`}
        >

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
            <div className="cam-chat-panel" style={{ width: "100%", height: "100%", minHeight: "420px", display: "flex", flexDirection: "column", background: "#fff", border: "1px solid #e1e7e2", borderRadius: "20px", overflow: "hidden", boxShadow: "0 8px 30px rgba(30, 50, 38, 0.04)" }}>
              <div className="chat-header" style={{ padding: "16px 20px", background: "#243329", color: "#fff", fontSize: "14px", fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>💬 스터디 실시간 채팅</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", background: "rgba(46, 213, 115, 0.2)", color: "#a3f7bf", padding: "3px 10px", borderRadius: "20px", border: "1px solid #3f7653", fontWeight: "600" }}>
                    ● {currentMembersCount}명 참여중
                  </span>
                  <button
                    type="button"
                    onClick={() => setChatExpanded((prev) => !prev)}
                    style={{ fontSize: "11px", background: "rgba(255, 255, 255, 0.12)", color: "#fff", padding: "5px 10px", borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.3)", fontWeight: "600", cursor: "pointer" }}
                  >
                    {chatExpanded ? "⤡ 축소" : "⤢ 크게 보기"}
                  </button>
                </div>
              </div>

              <div className="chat-messages-container" ref={chatContainerRef} style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", background: "#f8faf8" }}>
                {messages.length === 0 && (
                  <span className="chat-system-msg" style={{ fontSize: "11px", color: "#243329", background: "#eef3ef", border: "1px solid #dce5de", padding: "4px 10px", borderRadius: "14px", alignSelf: "center", fontWeight: "600" }}>
                    스터디 그룹 채팅방에 입장했습니다.
                  </span>
                )}

                {messages.map((msg) => (
                  <div key={msg.id} className={`chat-bubble-row ${msg.isSystem ? "system" : msg.isMe ? "me" : "other"}`} style={{ display: "flex", flexDirection: msg.isMe ? "row-reverse" : "row", alignItems: "flex-end", gap: "8px" }}>
                    {msg.isSystem ? (
                      <span className="chat-system-msg" style={{ fontSize: "11px", color: "#243329", background: "#eef3ef", border: "1px solid #dce5de", padding: "4px 10px", borderRadius: "14px", alignSelf: "center", fontWeight: "600" }}>{msg.text}</span>
                    ) : (
                      <>
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "#eef3ef", color: "#3f7653", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800" }}>
                          {msg.profileImageUrl ? (
                            <img
                              src={`/api${msg.profileImageUrl}`}
                              alt={msg.nickname}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            (msg.nickname || "게").charAt(0).toUpperCase()
                          )}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: msg.isMe ? "flex-end" : "flex-start", maxWidth: "78%" }}>
                          <span style={{ fontSize: "11px", color: "#777", marginBottom: "3px" }}>{msg.nickname || "게스트"}</span>
                          <div className="chat-bubble" style={{ maxWidth: "100%", padding: "8px 12px", borderRadius: "12px", fontSize: "13px", wordBreak: "break-word", backgroundColor: msg.isMe ? "#243329" : "#ffffff", color: msg.isMe ? "#ffffff" : "#222", border: msg.isMe ? "none" : "1px solid #e2e8e2" }}>
                            {msg.text}
                          </div>
                          <span style={{ fontSize: "10px", color: "#999", marginTop: "2px" }}>{msg.time}</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <form className="study-detail-chat-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  className="study-detail-chat-text-input"
                  placeholder="메시지를 입력하세요..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                />
                <button type="submit" className="study-detail-chat-send-btn">전송</button>
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
                  onClick={() => setShowLeaveConfirm(true)}
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
                        {application.profileImageUrl ? (
                          <img
                            src={`/api${application.profileImageUrl}`}
                            alt={application.nickname}
                          />
                        ) : (
                          application.nickname?.charAt(0)?.toUpperCase()
                        )}
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


        {/* =================================================
            스터디 탈퇴 확인 팝업
        ================================================= */}
        {showLeaveConfirm && (
          <div
            className="study-leave-confirm-overlay"
            onClick={() => setShowLeaveConfirm(false)}
          >
            <div
              className="study-leave-confirm-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="study-leave-confirm-icon">⚠️</span>

              <h3>정말 탈퇴하시겠습니까?</h3>

              <p>
                탈퇴하면 이 스터디의 채팅과 참여 정보에서 제외되며,
                다시 참여하려면 신청을 새로 해야 해요.
              </p>

              <div className="study-leave-confirm-buttons">
                <button
                  type="button"
                  className="study-leave-confirm-cancel"
                  onClick={() => setShowLeaveConfirm(false)}
                >
                  취소
                </button>

                <button
                  type="button"
                  className="study-leave-confirm-submit"
                  onClick={confirmLeaveStudy}
                  disabled={applicationLoading}
                >
                  {applicationLoading ? "탈퇴 처리 중..." : "탈퇴할게요"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </main>
  );
}


export default StudyDetail;