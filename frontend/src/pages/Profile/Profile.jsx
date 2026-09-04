import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Profile.css";



const RESERVATION_STATUS = {
  PENDING: { label: "결제 대기", className: "pending" },
  PAID: { label: "승인 대기", className: "paid" },
  CONFIRMED: { label: "확정", className: "confirmed" },
  CANCELLED: { label: "취소됨", className: "cancelled" },
};

const RESERVATIONS_PAGE_SIZE = 5;
const MY_STUDIES_PAGE_SIZE = 6;

function formatPrice(price) {
  return Math.round(Number(price)).toLocaleString("ko-KR") + "원";
}


function Profile() {

  const navigate = useNavigate();

  // =====================================================
  // 사용자 정보
  // =====================================================

  const [user, setUser] = useState(null);

  // =====================================================
  // 수정 모드 여부
  // false = 보기
  // true  = 수정
  // =====================================================

  const [isEditing, setIsEditing] = useState(false);

  // =====================================================
  // 수정용 데이터
  // =====================================================

  const [profile, setProfile] = useState({
    nickname: "",
    birthday: "",
    bio: "",
  });

  // =====================================================
  // 이미지 파일
  // =====================================================

  const [imageFile, setImageFile] = useState(null);

  // 이미지 미리보기
  const [imagePreview, setImagePreview] = useState(null);

  // input 접근용
  const fileInputRef = useRef(null);

  // =====================================================
  // 메시지
  // =====================================================

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(true);

  // =====================================================


  // 내 예약 내역 (스터디룸)
  // =====================================================

  const [reservations, setReservations] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [reservationsError, setReservationsError] = useState("");
  const [cancellingReservationId, setCancellingReservationId] = useState(null);
  const [reservationsPage, setReservationsPage] = useState(1);

  // =====================================================
  // 내가 참여중인 스터디
  // =====================================================

  const [myStudies, setMyStudies] = useState([]);
  const [loadingMyStudies, setLoadingMyStudies] = useState(true);
  const [myStudiesError, setMyStudiesError] = useState("");
  const [myStudiesPage, setMyStudiesPage] = useState(1);

  // =====================================================

  // 사용자 정보 조회
  // =====================================================

  useEffect(() => {

    const fetchUser = async () => {

      try {

        const response = await fetch(
          "/api/member/me",
          {
            method: "GET",
            credentials: "include",
          }
        );


        // 로그인하지 않은 경우
        if (response.status === 401) {

          navigate("/login", {
            replace: true,
          });

          return;
        }


        if (!response.ok) {

          throw new Error(
            "사용자 정보를 불러오지 못했습니다."
          );
        }


        const data =
          await response.json();


        console.log(
          "현재 로그인 사용자:",
          data
        );


        setUser(data);


        // 수정용 데이터
        setProfile({
          nickname: data.nickname || "",
          birthday: data.birthday || "",
          bio: data.bio || "",
        });


        // 기존 프로필 이미지
        if (data.profileImageUrl) {

          setImagePreview(
            `/api${data.profileImageUrl}`
          );
        }


      } catch (error) {

        console.error(
          "프로필 조회 오류:",
          error
        );

        setError(
          "프로필을 불러오지 못했습니다."
        );

      } finally {

        setLoading(false);
      }
    };


    fetchUser();

  }, [navigate]);


  // =====================================================


  // 내 예약 내역 (스터디룸) 조회
  // =====================================================

  const loadReservations = async () => {

    try {

      setLoadingReservations(true);
      setReservationsError("");

      const response = await fetch(
        "/api/reservations/me",
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.status === 401) {
        setReservations([]);
        return;
      }

      if (!response.ok) {
        throw new Error("예약 내역을 불러오지 못했습니다.");
      }

      setReservations(await response.json());

    } catch (error) {

      console.error("예약 내역 조회 오류:", error);
      setReservationsError(error.message || "예약 내역을 불러오지 못했습니다.");
      setReservations([]);

    } finally {

      setLoadingReservations(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);


  // =====================================================
  // 내가 참여중인 스터디 조회
  // =====================================================

  const loadMyStudies = async () => {

    try {

      setLoadingMyStudies(true);
      setMyStudiesError("");

      const [applicationsResponse, ownedResponse] = await Promise.all([
        fetch("/api/study/my-applications", {
          method: "GET",
          credentials: "include",
        }),
        fetch("/api/study/my-owned", {
          method: "GET",
          credentials: "include",
        }),
      ]);

      if (applicationsResponse.status === 401 || ownedResponse.status === 401) {
        setMyStudies([]);
        return;
      }

      if (!applicationsResponse.ok || !ownedResponse.ok) {
        throw new Error("참여중인 스터디를 불러오지 못했습니다.");
      }

      const applications = await applicationsResponse.json();
      const ownedStudies = await ownedResponse.json();

      // 신청해서 승인된 스터디(참여자) + 내가 방장인 스터디를 합쳐서 보여준다.
      const joined = applications
        .filter((application) => application.status === "APPROVED")
        .map((application) => ({
          key: `application-${application.id}`,
          studyId: application.studyId,
          studyTitle: application.studyTitle,
          isOwner: false,
          enteredAt: application.joinedAt,
        }));

      const owned = ownedStudies.map((study) => ({
        key: `owned-${study.id}`,
        studyId: study.id,
        studyTitle: study.title,
        isOwner: true,
        enteredAt: study.createdAt,
      }));

      // 내가 들어간(방장이 된/승인된) 시간 기준 최신순으로 정렬한다.
      const merged = [...owned, ...joined].sort(
        (a, b) => new Date(b.enteredAt) - new Date(a.enteredAt)
      );

      setMyStudies(merged);

    } catch (error) {

      console.error("참여중인 스터디 조회 오류:", error);
      setMyStudiesError(error.message || "참여중인 스터디를 불러오지 못했습니다.");
      setMyStudies([]);

    } finally {

      setLoadingMyStudies(false);
    }
  };

  useEffect(() => {
    loadMyStudies();
  }, []);


  // =====================================================
  // 예약 취소
  // =====================================================

  const handleCancelReservation = async (reservation) => {

    if (
      !window.confirm(
        `"${reservation.studyRoomName}" 예약을 취소할까요? 결제가 완료된 경우 취소 처리됩니다.`
      )
    ) {
      return;
    }

    setCancellingReservationId(reservation.id);

    try {

      const response = await fetch(
        `/api/reservations/${reservation.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {

        const text = await response.text();
        let data = null;

        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          // JSON이 아닌 응답
        }

        throw new Error((data && data.message) || text || "예약 취소에 실패했습니다.");
      }

      loadReservations();

    } catch (error) {

      console.error("예약 취소 오류:", error);
      alert(error.message || "예약 취소에 실패했습니다.");

    } finally {

      setCancellingReservationId(null);
    }
  };


  // =====================================================

  // 프로필 수정 시작
  // =====================================================

  const handleEditStart = () => {

    setMessage("");
    setError("");

    setProfile({
      nickname: user.nickname || "",
      birthday: user.birthday || "",
      bio: user.bio || "",
    });

    setImageFile(null);

    if (user.profileImageUrl) {

      setImagePreview(
        `/api${user.profileImageUrl}`
      );

    } else {

      setImagePreview(null);
    }


    setIsEditing(true);
  };


  // =====================================================
  // 수정 취소
  // =====================================================

  const handleEditCancel = () => {

    setIsEditing(false);

    setMessage("");
    setError("");

    setImageFile(null);

    setProfile({
      nickname: user.nickname || "",
      birthday: user.birthday || "",
      bio: user.bio || "",
    });


    if (user.profileImageUrl) {

      setImagePreview(
        `/api${user.profileImageUrl}`
      );

    } else {

      setImagePreview(null);
    }
  };


  // =====================================================
  // 프로필 입력값 변경
  // =====================================================

  const handleProfileChange = (e) => {

    const {
      name,
      value,
    } = e.target;


    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  // =====================================================
  // 이미지 선택
  // =====================================================

  const handleImageChange = (e) => {

    const file =
      e.target.files?.[0];


    if (!file) {
      return;
    }


    // 이미지 타입 확인
    if (!file.type.startsWith("image/")) {

      setError(
        "이미지 파일만 선택해주세요."
      );

      return;
    }


    // 5MB 제한
    if (file.size > 5 * 1024 * 1024) {

      setError(
        "프로필 이미지는 5MB 이하만 가능합니다."
      );

      return;
    }


    setError("");

    setImageFile(file);


    // 이미지 미리보기
    const reader =
      new FileReader();


    reader.onload = () => {

      setImagePreview(
        reader.result
      );
    };


    reader.readAsDataURL(file);
  };


  // =====================================================
  // 이미지 선택 버튼
  // =====================================================

  const handleImageButtonClick = () => {

    fileInputRef.current?.click();
  };


  // =====================================================
  // 프로필 저장
  // =====================================================

  const handleProfileSubmit = async (e) => {

    e.preventDefault();

    setMessage("");
    setError("");


    try {

      /*
       * ================================================
       * 1. 프로필 정보 저장
       * ================================================
       */

      const profileResponse =
        await fetch(
          "/api/member/me",
          {
            method: "PUT",

            headers: {
              "Content-Type": "application/json",
            },

            credentials: "include",

            body: JSON.stringify(profile),
          }
        );


      // 로그인 만료
      if (
        profileResponse.status === 401
      ) {

        navigate("/login", {
          replace: true,
        });

        return;
      }


      if (!profileResponse.ok) {

        const text =
          await profileResponse.text();

        throw new Error(
          text ||
          "프로필 수정에 실패했습니다."
        );
      }


      let updatedUser =
        await profileResponse.json();


      /*
       * ================================================
       * 2. 이미지가 있으면 이미지 업로드
       * ================================================
       */

      if (imageFile) {

        const formData =
          new FormData();


        formData.append(
          "file",
          imageFile
        );


        const imageResponse =
          await fetch(
            "/api/member/me/profile-image",
            {
              method: "POST",

              credentials: "include",

              body: formData,
            }
          );


        if (
          imageResponse.status === 401
        ) {

          navigate("/login", {
            replace: true,
          });

          return;
        }


        if (!imageResponse.ok) {

          const text =
            await imageResponse.text();

          throw new Error(
            text ||
            "프로필 이미지 업로드에 실패했습니다."
          );
        }


        updatedUser =
          await imageResponse.json();
      }


      /*
       * ================================================
       * 3. 사용자 정보 갱신
       * ================================================
       */

      setUser(updatedUser);


      setProfile({
        nickname:
          updatedUser.nickname || "",

        birthday:
          updatedUser.birthday || "",

        bio:
          updatedUser.bio || "",
      });


      if (
        updatedUser.profileImageUrl
      ) {

        setImagePreview(
          `/api${updatedUser.profileImageUrl}`
        );

      } else {

        setImagePreview(null);
      }


      setImageFile(null);

      setIsEditing(false);


      setMessage(
        "프로필이 성공적으로 수정되었습니다."
      );


    } catch (error) {

      console.error(
        "프로필 수정 오류:",
        error
      );


      setError(
        error.message ||
        "프로필 수정에 실패했습니다."
      );
    }
  };


  // =====================================================
  // 로그아웃
  // =====================================================

  const handleLogout = async () => {

    try {

      await fetch(
        "/api/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );

    } finally {

      navigate("/", {
        replace: true,
      });
    }
  };


  // =====================================================
  // 로딩
  // =====================================================

  if (loading) {

    return (
      <main className="profile-page">

        <div className="profile-card">

          <p>
            프로필을 불러오는 중...
          </p>

        </div>

      </main>
    );
  }


  // =====================================================
  // 오류
  // =====================================================

  if (error && !user) {

    return (
      <main className="profile-page">

        <div className="profile-card">

          <h1>
            프로필을 불러올 수 없습니다.
          </h1>

          <p>
            {error}
          </p>

          <Link to="/login">
            로그인하러 가기
          </Link>

        </div>

      </main>
    );
  }


  // =====================================================
  // 기본 프로필 이미지
  // =====================================================

  const profileImage =
    imagePreview ||
    "/default-profile.svg";


  // =====================================================


  // 예약 내역 페이지네이션
  // =====================================================

  const reservationsTotalPages = Math.max(
    1,
    Math.ceil(reservations.length / RESERVATIONS_PAGE_SIZE)
  );
  const reservationsCurrentPage = Math.min(reservationsPage, reservationsTotalPages);
  const reservationsPageStart = (reservationsCurrentPage - 1) * RESERVATIONS_PAGE_SIZE;
  const pagedReservations = reservations.slice(
    reservationsPageStart,
    reservationsPageStart + RESERVATIONS_PAGE_SIZE
  );

  // =====================================================
  // 내가 참여중인 스터디 페이지네이션
  // =====================================================

  const myStudiesTotalPages = Math.max(
    1,
    Math.ceil(myStudies.length / MY_STUDIES_PAGE_SIZE)
  );
  const myStudiesCurrentPage = Math.min(myStudiesPage, myStudiesTotalPages);
  const myStudiesPageStart = (myStudiesCurrentPage - 1) * MY_STUDIES_PAGE_SIZE;
  const pagedMyStudies = myStudies.slice(
    myStudiesPageStart,
    myStudiesPageStart + MY_STUDIES_PAGE_SIZE
  );


  // =====================================================

  // 화면
  // =====================================================

  return (

    <main className="profile-page">

      <div className="profile-wrapper">


        {/* =================================================
            프로필 카드
        ================================================= */}

        <section className="profile-card">

          <span className="auth-eyebrow">
            MY EASYS
          </span>


          {/* ==============================================
              보기 모드
          ============================================== */}

          {!isEditing && (

            <>

              <div className="profile-image-area">

                <img
                  src={profileImage}
                  alt="프로필"
                  className="profile-image"
                  onError={(e) => {
                    e.currentTarget.src =
                      "/default-profile.svg";
                  }}
                />

              </div>


              <h1 className="profile-name">
                {user.nickname}
              </h1>


              <p className="profile-email">
                {user.email}
              </p>


              <div className="profile-info">

                <div className="profile-info-row">

                  <span>
                    생년월일
                  </span>

                  <strong>
                    {user.birthday}
                  </strong>

                </div>


                <div className="profile-info-row">

                  <span>
                    자기소개
                  </span>

                  <strong>
                    {user.bio ||
                      "아직 자기소개가 없습니다."}
                  </strong>

                </div>

              </div>


              <button
                type="button"
                className="primary-button"
                onClick={handleEditStart}
              >
                프로필 수정
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => navigate("/profile/password")}
              >
                비밀번호 변경
              </button>

            </>
          )}


          {/* ==============================================
              수정 모드
          ============================================== */}

          {isEditing && (

            <form
              className="profile-form"
              onSubmit={handleProfileSubmit}
            >

              <h1>
                프로필 수정
              </h1>


              {/* 프로필 이미지 */}

              <div className="profile-image-edit">

                <img
                  src={
                    imagePreview ||
                    "/default-profile.svg"
                  }
                  alt="프로필 미리보기"
                  className="profile-image"
                />


                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  hidden
                />


                <button
                  type="button"
                  className="image-change-button"
                  onClick={handleImageButtonClick}
                >
                  사진 변경
                </button>


                <small>
                  JPG, PNG, WEBP / 최대 5MB
                </small>

              </div>


              {/* 이메일 */}

              <div className="form-group">

                <label>
                  이메일
                </label>

                <input
                  type="email"
                  value={user.email}
                  disabled
                />

                <small>
                  이메일은 변경할 수 없습니다.
                </small>

              </div>


              {/* 닉네임 */}

              <div className="form-group">

                <label>
                  닉네임
                </label>

                <input
                  type="text"
                  name="nickname"
                  value={profile.nickname}
                  onChange={handleProfileChange}
                  maxLength={10}
                  required
                />

              </div>


              {/* 생년월일 */}

              <div className="form-group">

                <label>
                  생년월일
                </label>

                <input
                  type="text"
                  name="birthday"
                  value={profile.birthday}
                  onChange={handleProfileChange}
                  maxLength={6}
                  placeholder="예: 000823"
                  required
                />

              </div>


              {/* 자기소개 */}

              <div className="form-group">

                <label>
                  자기소개
                </label>

                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={handleProfileChange}
                  rows={5}
                  maxLength={500}
                  placeholder="자신을 소개해주세요."
                />

              </div>


              {/* 버튼 */}

              <div className="edit-buttons">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleEditCancel}
                >
                  취소
                </button>


                <button
                  type="submit"
                  className="primary-button"
                >
                  저장
                </button>

              </div>

            </form>
          )}


          {/* =================================================
              메시지
          ================================================= */}

          {message && (

            <div className="success-message">
              {message}
            </div>

          )}


          {error && (

            <div className="error-message">
              {error}
            </div>

          )}

        </section>


        {/* =================================================

            비밀번호 변경

            내 예약 내역 (스터디룸)

        ================================================= */}

        {!isEditing && (
          <>

          <section className="profile-card security-card">

            <h2>
              계정 보안
            </h2>

            <p>
              비밀번호 변경하기
            </p>

            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate("/profile/password")}
            >
              비밀번호 변경
            </button>

          </section>

          <section className="profile-card reservations-card">

            <h2>
              내 예약 내역
            </h2>

            {loadingReservations && (
              <p className="reservations-state">
                예약 내역을 불러오는 중입니다...
              </p>
            )}

            {!loadingReservations && reservationsError && (
              <p className="reservations-state error">
                {reservationsError}
              </p>
            )}

            {!loadingReservations && !reservationsError && reservations.length === 0 && (
              <p className="reservations-state">
                아직 예약한 내역이 없어요.
              </p>
            )}

            {!loadingReservations && !reservationsError && reservations.length > 0 && (

              <ul className="reservation-list">

                {pagedReservations.map((reservation) => {

                  const statusInfo =
                    RESERVATION_STATUS[reservation.status] || {
                      label: reservation.status,
                      className: "",
                    };

                  const cancellable = reservation.status !== "CANCELLED";

                  return (

                    <li key={reservation.id}>

                      <div className="reservation-list-info">
                        <strong>{reservation.studyRoomName}</strong>
                        <span>{reservation.location}</span>
                        <span>
                          {reservation.reservationDate} ·{" "}
                          {reservation.startTime.slice(0, 5)} ~{" "}
                          {reservation.endTime.slice(0, 5)}
                        </span>
                        <span>
                          {reservation.peopleCount}명 ·{" "}
                          {formatPrice(reservation.totalPrice)}
                        </span>
                      </div>

                      <div className="reservation-list-actions">
                        <span className={`reservation-status ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>

                        {cancellable && (
                          <button
                            type="button"
                            className="reservation-cancel-button"
                            onClick={() => handleCancelReservation(reservation)}
                            disabled={cancellingReservationId === reservation.id}
                          >
                            {cancellingReservationId === reservation.id
                              ? "취소 중..."
                              : "예약 취소"}
                          </button>
                        )}
                      </div>

                    </li>
                  );
                })}

              </ul>
            )}

            {!loadingReservations && !reservationsError && reservationsTotalPages > 1 && (

              <nav className="reservation-pagination" aria-label="예약 내역 페이지">

                <button
                  type="button"
                  className="reservation-pagination-arrow"
                  disabled={reservationsCurrentPage === 1}
                  onClick={() => setReservationsPage(reservationsCurrentPage - 1)}
                >
                  ‹
                </button>

                {Array.from({ length: reservationsTotalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    type="button"
                    key={page}
                    className={`reservation-pagination-page ${
                      page === reservationsCurrentPage ? "active" : ""
                    }`}
                    onClick={() => setReservationsPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  className="reservation-pagination-arrow"
                  disabled={reservationsCurrentPage === reservationsTotalPages}
                  onClick={() => setReservationsPage(reservationsCurrentPage + 1)}
                >
                  ›
                </button>

              </nav>
            )}

          </section>

          </>
        )}


        {/* =================================================
            내가 참여중인 스터디
        ================================================= */}

        {!isEditing && (

          <section className="profile-card my-studies-card">

            <h2>
              내가 참여중인 스터디
            </h2>

            {loadingMyStudies && (
              <p className="reservations-state">
                참여중인 스터디를 불러오는 중입니다...
              </p>
            )}

            {!loadingMyStudies && myStudiesError && (
              <p className="reservations-state error">
                {myStudiesError}
              </p>
            )}

            {!loadingMyStudies && !myStudiesError && myStudies.length === 0 && (
              <p className="reservations-state">
                아직 참여중인 스터디가 없어요.
              </p>
            )}

            {!loadingMyStudies && !myStudiesError && myStudies.length > 0 && (

              <ul className="reservation-list">

                {pagedMyStudies.map((item) => (

                  <li key={item.key}>

                    <div className="reservation-list-info">
                      <strong>{item.studyTitle}</strong>
                      {item.isOwner && (
                        <span className="reservation-status confirmed">방장</span>
                      )}
                    </div>

                    <div className="reservation-list-actions">
                      <button
                        type="button"
                        className="reservation-cancel-button"
                        onClick={() => navigate(`/study/${item.studyId}`)}
                      >
                        스터디 채팅으로 이동
                      </button>
                    </div>

                  </li>
                ))}

              </ul>
            )}

            {!loadingMyStudies && !myStudiesError && myStudiesTotalPages > 1 && (

              <nav className="reservation-pagination" aria-label="참여중인 스터디 페이지">

                <button
                  type="button"
                  className="reservation-pagination-arrow"
                  disabled={myStudiesCurrentPage === 1}
                  onClick={() => setMyStudiesPage(myStudiesCurrentPage - 1)}
                >
                  ‹
                </button>

                {Array.from({ length: myStudiesTotalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    type="button"
                    key={page}
                    className={`reservation-pagination-page ${
                      page === myStudiesCurrentPage ? "active" : ""
                    }`}
                    onClick={() => setMyStudiesPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  className="reservation-pagination-arrow"
                  disabled={myStudiesCurrentPage === myStudiesTotalPages}
                  onClick={() => setMyStudiesPage(myStudiesCurrentPage + 1)}
                >
                  ›
                </button>

              </nav>
            )}


          </section>

        )}


        {/* =================================================
            로그아웃
        ================================================= */}

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          로그아웃
        </button>

      </div>

    </main>
  );
}

export default Profile;