import { useEffect, useState } from "react";
import "./Study.css";
import studyBg from "../../assets/images/study-bg.jpg";

function Study() {

  // 서버에서 가져온 스터디 목록
  const [studies, setStudies] = useState([]);

  // 검색어
  const [keyword, setKeyword] = useState("");

  // 선택한 분야
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  // 로딩 상태
  const [loading, setLoading] = useState(true);

  // 오류 메시지
  const [error, setError] = useState("");


  // =====================================================
  // 서버에서 스터디 목록 가져오기
  // GET /study
  // =====================================================

  useEffect(() => {

    fetch("/api/study")

      .then((response) => {

        if (!response.ok) {
          throw new Error("스터디 목록을 불러오지 못했습니다.");
        }

        return response.json();
      })

      .then((data) => {

        console.log("스터디 목록:", data);

        setStudies(data);
        setLoading(false);
      })

      .catch((error) => {

        console.error(error);

        setError(error.message);
        setLoading(false);
      });

  }, []);


  // =====================================================
  // 분야 목록
  // =====================================================

  const subjects = [
    "HTML",
    "CSS",
    "Java",
    "JavaScript",
    "Spring",
    "React",
    "SQL",
    "DB",
    "Python",
  ];


  // =====================================================
  // 분야 선택
  // =====================================================

  const handleSubjectChange = (subject) => {

    setSelectedSubjects((prev) => {

      if (prev.includes(subject)) {

        return prev.filter(
          (item) => item !== subject
        );

      }

      return [...prev, subject];

    });

  };


  // =====================================================
  // 화면에 보여줄 스터디 필터링
  // =====================================================

  const filteredStudies = studies.filter((study) => {

    // 검색어
    const searchText =
      `${study.title} ${study.content}`
        .toLowerCase();

    const matchKeyword =
      searchText.includes(
        keyword.toLowerCase()
      );


    // 분야
    const matchSubject =
      selectedSubjects.length === 0 ||
      selectedSubjects.some(
        (subject) =>
          study.category.trim().toLowerCase()
          === subject.toLowerCase()
      );


    return matchKeyword && matchSubject;

  });


  // =====================================================
  // 화면
  // =====================================================

  return (

    <main className="study-page">


      {/* =========================
          HERO
      ========================= */}

      <section className="study-hero">

        <div
          className="study-hero-bg"
          style={{
            backgroundImage:
              `url(${studyBg})`
          }}
        />

        <div className="study-hero-overlay" />

        <div className="study-hero-content">

          <span className="study-eyebrow">
            EASYS STUDY
          </span>

          <h1>
            스터디 모음
          </h1>

          <p>
            함께 공부할 사람을 찾고
            <br />
            새로운 스터디를 시작해보세요.
          </p>

        </div>

      </section>



      {/* =========================
          CONTENT
      ========================= */}

      <section className="study-content">


        {/* =========================
            상단
        ========================= */}

        <div className="study-top">

          <div>

            <span className="section-label">
              STUDY GROUP
            </span>

            <h2>
              함께 공부할 스터디
            </h2>

            <p className="study-description">
              관심 있는 과목을 선택하고
              나에게 맞는 스터디를 찾아보세요.
            </p>

          </div>


          <button
            className="create-study-button"
            onClick={() => {

              // 나중에 스터디 생성 페이지 연결
              alert("스터디 생성 페이지는 준비 중입니다.");

            }}
          >
            + 스터디 만들기
          </button>

        </div>



        {/* =========================
            분야 필터
        ========================= */}

        <div className="study-filter-box">

          <div className="study-filter-title">

            <div>

              <strong>
                어떤 공부를 찾고 있나요?
              </strong>

              <span>
                여러 과목을 동시에 선택할 수 있습니다.
              </span>

            </div>


            {selectedSubjects.length > 0 && (

              <button
                className="filter-reset"
                onClick={() =>
                  setSelectedSubjects([])
                }
              >
                선택 초기화
              </button>

            )}

          </div>



          <div className="study-filter-list">

            {subjects.map((subject) => (

              <label
                className={`study-check ${
                  selectedSubjects.includes(subject)
                    ? "checked"
                    : ""
                }`}
                key={subject}
              >

                <input
                  type="checkbox"
                  checked={
                    selectedSubjects.includes(subject)
                  }
                  onChange={() =>
                    handleSubjectChange(subject)
                  }
                />

                <span className="custom-check"></span>

                <span>
                  {subject}
                </span>

              </label>

            ))}

          </div>

        </div>



        {/* =========================
            검색
        ========================= */}

        <div className="study-search-row">

          <div className="study-search">

            <span>
              ⌕
            </span>

            <input
              type="text"
              placeholder="스터디 이름이나 내용을 검색해보세요."
              value={keyword}
              onChange={(e) =>
                setKeyword(e.target.value)
              }
            />

          </div>


          <select className="study-sort">

            <option>
              최신순
            </option>

            <option>
              마감 임박순
            </option>

            <option>
              참여자 많은순
            </option>

          </select>

        </div>



        {/* =========================
            결과
        ========================= */}

        <div className="study-result-header">

          <strong>
            스터디
          </strong>

          <span>
            총 {filteredStudies.length}개의 스터디
          </span>

        </div>



        {/* =========================
            로딩
        ========================= */}

        {loading && (

          <div>
            스터디를 불러오는 중입니다...
          </div>

        )}



        {/* =========================
            오류
        ========================= */}

        {!loading && error && (

          <div>

            <p>
              {error}
            </p>

            <button
              onClick={() =>
                window.location.reload()
              }
            >
              다시 시도
            </button>

          </div>

        )}



        {/* =========================
            스터디 목록
        ========================= */}

        {!loading &&
          !error &&
          filteredStudies.length === 0 && (

            <div>

              <p>
                조건에 맞는 스터디가 없습니다.
              </p>

            </div>

          )}



        {!loading &&
          !error &&
          filteredStudies.length > 0 && (

            <div className="study-grid">

              {filteredStudies.map((study) => (

                <article
                  className="study-card"
                  key={study.id}
                >


                  {/* 카드 상단 */}

                  <div className="study-card-top">

                    <div className="study-tags">

                      <span>
                        {study.category}
                      </span>

                    </div>


                    <span className="study-status">

                      {study.status === "RECRUITING"
                        ? "모집중"
                        : "모집완료"}

                    </span>

                  </div>



                  {/* 제목 */}

                  <h3>
                    {study.title}
                  </h3>



                  {/* 내용 */}

                  <p>
                    {study.content}
                  </p>



                  {/* 스터디 정보 */}

                  <div className="study-info">

                    <span>
                      👥 {study.currentMembers}
                      /
                      {study.maxMembers}명
                    </span>

                    <span>
                      👤 {study.nickname}
                    </span>

                  </div>



                  {/* 하단 */}

                  <div className="study-card-bottom">

                    <span>
                      {study.category}
                    </span>


                    <button
                      onClick={() => {

                        window.location.href =
                          `/study-detail?id=${study.id}`;

                      }}
                    >
                      자세히 보기 →
                    </button>

                  </div>


                </article>

              ))}

            </div>

          )}

      </section>

    </main>

  );

}

export default Study;