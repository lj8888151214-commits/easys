import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Profile.css";

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
    "/default-profile.png";


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
                      "/default-profile.png";
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
                    "/default-profile.png"
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
        ================================================= */}

        {!isEditing && (

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