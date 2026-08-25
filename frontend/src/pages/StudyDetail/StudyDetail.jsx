import "./StudyDetail.css";

import { useEffect, useState } from "react";
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


        // 로그인 상태에서만
        // 신청 정보 확인
        if (user) {

          await fetchMyApplication();


          // 방장이면 신청자 목록 확인
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
  // 참여 신청
  // =====================================================

  async function handleApply() {

    if (!currentUser) {

      alert(
        "로그인이 필요한 기능입니다."
      );

      navigate("/login");

      return;
    }


    if (isOwner()) {

      alert(
        "스터디 방장은 신청할 수 없습니다."
      );

      return;
    }


    if (
      study.status ===
      "CLOSED"
    ) {

      alert(
        "모집이 종료된 스터디입니다."
      );

      return;
    }


    if (
      myApplication
    ) {

      alert(
        "이미 신청한 스터디입니다."
      );

      return;
    }


    try {

      setApplicationLoading(
        true
      );


      const response =
        await fetch(
          `/api/study/${id}/apply`,
          {
            method: "POST",

            credentials: "include",

            headers: {
              "Content-Type":
                "application/json"
            }
          }
        );


      const data =
        await readResponse(
          response
        );


      if (!response.ok) {

        throw new Error(
          data?.message ||
          "스터디 참여 신청에 실패했습니다."
        );
      }


      setMyApplication(
        data
      );


      alert(
        "스터디 참여 신청이 완료되었습니다."
      );


    } catch (error) {

      console.error(
        "참여 신청 오류:",
        error
      );


      alert(
        error.message ||
        "참여 신청에 실패했습니다."
      );


    } finally {

      setApplicationLoading(
        false
      );
    }
  }


  // =====================================================
  // 신청 승인
  // =====================================================

  async function handleApprove(
    applicationId
  ) {

    const confirmed =
      window.confirm(
        "이 신청을 승인하시겠습니까?"
      );


    if (!confirmed) {

      return;
    }


    try {

      setApplicationLoading(
        true
      );


      const response =
        await fetch(
          `/api/study/applications/${applicationId}/approve`,
          {
            method: "PUT",

            credentials: "include"
          }
        );


      const data =
        await readResponse(
          response
        );


      if (!response.ok) {

        throw new Error(
          data?.message ||
          "승인에 실패했습니다."
        );
      }


      // 신청자 목록 다시 조회
      await fetchApplications();


      // 스터디 정보 다시 조회
      const updatedStudy =
        await fetchStudy();


      setStudy(
        updatedStudy
      );


      alert(
        "신청을 승인했습니다."
      );


    } catch (error) {

      console.error(
        "신청 승인 오류:",
        error
      );


      alert(
        error.message ||
        "신청 승인에 실패했습니다."
      );


    } finally {

      setApplicationLoading(
        false
      );
    }
  }


  // =====================================================
  // 신청 거절
  // =====================================================

  async function handleReject(
    applicationId
  ) {

    const confirmed =
      window.confirm(
        "이 신청을 거절하시겠습니까?"
      );


    if (!confirmed) {

      return;
    }


    try {

      setApplicationLoading(
        true
      );


      const response =
        await fetch(
          `/api/study/applications/${applicationId}/reject`,
          {
            method: "PUT",

            credentials: "include"
          }
        );


      const data =
        await readResponse(
          response
        );


      if (!response.ok) {

        throw new Error(
          data?.message ||
          "거절에 실패했습니다."
        );
      }


      await fetchApplications();


      alert(
        "신청을 거절했습니다."
      );


    } catch (error) {

      console.error(
        "신청 거절 오류:",
        error
      );


      alert(
        error.message ||
        "신청 거절에 실패했습니다."
      );


    } finally {

      setApplicationLoading(
        false
      );
    }
  }


  // =====================================================
  // 신청 취소
  // =====================================================

  async function handleCancelApplication() {

    if (!myApplication) {

      return;
    }


    const confirmed =
      window.confirm(
        "스터디 참여 신청을 취소하시겠습니까?"
      );


    if (!confirmed) {

      return;
    }


    try {

      setApplicationLoading(
        true
      );


      const response =
        await fetch(
          `/api/study/applications/${myApplication.id}`,
          {
            method: "DELETE",

            credentials: "include"
          }
        );


      if (!response.ok) {

        const data =
          await readResponse(
            response
          );


        throw new Error(
          data?.message ||
          "신청 취소에 실패했습니다."
        );
      }


      setMyApplication(
        null
      );


      alert(
        "신청이 취소되었습니다."
      );


    } catch (error) {

      alert(
        error.message ||
        "신청 취소에 실패했습니다."
      );


    } finally {

      setApplicationLoading(
        false
      );
    }
  }


  // =====================================================
  // 스터디 탈퇴
  // =====================================================

  async function handleLeaveStudy() {

    const confirmed =
      window.confirm(
        "정말 스터디에서 탈퇴하시겠습니까?"
      );


    if (!confirmed) {

      return;
    }


    try {

      setApplicationLoading(
        true
      );


      const response =
        await fetch(
          `/api/study/${id}/leave`,
          {
            method: "DELETE",

            credentials: "include"
          }
        );


      if (!response.ok) {

        const data =
          await readResponse(
            response
          );


        throw new Error(
          data?.message ||
          "스터디 탈퇴에 실패했습니다."
        );
      }


      alert(
        "스터디에서 탈퇴했습니다."
      );


      navigate(
        "/study"
      );


    } catch (error) {

      alert(
        error.message ||
        "스터디 탈퇴에 실패했습니다."
      );


    } finally {

      setApplicationLoading(
        false
      );
    }
  }


  // =====================================================
  // 삭제
  // =====================================================

  async function handleDelete() {

    const confirmed =
      window.confirm(
        "정말 이 스터디를 삭제하시겠습니까?"
      );


    if (!confirmed) {

      return;
    }


    try {

      const response =
        await fetch(
          `/api/study/${id}`,
          {
            method: "DELETE",

            credentials: "include"
          }
        );


      if (!response.ok) {

        const data =
          await readResponse(
            response
          );


        throw new Error(
          data?.message ||
          "스터디 삭제에 실패했습니다."
        );
      }


      alert(
        "스터디가 삭제되었습니다."
      );


      navigate(
        "/study"
      );


    } catch (error) {

      alert(
        error.message ||
        "스터디 삭제에 실패했습니다."
      );
    }
  }


  // =====================================================
  // 방장 여부
  // =====================================================

  function isOwner() {

    return (
      currentUser &&
      study &&
      currentUser.id &&
      study.memberId &&
      Number(currentUser.id) ===
        Number(study.memberId)
    );
  }


  // =====================================================
  // 로딩
  // =====================================================

  if (loading) {

    return (
      <div className="study-detail-page">

        <div className="study-detail-loading">

          <div className="study-detail-spinner" />

          <p>
            스터디 정보를 불러오는 중...
          </p>

        </div>

      </div>
    );
  }


  // =====================================================
  // 오류
  // =====================================================

  if (error || !study) {

    return (
      <div className="study-detail-page">

        <div className="study-detail-error">

          <h2>
            스터디를 찾을 수 없습니다.
          </h2>

          <p>
            {error}
          </p>

          <button
            onClick={() =>
              navigate("/study")
            }
          >
            스터디 목록으로
          </button>

        </div>

      </div>
    );
  }


  // =====================================================
  // 모집률
  // =====================================================

  const currentMembers =
    Number(
      study.currentMembers || 0
    );


  const maxMembers =
    Number(
      study.maxMembers || 0
    );


  const progress =
    maxMembers > 0
      ? Math.min(
          100,
          Math.round(
            (currentMembers /
              maxMembers) *
              100
          )
        )
      : 0;


  return (

    <main className="study-detail-page">

      <div className="study-detail-container">


        {/* 뒤로가기 */}

        <button
          className="study-detail-back"
          onClick={() =>
            navigate("/study")
          }
        >
          ← 스터디 목록
        </button>


        {/* =================================================
            헤더
        ================================================= */}

        <section className="study-detail-header">

          <div>

            <div className="study-detail-badges">

              <span className="study-detail-category">
                {study.category}
              </span>


              <span
                className={
                  `study-detail-status ${
                    study.status === "CLOSED"
                      ? "closed"
                      : "recruiting"
                  }`
                }
              >
                {study.status === "CLOSED"
                  ? "모집완료"
                  : "모집중"}
              </span>

            </div>


            <h1>
              {study.title}
            </h1>


            <p className="study-detail-author">
              작성자
              <strong>
                {study.nickname}
              </strong>
            </p>

          </div>


          {isOwner() && (

            <div className="study-detail-owner-buttons">

              <button
                onClick={() =>
                  navigate(
                    `/study/${id}/edit`
                  )
                }
              >
                수정
              </button>


              <button
                className="danger"
                onClick={
                  handleDelete
                }
              >
                삭제
              </button>

            </div>

          )}

        </section>


        {/* =================================================
            기본 정보
        ================================================= */}

        <section className="study-detail-info">

          <div>

            <span>
              모집 인원
            </span>

            <strong>
              {currentMembers} / {maxMembers}명
            </strong>

          </div>


          <div>

            <span>
              모집 상태
            </span>

            <strong>
              {study.status === "CLOSED"
                ? "모집완료"
                : "모집중"}
            </strong>

          </div>


          <div>

            <span>
              분야
            </span>

            <strong>
              {study.category}
            </strong>

          </div>

        </section>


        {/* =================================================
            진행률
        ================================================= */}

        <section className="study-detail-progress">

          <div className="study-detail-progress-title">

            <span>
              모집 현황
            </span>

            <strong>
              {progress}%
            </strong>

          </div>


          <div className="study-detail-progress-bar">

            <div
              style={{
                width: `${progress}%`
              }}
            />

          </div>

        </section>


        {/* =================================================
            내용
        ================================================= */}

        <section className="study-detail-content">

          <span className="study-detail-label">
            ABOUT THIS STUDY
          </span>


          <h2>
            스터디 소개
          </h2>


          <p>
            {study.content}
          </p>


          <small>
            작성일{" "}
            {study.createdAt
              ? new Date(
                  study.createdAt
                ).toLocaleString(
                  "ko-KR"
                )
              : "-"}
          </small>

        </section>


        {/* =================================================
            일반 회원 영역
        ================================================= */}

        {!isOwner() && (

          <section className="study-detail-join">

            <div>

              <span>
                {myApplication?.status ===
                "APPROVED"
                  ? "현재 참여 중인 스터디입니다."
                  : myApplication?.status ===
                    "PENDING"
                    ? "스터디장의 승인을 기다리고 있습니다."
                    : myApplication?.status ===
                      "REJECTED"
                      ? "참여 신청이 거절되었습니다."
                      : "함께 공부할 사람을 찾고 있나요?"}
              </span>


              <strong>

                {myApplication?.status ===
                "APPROVED"
                  ? "스터디 활동을 시작해보세요."
                  : myApplication?.status ===
                    "PENDING"
                    ? "승인이 완료되면 스터디에 참여할 수 있습니다."
                    : "이 스터디에 참여해보세요."}

              </strong>

            </div>


            <div className="study-detail-join-buttons">

              {!myApplication && (

                <button
                  onClick={
                    handleApply
                  }
                  disabled={
                    applicationLoading ||
                    study.status === "CLOSED"
                  }
                >
                  {applicationLoading
                    ? "신청 중..."
                    : study.status === "CLOSED"
                      ? "모집 완료"
                      : "스터디 참여 신청"}
                </button>

              )}


              {myApplication?.status ===
                "PENDING" && (

                <button
                  className="outline"
                  onClick={
                    handleCancelApplication
                  }
                  disabled={
                    applicationLoading
                  }
                >
                  신청 취소
                </button>

              )}


              {myApplication?.status ===
                "APPROVED" && (

                <button
                  className="outline danger-text"
                  onClick={
                    handleLeaveStudy
                  }
                  disabled={
                    applicationLoading
                  }
                >
                  스터디 탈퇴
                </button>

              )}

            </div>

          </section>

        )}


        {/* =================================================
            ⭐ 방장 신청자 관리
        ================================================= */}

        {isOwner() && (

          <section className="study-applications">

            <div className="study-applications-header">

              <div>

                <span>
                  STUDY MANAGEMENT
                </span>

                <h2>
                  참여 신청 관리
                </h2>

                <p>
                  스터디에 참여 신청한 회원을
                  관리할 수 있습니다.
                </p>

              </div>


              <div className="study-application-count">

                <strong>
                  {applications.length}
                </strong>

                <span>
                  신청
                </span>

              </div>

            </div>


            {applications.length === 0 ? (

              <div className="study-applications-empty">

                <div>
                  👥
                </div>

                <h3>
                  아직 참여 신청자가 없습니다.
                </h3>

                <p>
                  새로운 신청자가 생기면
                  이곳에서 확인할 수 있습니다.
                </p>

              </div>

            ) : (

              <div className="study-application-list">

                {applications.map(
                  (application) => (

                    <div
                      className="study-application-item"
                      key={application.id}
                    >

                      <div className="study-application-user">

                        <div className="study-application-avatar">
                          {application.nickname
                            ?.charAt(0)
                            ?.toUpperCase()}
                        </div>


                        <div>

                          <strong>
                            {application.nickname}
                          </strong>

                          <span>
                            신청일{" "}
                            {application.createdAt
                              ? new Date(
                                  application.createdAt
                                ).toLocaleDateString(
                                  "ko-KR"
                                )
                              : "-"}
                          </span>

                        </div>

                      </div>


                      <div className="study-application-right">

                        <span
                          className={
                            `application-status ${application.status.toLowerCase()}`
                          }
                        >
                          {application.status ===
                            "PENDING" &&
                            "승인 대기"}

                          {application.status ===
                            "APPROVED" &&
                            "승인 완료"}

                          {application.status ===
                            "REJECTED" &&
                            "거절됨"}
                        </span>


                        {application.status ===
                          "PENDING" && (

                          <div className="application-buttons">

                            <button
                              className="approve"
                              onClick={() =>
                                handleApprove(
                                  application.id
                                )
                              }
                              disabled={
                                applicationLoading
                              }
                            >
                              승인
                            </button>


                            <button
                              className="reject"
                              onClick={() =>
                                handleReject(
                                  application.id
                                )
                              }
                              disabled={
                                applicationLoading
                              }
                            >
                              거절
                            </button>

                          </div>

                        )}

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </section>

        )}

      </div>

    </main>
  );
}


export default StudyDetail;