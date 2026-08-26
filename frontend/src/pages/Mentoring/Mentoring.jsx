import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Mentoring.css";
import mentoringBg from "../../assets/images/mentoring-bg.jpg";

function Mentoring() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [scrollY, setScrollY] = useState(0);
  const [category, setCategory] = useState("전체");
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [reservationMentor, setReservationMentor] = useState(null);
  const [reviewMentor, setReviewMentor] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [isEditingMentor, setIsEditingMentor] = useState(false);
  const [user, setUser] = useState(null);
  const [myMentor, setMyMentor] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [mentors, setMentors] = useState([]);

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [registerCalendarDate, setRegisterCalendarDate] = useState(new Date());

  const [registerForm, setRegisterForm] = useState({
    title: "",
    career: "",
    careerDetail: "",
    certificates: "",
    skills: [],
    consultationTypes: [],
    mentoringType: "",
    github: "",
    velog: "",
    portfolio: "",
    introduction: "",
    price: "",
    availableDays: [],
    availableDates: [],
    availableStart: "",
    availableEnd: ""
  });

  const [reservationForm, setReservationForm] = useState({
    consultationTypes: [],
    skills: [],
    date: "",
    time: "",
    problem: "",
    file: null
  });

  const categories = [
    "전체",
    "HTML",
    "CSS",
    "Java",
    "JavaScript",
    "Spring",
    "React",
    "SQL",
    "DB",
    "Python"
  ];

  const consultationTypes = [
    "코드 오류 해결",
    "코드 리뷰",
    "프로젝트 구조",
    "취업 / 포트폴리오",
    "기술 선택",
    "개발 공부 방향",
    "면접 준비",
    "기타"
  ];

  const skillOptions = [
    "HTML",
    "CSS",
    "Java",
    "JavaScript",
    "Spring",
    "React",
    "SQL",
    "DB",
    "Python"
  ];

  const weekDays = ["월", "화", "수", "목", "금", "토", "일"];

  const filteredMentors =
    category === "전체"
      ? mentors
      : mentors.filter((mentor) => mentor.skills.includes(category));

  const getProfileImage = (mentor) => mentor?.profileImage || "";

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    return target < today;
  };

  const getCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    const daysInMonth = lastDay.getDate();
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getRegisterCalendarDays = () => {
    const year = registerCalendarDate.getFullYear();
    const month = registerCalendarDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    const daysInMonth = lastDay.getDate();
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getWeekDayName = (date) => {
    const day = date.getDay();

    const dayMap = {
      0: "일",
      1: "월",
      2: "화",
      3: "수",
      4: "목",
      5: "금",
      6: "토"
    };

    return dayMap[day];
  };

  const isAvailableMentorDay = (date) => {
    if (!reservationMentor) return false;

    if (!reservationMentor.availableDays?.length) {
      return true;
    }

    const dayName = getWeekDayName(date);

    return reservationMentor.availableDays.includes(dayName);
  };

  const handleCalendarDateClick = (date) => {
    if (!date) return;

    if (isPastDate(date)) {
      return;
    }

    if (!isAvailableMentorDay(date)) {
      alert("멘토가 상담 가능한 요일이 아닙니다.");
      return;
    }

    const dateString = formatDateString(date);

    setReservationForm((prev) => ({
      ...prev,
      date: dateString
    }));
  };

  const moveCalendarMonth = (amount) => {
    setCalendarDate(
      (prev) =>
        new Date(
          prev.getFullYear(),
          prev.getMonth() + amount,
          1
        )
    );
  };

  const moveRegisterCalendarMonth = (amount) => {
    setRegisterCalendarDate(
      (prev) =>
        new Date(
          prev.getFullYear(),
          prev.getMonth() + amount,
          1
        )
    );
  };

  const isToday = (date) => {
    if (!date) return false;

    return formatDateString(date) === getTodayString();
  };

  const isSelectedDate = (date) => {
    if (!date || !reservationForm.date) return false;

    return formatDateString(date) === reservationForm.date;
  };

  const isRegisterDateSelected = (date) => {
    if (!date) return false;

    return registerForm.availableDates.includes(
      formatDateString(date)
    );
  };

  const toggleAvailableDate = (date) => {
    if (!date || isPastDate(date)) return;

    const dateString = formatDateString(date);

    setRegisterForm((prev) => {
      const exists = prev.availableDates.includes(dateString);

      return {
        ...prev,
        availableDates: exists
          ? prev.availableDates.filter(
              (item) => item !== dateString
            )
          : [...prev.availableDates, dateString].sort()
      };
    });
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);

    window.addEventListener("scroll", handleScroll, {
      passive: true
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/member/me", {
          method: "GET",
          credentials: "include"
        });

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error("사용자 정보 조회 오류:", error);
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!user) {
      setMyMentor(null);
      return;
    }

    const fetchMyMentor = async () => {
      try {
        const response = await fetch("/api/mentor/me", {
          method: "GET",
          credentials: "include"
        });

        if (response.ok) {
          const data = await response.json();
          setMyMentor(data);
        } else {
          setMyMentor(null);
        }
      } catch (error) {
        console.error("내 멘토 정보 조회 오류:", error);
        setMyMentor(null);
      }
    };

    fetchMyMentor();
  }, [user]);

  const fetchMentors = async () => {
    try {
      const response = await fetch("/api/mentor", {
        method: "GET",
        credentials: "include"
      });

      if (!response.ok) {
        console.error(
          "멘토 목록 조회 실패:",
          response.status
        );
        return;
      }

      const data = await response.json();

      const mentorList = data.map((mentor) => ({
        id: mentor.id,
        memberId: mentor.memberId,
        name: mentor.nickname || "멘토",
        career: mentor.career || "",
        careerDetail: mentor.careerDetail || "",
        skills: mentor.skills
          ? mentor.skills
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        description: mentor.introduction || "",
        price: mentor.price ?? 0,
        mentoringType: mentor.mentoringType || "",
        consultationTypes: mentor.consultationFields
          ? mentor.consultationFields
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        certificates: mentor.certificates
          ? mentor.certificates
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        github: mentor.github || "",
        velog: mentor.velog || "",
        portfolio: mentor.portfolio || "",
        availableDays: mentor.availableDays
          ? mentor.availableDays
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        availableDates: mentor.availableDates
          ? mentor.availableDates
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        availableStart: mentor.availableStart || "",
        availableEnd: mentor.availableEnd || "",
        profileImage: mentor.profileImageUrl
          ? `/api${mentor.profileImageUrl}`
          : "",
        status: mentor.status || ""
      }));

      setMentors(mentorList);
    } catch (error) {
      console.error("멘토 목록 조회 오류:", error);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;

    setRegisterForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleRegisterArray = (name, value) => {
    setRegisterForm((prev) => ({
      ...prev,
      [name]: prev[name].includes(value)
        ? prev[name].filter((item) => item !== value)
        : [...prev[name], value]
    }));
  };

  const toggleReservationArray = (name, value) => {
    setReservationForm((prev) => ({
      ...prev,
      [name]: prev[name].includes(value)
        ? prev[name].filter((item) => item !== value)
        : [...prev[name], value]
    }));
  };

  const handleReservationChange = (e) => {
    const { name, value } = e.target;

    setReservationForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert("파일은 20MB 이하만 첨부할 수 있습니다.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);

    setReservationForm((prev) => ({
      ...prev,
      file
    }));
  };

  const removeFile = () => {
    setSelectedFile(null);

    setReservationForm((prev) => ({
      ...prev,
      file: null
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetRegisterForm = () => {
    setRegisterForm({
      title: "",
      career: "",
      careerDetail: "",
      certificates: "",
      skills: [],
      consultationTypes: [],
      mentoringType: "",
      github: "",
      velog: "",
      portfolio: "",
      introduction: "",
      price: "",
      availableDays: [],
      availableDates: [],
      availableStart: "",
      availableEnd: ""
    });
  };

  const openRegisterModal = () => {
    if (!user) {
      alert("멘토 등록은 로그인 후 이용할 수 있습니다.");
      navigate("/login");
      return;
    }

    if (myMentor) {
      setRegisterForm({
        title: myMentor.title || "",
        career: myMentor.career || "",
        careerDetail: myMentor.careerDetail || "",
        certificates: myMentor.certificates || "",
        skills: myMentor.skills
          ? myMentor.skills
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        consultationTypes: myMentor.consultationFields
          ? myMentor.consultationFields
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        mentoringType: myMentor.mentoringType || "",
        github: myMentor.github || "",
        velog: myMentor.velog || "",
        portfolio: myMentor.portfolio || "",
        introduction: myMentor.introduction || "",
        price: myMentor.price ?? "",
        availableDays: myMentor.availableDays
          ? myMentor.availableDays
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        availableDates: myMentor.availableDates
          ? myMentor.availableDates
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        availableStart: myMentor.availableStart || "",
        availableEnd: myMentor.availableEnd || ""
      });

      setIsEditingMentor(true);
    } else {
      resetRegisterForm();
      setIsEditingMentor(false);
    }

    const today = new Date();

    setRegisterCalendarDate(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );

    setShowRegister(true);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("멘토 등록은 로그인 후 이용할 수 있습니다.");
      navigate("/login");
      return;
    }

    if (!registerForm.title.trim()) {
      alert("멘토링 제목을 입력해주세요.");
      return;
    }

    if (!registerForm.career.trim()) {
      alert("경력을 입력해주세요.");
      return;
    }

    if (registerForm.skills.length === 0) {
      alert("기술 분야를 하나 이상 선택해주세요.");
      return;
    }

    if (registerForm.consultationTypes.length === 0) {
      alert("상담 가능한 분야를 하나 이상 선택해주세요.");
      return;
    }

    if (!registerForm.mentoringType) {
      alert("멘토링 방식을 선택해주세요.");
      return;
    }

    if (!registerForm.introduction.trim()) {
      alert("멘토 소개를 입력해주세요.");
      return;
    }

    if (
      registerForm.price === "" ||
      Number(registerForm.price) < 0
    ) {
      alert("상담 가격을 입력해주세요.");
      return;
    }

    if (registerForm.availableDates.length === 0) {
      alert("상담 가능한 날짜를 하나 이상 선택해주세요.");
      return;
    }

    const requestData = {
      title: registerForm.title.trim(),
      introduction: registerForm.introduction.trim(),
      career: registerForm.career.trim(),
      careerDetail: registerForm.careerDetail.trim(),
      certificates: registerForm.certificates.trim(),
      skills: registerForm.skills.join(", "),
      price: Number(registerForm.price),
      mentoringType: registerForm.mentoringType,
      consultationFields:
        registerForm.consultationTypes.join(", "),
      github: registerForm.github.trim(),
      velog: registerForm.velog.trim(),
      portfolio: registerForm.portfolio.trim(),
      availableDays: registerForm.availableDays.join(", "),
      availableDates: registerForm.availableDates.join(", "),
      availableStart: registerForm.availableStart,
      availableEnd: registerForm.availableEnd
    };

    console.log("멘토 등록 전송 데이터:", requestData);

    try {
      const response = await fetch(
        isEditingMentor
          ? "/api/mentor/me"
          : "/api/mentor",
        {
          method: isEditingMentor ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify(requestData)
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        alert(
          data?.message ||
            (isEditingMentor
              ? "멘토 정보 수정 중 오류가 발생했습니다."
              : "멘토 등록 중 오류가 발생했습니다.")
        );
        return;
      }

      setMyMentor(data);

      alert(
        isEditingMentor
          ? "멘토 정보가 수정되었습니다."
          : "멘토 등록이 완료되었습니다."
      );

      setShowRegister(false);
      setIsEditingMentor(false);

      await fetchMentors();
    } catch (error) {
      console.error("멘토 등록/수정 오류:", error);
      alert("서버와 통신하는 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteMentor = async () => {
    if (!myMentor) return;

    const confirmed = window.confirm(
      "멘토 등록 정보를 삭제하시겠습니까?\n\n삭제하면 다시 등록해야 합니다."
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/mentor/me", {
        method: "DELETE",
        credentials: "include"
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        alert(
          data?.message ||
            "멘토 등록 정보 삭제 중 오류가 발생했습니다."
        );
        return;
      }

      alert("멘토 등록 정보가 삭제되었습니다.");

      setMyMentor(null);
      setShowRegister(false);
      setIsEditingMentor(false);

      resetRegisterForm();

      await fetchMentors();
    } catch (error) {
      console.error("멘토 삭제 오류:", error);
      alert("서버와 통신하는 중 오류가 발생했습니다.");
    }
  };

  const openReservation = (mentor) => {
    setSelectedMentor(null);
    setReviewMentor(null);

    setReservationForm({
      consultationTypes: [],
      skills: [],
      date: "",
      time: "",
      problem: "",
      file: null
    });

    setSelectedFile(null);

    const today = new Date();

    setCalendarDate(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setReservationMentor(mentor);
  };

  const handleReservationSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("멘토링 신청은 로그인 후 이용할 수 있습니다.");
      navigate("/login");
      return;
    }

    if (!reservationMentor) return;

    if (reservationForm.consultationTypes.length === 0) {
      alert("상담받고 싶은 분야를 선택해주세요.");
      return;
    }

    if (reservationForm.skills.length === 0) {
      alert("관련 기술을 하나 이상 선택해주세요.");
      return;
    }

    if (!reservationForm.date) {
      alert("예약 날짜를 선택해주세요.");
      return;
    }

    if (!reservationForm.time) {
      alert("예약 시간을 선택해주세요.");
      return;
    }

    if (!reservationForm.problem.trim()) {
      alert("현재 문제를 작성해주세요.");
      return;
    }

    const requestData = {
      consultationTypes:
        reservationForm.consultationTypes.join(", "),
      skills: reservationForm.skills.join(", "),
      reservationDate: reservationForm.date,
      reservationTime: reservationForm.time,
      problem: reservationForm.problem.trim(),
      fileName: selectedFile?.name || "",
      filePath: ""
    };

    try {
      const response = await fetch(
        `/api/mentor/${reservationMentor.id}/reservation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify(requestData)
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        alert(
          data?.message ||
            "멘토링 신청 중 오류가 발생했습니다."
        );
        return;
      }

      alert(
        "멘토링 신청이 완료되었습니다.\n\n" +
          "예약 신청 후 결제 단계로 이동합니다."
      );

      setReservationMentor(null);
      setSelectedFile(null);

      setReservationForm({
        consultationTypes: [],
        skills: [],
        date: "",
        time: "",
        problem: "",
        file: null
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      console.log("예약 신청 결과:", data);
    } catch (error) {
      console.error("멘토링 예약 오류:", error);
      alert("서버와 통신하는 중 오류가 발생했습니다.");
    }
  };

  const closeAllModals = () => {
    setSelectedMentor(null);
    setReviewMentor(null);
    setReservationMentor(null);
    setShowRegister(false);
  };

  const calendarDays = getCalendarDays();
  const registerCalendarDays = getRegisterCalendarDays();

  return (
    <main className="mentoring-page">
      <section className="mentoring-hero">
        <div
          className="mentoring-hero-bg"
          style={{
            backgroundImage: `url(${mentoringBg})`,
            transform: `scale(1.08) translateY(${scrollY * 0.15}px)`
          }}
        />

        <div className="mentoring-hero-overlay" />

        <div className="mentoring-hero-content">
          <span className="mentoring-eyebrow">
            EASYS MENTORING
          </span>

          <h1>멘토링</h1>

          <p>
            내 코드와 고민을 가져오세요.
            <br />
            실무 개발자와 1:1로 해결해보세요.
          </p>
        </div>
      </section>

      <section className="mentoring-content">
        <div className="mentoring-intro">
          <div>
            <span className="section-label">
              FIND YOUR MENTOR
            </span>

            <h2>나에게 맞는 멘토를 찾아보세요.</h2>

            <p>
              기술과 상담 목적을 기준으로
              <br />
              지금 필요한 멘토를 찾아보세요.
            </p>
          </div>

          <button
            type="button"
            className="mentor-register-button"
            onClick={openRegisterModal}
          >
            {myMentor
              ? "내 멘토 정보 수정하기 →"
              : "멘토로 등록하기 →"}
          </button>
        </div>

        <div className="mentoring-filter">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              className={`mentoring-filter-button ${
                category === item ? "active" : ""
              }`}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {filteredMentors.length > 0 ? (
          <div className="mentor-grid">
            {filteredMentors.map((mentor) => {
              const image = getProfileImage(mentor);

              return (
                <article className="mentor-card" key={mentor.id}>
                  <div className="mentor-card-top">
                    <div className="mentor-basic">
                      <span>
                        {mentor.mentoringType || "MENTOR"}
                      </span>

                      <h3>{mentor.name}</h3>

                      <p>{mentor.career}</p>
                    </div>

                    <div className="mentor-profile">
                      <div className="mentor-avatar">
                        {image ? (
                          <img
                            src={image}
                            alt={`${mentor.name} 프로필`}
                            onError={(e) => {
                              e.currentTarget.style.display =
                                "none";
                            }}
                          />
                        ) : (
                          mentor.name.charAt(0)
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="mentor-description">
                    {mentor.description ||
                      "멘토 소개가 등록되지 않았습니다."}
                  </p>

                  <div className="mentor-consultation-tags">
                    {mentor.consultationTypes
                      .slice(0, 3)
                      .map((type) => (
                        <span key={type}>{type}</span>
                      ))}
                  </div>

                  <div className="mentor-skills">
                    {mentor.skills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>

                  <div className="mentor-card-bottom">
                    <div>
                      <small>1회 상담</small>

                      <strong>
                        {Number(
                          mentor.price
                        ).toLocaleString()}
                        원
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedMentor(mentor)
                      }
                    >
                      상세보기 →
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mentor-empty">
            {category === "전체"
              ? "승인된 멘토가 아직 없습니다."
              : `${category} 분야의 멘토가 아직 없습니다.`}
          </div>
        )}

        <section className="mentoring-value-section">
          <div>
            <span className="section-label">
              WHY EASYS MENTORING
            </span>

            <h2>
              질문만 하는 멘토링이 아니라
              <br />
              문제를 함께 해결합니다.
            </h2>
          </div>

          <div className="mentoring-value-grid">
            <article>
              <span>01</span>

              <h3>내 코드를 가져오세요</h3>

              <p>
                현재 작성한 코드와 오류 상황을
                멘토에게 직접 보여줄 수 있습니다.
              </p>
            </article>

            <article>
              <span>02</span>

              <h3>문제에 맞는 멘토</h3>

              <p>
                기술뿐 아니라 코드 리뷰,
                프로젝트 구조 등 상담 목적에 맞춰 선택합니다.
              </p>
            </article>

            <article>
              <span>03</span>

              <h3>상담 후 후기</h3>

              <p>
                실제 상담 경험을 바탕으로
                다음 사용자에게 도움이 되는 후기를 남길 수 있습니다.
              </p>
            </article>
          </div>
        </section>
      </section>

      {selectedMentor && (
        <div
          className="modal-background"
          onClick={() => setSelectedMentor(null)}
        >
          <div
            className="mentor-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="modal-close"
              onClick={() =>
                setSelectedMentor(null)
              }
            >
              ×
            </button>

            <div className="mentor-modal-profile">
              <div className="mentor-avatar large">
                {getProfileImage(selectedMentor) ? (
                  <img
                    src={getProfileImage(selectedMentor)}
                    alt={`${selectedMentor.name} 프로필`}
                  />
                ) : (
                  selectedMentor.name.charAt(0)
                )}
              </div>

              <div>
                <span>
                  {selectedMentor.mentoringType ||
                    "MENTOR"}
                </span>

                <h2>{selectedMentor.name}</h2>

                <p>{selectedMentor.career}</p>
              </div>
            </div>

            <div className="detail-rating">
              <strong>★ 5.0</strong>

              <button
                type="button"
                onClick={() => {
                  setReviewMentor(selectedMentor);
                  setSelectedMentor(null);
                }}
              >
                후기 보기
              </button>
            </div>

            <div className="mentor-modal-section">
              <span>CAREER</span>

              <h3>실무 경력</h3>

              <p>
                {selectedMentor.careerDetail ||
                  selectedMentor.career ||
                  "등록된 경력 정보가 없습니다."}
              </p>
            </div>

            <div className="mentor-modal-section">
              <span>CERTIFICATES</span>

              <h3>자격증</h3>

              <div className="certificate-list">
                {selectedMentor.certificates.length >
                0 ? (
                  selectedMentor.certificates.map(
                    (certificate) => (
                      <span key={certificate}>
                        🏆 {certificate}
                      </span>
                    )
                  )
                ) : (
                  <span>
                    등록된 자격증이 없습니다.
                  </span>
                )}
              </div>
            </div>

            <div className="mentor-modal-section">
              <span>CONSULTATION</span>

              <h3>주로 상담 가능한 분야</h3>

              <div className="consultation-list">
                {selectedMentor.consultationTypes
                  .length > 0 ? (
                  selectedMentor.consultationTypes.map(
                    (type) => (
                      <span key={type}>{type}</span>
                    )
                  )
                ) : (
                  <span>
                    등록된 상담 분야가 없습니다.
                  </span>
                )}
              </div>
            </div>

            <div className="mentor-modal-section">
              <span>SKILLS</span>

              <h3>기술 분야</h3>

              <div className="mentor-skills">
                {selectedMentor.skills.length > 0 ? (
                  selectedMentor.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))
                ) : (
                  <span>
                    등록된 기술이 없습니다.
                  </span>
                )}
              </div>
            </div>

            <div className="mentor-modal-section">
              <span>ABOUT MENTOR</span>

              <h3>멘토 소개</h3>

              <p>
                {selectedMentor.description ||
                  "등록된 멘토 소개가 없습니다."}
              </p>
            </div>

            <div className="mentor-modal-section">
              <span>LINKS</span>

              <h3>개발 활동</h3>

              <div className="mentor-links">
                {selectedMentor.github && (
                  <a
                    href={selectedMentor.github}
                    target="_blank"
                    rel="noreferrer"
                  >
                    GitHub ↗
                  </a>
                )}

                {selectedMentor.velog && (
                  <a
                    href={selectedMentor.velog}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Velog ↗
                  </a>
                )}

                {selectedMentor.portfolio && (
                  <a
                    href={selectedMentor.portfolio}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Portfolio ↗
                  </a>
                )}

                {!selectedMentor.github &&
                  !selectedMentor.velog &&
                  !selectedMentor.portfolio && (
                    <span>
                      등록된 링크가 없습니다.
                    </span>
                  )}
              </div>
            </div>

            <div className="mentor-modal-section">
              <span>AVAILABLE TIME</span>

              <h3>상담 가능 시간</h3>

              <p>
                {selectedMentor.availableDays.length >
                0
                  ? selectedMentor.availableDays.join(
                      " · "
                    )
                  : "등록된 요일이 없습니다."}

                <br />

                {selectedMentor.availableStart &&
                selectedMentor.availableEnd
                  ? `${selectedMentor.availableStart} ~ ${selectedMentor.availableEnd}`
                  : "등록된 시간이 없습니다."}
              </p>
            </div>

            <div className="mentor-modal-section">
              <span>AVAILABLE DATES</span>

              <h3>상담 가능한 날짜</h3>

              {selectedMentor.availableDates?.length >
              0 ? (
                <div className="mentor-available-date-list">
                  {selectedMentor.availableDates.map(
                    (date) => (
                      <span key={date}>
                        {date.replaceAll("-", ".")}
                      </span>
                    )
                  )}
                </div>
              ) : (
                <p>
                  등록된 상담 가능 날짜가 없습니다.
                </p>
              )}
            </div>

            <div className="mentor-modal-bottom">
              <div>
                <small>1회 상담</small>

                <strong>
                  {Number(
                    selectedMentor.price
                  ).toLocaleString()}
                  원
                </strong>
              </div>

              <button
                type="button"
                className="mentor-request-button"
                onClick={() =>
                  openReservation(selectedMentor)
                }
              >
                1:1 상담 신청하기 →
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewMentor && (
        <div
          className="modal-background"
          onClick={() => setReviewMentor(null)}
        >
          <div
            className="review-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="modal-close"
              onClick={() =>
                setReviewMentor(null)
              }
            >
              ×
            </button>

            <span className="section-label">
              MENTOR REVIEWS
            </span>

            <h2>{reviewMentor.name}님의 후기</h2>

            <div className="review-summary">
              <strong>★ 5.0</strong>
              <span>
                현재 등록된 후기 기준
              </span>
            </div>

            <div className="review-list">
              <article className="review-item">
                <div>
                  <strong>★★★★★</strong>
                  <span>후기 예시</span>
                </div>

                <p>
                  실제 멘토링 후기 기능이 연결되면
                  이곳에 DB에서 후기를 불러오게 됩니다.
                </p>
              </article>
            </div>

            <button
              type="button"
              className="review-close-button"
              onClick={() =>
                setReviewMentor(null)
              }
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {reservationMentor && (
        <div
          className="modal-background"
          onClick={() =>
            setReservationMentor(null)
          }
        >
          <form
            className="reservation-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
            onSubmit={handleReservationSubmit}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() =>
                setReservationMentor(null)
              }
            >
              ×
            </button>

            <span className="section-label">
              1:1 MENTORING
            </span>

            <h2>멘토링 상담 신청</h2>

            <div className="reservation-mentor">
              <div className="mentor-avatar small">
                {getProfileImage(
                  reservationMentor
                ) ? (
                  <img
                    src={getProfileImage(
                      reservationMentor
                    )}
                    alt={`${reservationMentor.name} 프로필`}
                  />
                ) : (
                  reservationMentor.name.charAt(0)
                )}
              </div>

              <div>
                <strong>
                  {reservationMentor.name}
                </strong>

                <span>
                  {reservationMentor.career}
                </span>
              </div>
            </div>

            <div className="reservation-section">
              <label>
                무엇을 상담받고 싶나요?
              </label>

              <div className="check-grid">
                {consultationTypes.map((type) => (
                  <label
                    className={`check-item ${
                      reservationForm.consultationTypes.includes(
                        type
                      )
                        ? "selected"
                        : ""
                    }`}
                    key={type}
                  >
                    <input
                      type="checkbox"
                      checked={reservationForm.consultationTypes.includes(
                        type
                      )}
                      onChange={() =>
                        toggleReservationArray(
                          "consultationTypes",
                          type
                        )
                      }
                    />

                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="reservation-section">
              <label>
                관련 기술은 무엇인가요?
              </label>

              <div className="check-grid skills-grid">
                {skillOptions.map((skill) => (
                  <label
                    className={`check-item ${
                      reservationForm.skills.includes(
                        skill
                      )
                        ? "selected"
                        : ""
                    }`}
                    key={skill}
                  >
                    <input
                      type="checkbox"
                      checked={reservationForm.skills.includes(
                        skill
                      )}
                      onChange={() =>
                        toggleReservationArray(
                          "skills",
                          skill
                        )
                      }
                    />

                    <span>{skill}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="reservation-section">
              <label>예약 날짜</label>

              <div className="reservation-calendar">
                <div className="reservation-calendar-header">
                  <button
                    type="button"
                    className="calendar-month-button"
                    onClick={() =>
                      moveCalendarMonth(-1)
                    }
                  >
                    ‹
                  </button>

                  <strong>
                    {calendarDate.getFullYear()}년{" "}
                    {calendarDate.getMonth() + 1}월
                  </strong>

                  <button
                    type="button"
                    className="calendar-month-button"
                    onClick={() =>
                      moveCalendarMonth(1)
                    }
                  >
                    ›
                  </button>
                </div>

                <div className="reservation-calendar-week">
                  {weekDays.map((day, index) => (
                    <span
                      key={day}
                      className={
                        index === 5
                          ? "saturday"
                          : index === 6
                          ? "sunday"
                          : ""
                      }
                    >
                      {day}
                    </span>
                  ))}
                </div>

                <div className="reservation-calendar-grid">
                  {calendarDays.map(
                    (date, index) => {
                      if (!date) {
                        return (
                          <div
                            className="reservation-calendar-empty"
                            key={`empty-${index}`}
                          />
                        );
                      }

                      const past =
                        isPastDate(date);
                      const available =
                        isAvailableMentorDay(
                          date
                        );
                      const selected =
                        isSelectedDate(date);
                      const today =
                        isToday(date);

                      return (
                        <button
                          type="button"
                          key={formatDateString(
                            date
                          )}
                          className={`reservation-calendar-day ${
                            past ? "past" : ""
                          } ${
                            !available
                              ? "unavailable"
                              : ""
                          } ${
                            selected
                              ? "selected"
                              : ""
                          } ${
                            today ? "today" : ""
                          }`}
                          disabled={
                            past || !available
                          }
                          onClick={() =>
                            handleCalendarDateClick(
                              date
                            )
                          }
                        >
                          <span>
                            {date.getDate()}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>

                <div className="reservation-calendar-selected">
                  {reservationForm.date ? (
                    <>
                      <span>
                        선택한 날짜
                      </span>

                      <strong>
                        {reservationForm.date.replaceAll(
                          "-",
                          "."
                        )}
                      </strong>
                    </>
                  ) : (
                    <span>
                      상담 가능한 날짜를
                      선택해주세요.
                    </span>
                  )}
                </div>

                <div className="reservation-calendar-guide">
                  <span>
                    ● 선택 가능
                  </span>

                  <span>
                    ○ 상담 불가
                  </span>
                </div>
              </div>
            </div>

            <div className="reservation-row">
              <label>
                예약 시간

                <input
                  type="time"
                  name="time"
                  value={reservationForm.time}
                  onChange={
                    handleReservationChange
                  }
                  min={
                    reservationMentor.availableStart ||
                    undefined
                  }
                  max={
                    reservationMentor.availableEnd ||
                    undefined
                  }
                  required
                />
              </label>
            </div>

            <div className="reservation-section">
              <label htmlFor="problem">
                현재 문제를 알려주세요.
              </label>

              <textarea
                id="problem"
                name="problem"
                value={reservationForm.problem}
                onChange={
                  handleReservationChange
                }
                placeholder={
                  "예) Spring Security 로그인은 되는데 로그인 후 사용자 정보가 조회되지 않습니다.\n현재 시도한 방법이나 오류 메시지도 함께 적어주시면 좋아요."
                }
                maxLength={2000}
                required
              />

              <small className="input-guide">
                현재 코드 상황과 오류 메시지를
                함께 작성하면 멘토가 상담을
                준비하는 데 도움이 됩니다.
              </small>
            </div>

            <div className="reservation-section">
              <label>관련 파일 첨부</label>

              <div className="file-upload-box">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  hidden
                />

                {!selectedFile ? (
                  <button
                    type="button"
                    className="file-upload-button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                  >
                    📎 파일 선택
                  </button>
                ) : (
                  <div className="selected-file">
                    <span>
                      📎 {selectedFile.name}
                    </span>

                    <button
                      type="button"
                      onClick={removeFile}
                    >
                      삭제
                    </button>
                  </div>
                )}

                <small>
                  프로젝트 파일, 이미지, 문서 등을
                  첨부할 수 있습니다. 최대 20MB
                </small>
              </div>
            </div>

            <div className="reservation-price">
              <div>
                <small>1회 상담</small>

                <strong>
                  {Number(
                    reservationMentor.price
                  ).toLocaleString()}
                  원
                </strong>
              </div>

              <span>
                상담 신청 후 결제 단계로 이동합니다.
              </span>
            </div>

            <button
              type="submit"
              className="reservation-submit-button"
            >
              상담 신청하기 →
            </button>
          </form>
        </div>
      )}

      {showRegister && (
        <div
          className="modal-background"
          onClick={() =>
            setShowRegister(false)
          }
        >
          <form
            className="register-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
            onSubmit={handleRegisterSubmit}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() =>
                setShowRegister(false)
              }
            >
              ×
            </button>

            <span className="section-label">
              {isEditingMentor
                ? "EDIT YOUR MENTOR PROFILE"
                : "BECOME A MENTOR"}
            </span>

            <h2>
              {isEditingMentor
                ? "내 멘토 정보 수정"
                : "멘토 등록"}
            </h2>

            <p className="register-description">
              내가 가진 경험과 지식을 공유하고
              개발자 지망생들과 함께 성장해보세요.
            </p>

            <div className="register-profile-preview">
              <div className="mentor-avatar large">
                {user?.profileImageUrl ? (
                  <img
                    src={`/api${user.profileImageUrl}`}
                    alt="내 프로필"
                  />
                ) : (
                  (
                    user?.nickname || "나"
                  ).charAt(0)
                )}
              </div>

              <div>
                <strong>
                  {user?.nickname ||
                    "로그인이 필요합니다."}
                </strong>

                <span>
                  프로필 이미지와 닉네임은
                  내 프로필 정보와 연동됩니다.
                </span>
              </div>
            </div>

            <div className="register-section">
              <label htmlFor="title">
                멘토링 제목
              </label>

              <input
                id="title"
                name="title"
                value={registerForm.title}
                onChange={handleRegisterChange}
                placeholder="예) Spring Boot 백엔드 개발 멘토링"
                maxLength={100}
                required
              />
            </div>

            <div className="register-section">
              <label htmlFor="career">
                경력
              </label>

              <input
                id="career"
                name="career"
                value={registerForm.career}
                onChange={handleRegisterChange}
                placeholder="예) 백엔드 개발 5년차"
                required
              />
            </div>

            <div className="register-section">
              <label htmlFor="careerDetail">
                경력 상세
              </label>

              <textarea
                id="careerDetail"
                name="careerDetail"
                value={registerForm.careerDetail}
                onChange={handleRegisterChange}
                placeholder="근무 경험, 주요 업무, 사용 기술 등을 작성해주세요."
                rows={4}
              />
            </div>

            <div className="register-section">
              <label htmlFor="certificates">
                자격증
              </label>

              <input
                id="certificates"
                name="certificates"
                value={registerForm.certificates}
                onChange={handleRegisterChange}
                placeholder="예) 정보처리기사, SQLD"
              />

              <small>
                여러 개라면 쉼표(,)로 구분해주세요.
              </small>
            </div>

            <div className="register-section">
              <label>주요 기술</label>

              <div className="check-grid skills-grid">
                {skillOptions.map((skill) => (
                  <label
                    className={`check-item ${
                      registerForm.skills.includes(
                        skill
                      )
                        ? "selected"
                        : ""
                    }`}
                    key={skill}
                  >
                    <input
                      type="checkbox"
                      checked={registerForm.skills.includes(
                        skill
                      )}
                      onChange={() =>
                        toggleRegisterArray(
                          "skills",
                          skill
                        )
                      }
                    />

                    <span>{skill}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="register-section">
              <label>
                주로 상담 가능한 분야
              </label>

              <div className="check-grid">
                {consultationTypes.map((type) => (
                  <label
                    className={`check-item ${
                      registerForm.consultationTypes.includes(
                        type
                      )
                        ? "selected"
                        : ""
                    }`}
                    key={type}
                  >
                    <input
                      type="checkbox"
                      checked={registerForm.consultationTypes.includes(
                        type
                      )}
                      onChange={() =>
                        toggleRegisterArray(
                          "consultationTypes",
                          type
                        )
                      }
                    />

                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="register-section">
              <label>멘토링 방식</label>

              <div className="day-grid">
                {["온라인", "오프라인"].map(
                  (type) => (
                    <button
                      type="button"
                      className={
                        registerForm.mentoringType ===
                        type
                          ? "active"
                          : ""
                      }
                      key={type}
                      onClick={() =>
                        setRegisterForm(
                          (prev) => ({
                            ...prev,
                            mentoringType: type
                          })
                        )
                      }
                    >
                      {type}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="register-section">
              <label htmlFor="github">
                GitHub
              </label>

              <input
                id="github"
                name="github"
                value={registerForm.github}
                onChange={handleRegisterChange}
                placeholder="https://github.com/..."
              />
            </div>

            <div className="register-section">
              <label htmlFor="velog">
                Velog
              </label>

              <input
                id="velog"
                name="velog"
                value={registerForm.velog}
                onChange={handleRegisterChange}
                placeholder="https://velog.io/@..."
              />
            </div>

            <div className="register-section">
              <label htmlFor="portfolio">
                Portfolio
              </label>

              <input
                id="portfolio"
                name="portfolio"
                value={registerForm.portfolio}
                onChange={handleRegisterChange}
                placeholder="포트폴리오 주소"
              />
            </div>

            <div className="register-section">
              <label htmlFor="introduction">
                멘토 소개
              </label>

              <textarea
                id="introduction"
                name="introduction"
                value={
                  registerForm.introduction
                }
                onChange={handleRegisterChange}
                placeholder="어떤 개발 경험이 있고 어떤 도움을 줄 수 있는지 작성해주세요."
                rows={5}
                maxLength={1000}
                required
              />
            </div>

            <div className="register-section">
              <label htmlFor="price">
                1회 상담 가격
              </label>

              <div className="price-input">
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  value={registerForm.price}
                  onChange={handleRegisterChange}
                  placeholder="30000"
                  required
                />

                <span>원</span>
              </div>
            </div>

            <div className="register-section">
              <label>상담 가능 요일</label>

              <div className="day-grid">
                {weekDays.map((day) => (
                  <button
                    type="button"
                    className={
                      registerForm.availableDays.includes(
                        day
                      )
                        ? "active"
                        : ""
                    }
                    key={day}
                    onClick={() =>
                      toggleRegisterArray(
                        "availableDays",
                        day
                      )
                    }
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* 상담 가능한 날짜 */}
            <div className="register-section">
              <label>
                상담 가능한 날짜
              </label>

              <small className="register-calendar-description">
                실제로 상담이 가능한 날짜를
                선택해주세요. 여러 날짜를 선택할
                수 있습니다.
              </small>

              <div className="mentor-register-calendar">
                <div className="mentor-register-calendar-header">
                  <button
                    type="button"
                    onClick={() =>
                      moveRegisterCalendarMonth(
                        -1
                      )
                    }
                  >
                    ‹
                  </button>

                  <strong>
                    {registerCalendarDate.getFullYear()}
                    년{" "}
                    {registerCalendarDate.getMonth() +
                      1}
                    월
                  </strong>

                  <button
                    type="button"
                    onClick={() =>
                      moveRegisterCalendarMonth(
                        1
                      )
                    }
                  >
                    ›
                  </button>
                </div>

                <div className="mentor-register-calendar-week">
                  {weekDays.map((day, index) => (
                    <span
                      key={day}
                      className={
                        index === 5
                          ? "saturday"
                          : index === 6
                          ? "sunday"
                          : ""
                      }
                    >
                      {day}
                    </span>
                  ))}
                </div>

                <div className="mentor-register-calendar-grid">
                  {registerCalendarDays.map(
                    (date, index) => {
                      if (!date) {
                        return (
                          <div
                            className="mentor-register-calendar-empty"
                            key={`empty-${index}`}
                          />
                        );
                      }

                      const past =
                        isPastDate(date);
                      const selected =
                        isRegisterDateSelected(
                          date
                        );
                      const today =
                        isToday(date);

                      return (
                        <button
                          type="button"
                          key={formatDateString(
                            date
                          )}
                          className={`mentor-register-calendar-day ${
                            past ? "past" : ""
                          } ${
                            selected
                              ? "selected"
                              : ""
                          } ${
                            today ? "today" : ""
                          }`}
                          disabled={past}
                          onClick={() =>
                            toggleAvailableDate(
                              date
                            )
                          }
                        >
                          <span>
                            {date.getDate()}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>

                <div className="mentor-register-calendar-selected">
                  <span>
                    선택한 상담 가능 날짜
                  </span>

                  {registerForm.availableDates
                    .length > 0 ? (
                    <div className="mentor-register-selected-dates">
                      {registerForm.availableDates.map(
                        (date) => (
                          <button
                            type="button"
                            key={date}
                            onClick={() => {
                              const selectedDate =
                                new Date(
                                  `${date}T00:00:00`
                                );

                              toggleAvailableDate(
                                selectedDate
                              );
                            }}
                          >
                            {date.replaceAll(
                              "-",
                              "."
                            )}{" "}
                            ×
                          </button>
                        )
                      )}
                    </div>
                  ) : (
                    <p>
                      상담 가능한 날짜를
                      선택해주세요.
                    </p>
                  )}
                </div>

                <div className="mentor-register-calendar-guide">
                  <span>● 선택 가능</span>
                  <span>● 선택됨</span>
                  <span>○ 지난 날짜</span>
                </div>
              </div>
            </div>

            <div className="reservation-row">
              <label>
                시작 시간

                <input
                  type="time"
                  name="availableStart"
                  value={
                    registerForm.availableStart
                  }
                  onChange={handleRegisterChange}
                />
              </label>

              <label>
                종료 시간

                <input
                  type="time"
                  name="availableEnd"
                  value={
                    registerForm.availableEnd
                  }
                  onChange={handleRegisterChange}
                />
              </label>
            </div>

            <div className="register-notice">
              <strong>
                {isEditingMentor
                  ? "멘토 정보를 수정합니다."
                  : "멘토 등록 전 확인해주세요."}
              </strong>

              <p>
                등록한 경력과 자격증 정보는 다른
                사용자가 멘토를 선택할 때 확인할 수
                있습니다. 상담 가능한 날짜와 시간도
                예약 과정에서 사용됩니다.
              </p>
            </div>

            <button
              type="submit"
              className="register-submit-button"
            >
              {isEditingMentor
                ? "멘토 정보 수정하기 →"
                : "멘토 등록하기 →"}
            </button>

            {isEditingMentor && (
              <button
                type="button"
                className="mentor-delete-button"
                onClick={handleDeleteMentor}
              >
                멘토 등록 삭제
              </button>
            )}

            <button
              type="button"
              className="mentor-cancel-button"
              onClick={() =>
                setShowRegister(false)
              }
            >
              취소
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

export default Mentoring;