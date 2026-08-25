import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import "./Study.css";

import studyBg
  from "../../assets/images/study-bg.jpg";


function Study() {

  const navigate = useNavigate();


  // =====================================================
  // 상태
  // =====================================================

  const [studies, setStudies] =
    useState([]);

  const [keyword, setKeyword] =
    useState("");

  const [sortType, setSortType] =
    useState("latest");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [scrollY, setScrollY] =
    useState(0);


  // =====================================================
  // 스크롤
  // =====================================================

  useEffect(() => {

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true
      }
    );

    return () => {

      window.removeEventListener(
        "scroll",
        handleScroll
      );

    };

  }, []);


  // =====================================================
  // 스터디 목록 가져오기
  // =====================================================

  useEffect(() => {

    loadStudies();

  }, []);


  const loadStudies = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await fetch(
          "/api/study",
          {
            credentials: "include"
          }
        );

      console.log(
        "스터디 목록 상태:",
        response.status
      );

      const text =
        await response.text();

      console.log(
        "스터디 목록 응답:",
        text
      );

      if (!response.ok) {

        throw new Error(
          text ||
          "스터디 목록을 불러오지 못했습니다."
        );

      }

      let data = [];

      try {

        data =
          text
            ? JSON.parse(text)
            : [];

      } catch (jsonError) {

        console.error(
          "스터디 목록 JSON 변환 실패:",
          jsonError
        );

        throw new Error(
          "서버에서 올바른 데이터를 받지 못했습니다."
        );

      }

      console.log(
        "스터디 목록:",
        data
      );

      setStudies(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (error) {

      console.error(
        "스터디 목록 조회 오류:",
        error
      );

      setError(
        error.message ||
        "스터디 목록을 불러오지 못했습니다."
      );

    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // 검색 / 정렬
  // =====================================================

  const filteredStudies =
    useMemo(() => {

      const searchText =
        keyword
          .trim()
          .toLowerCase();

      let result =
        studies.filter(
          (study) => {

            if (
              searchText === ""
            ) {
              return true;
            }

            const title =
              study.title
                ?.toLowerCase() || "";

            const content =
              study.content
                ?.toLowerCase() || "";

            const category =
              study.category
                ?.toLowerCase() || "";

            return (
              title.includes(searchText) ||
              content.includes(searchText) ||
              category.includes(searchText)
            );

          }
        );


      // =================================================
      // 최신순
      // =================================================

      if (
        sortType === "latest"
      ) {

        result.sort(
          (a, b) => {

            if (
              a.createdAt &&
              b.createdAt
            ) {

              return (
                new Date(b.createdAt) -
                new Date(a.createdAt)
              );

            }

            return (
              Number(b.id || 0) -
              Number(a.id || 0)
            );

          }
        );

      }


      // =================================================
      // 참여자 많은 순
      // =================================================

      if (
        sortType === "members"
      ) {

        result.sort(
          (a, b) => {

            return (
              Number(
                b.currentMembers || 0
              ) -
              Number(
                a.currentMembers || 0
              )
            );

          }
        );

      }


      // =================================================
      // 마감 임박 순
      // =================================================

      if (
        sortType === "deadline"
      ) {

        result.sort(
          (a, b) => {

            const aRemain =
              Number(
                a.maxMembers || 0
              ) -
              Number(
                a.currentMembers || 0
              );

            const bRemain =
              Number(
                b.maxMembers || 0
              ) -
              Number(
                b.currentMembers || 0
              );

            return (
              aRemain -
              bRemain
            );

          }
        );

      }

      return result;

    }, [
      studies,
      keyword,
      sortType
    ]);


  // =====================================================
  // 스터디 만들기
  // =====================================================

  const handleCreateStudy = () => {

    navigate(
      "/study/create"
    );

  };


  // =====================================================
  // 스터디 상세
  // =====================================================

  const handleStudyDetail = (
    studyId
  ) => {

    if (!studyId) {
      return;
    }

    navigate(
      `/study/${studyId}`
    );

  };


  // =====================================================
  // 검색 초기화
  // =====================================================

  const resetSearch = () => {

    setKeyword("");

    setSortType(
      "latest"
    );

  };


  // =====================================================
  // 화면
  // =====================================================

  return (

    <main className="study-page">

      {/* =================================================
          BACKGROUND DROPS
          Community보다 적게 사용
      ================================================= */}

      <div className="study-drops">

        <span className="study-drop study-drop-1" />
        <span className="study-drop study-drop-2" />
        <span className="study-drop study-drop-3" />
        <span className="study-drop study-drop-4" />

      </div>


      {/* =================================================
          HERO
      ================================================= */}

      <section className="study-hero">

        <div
          className="study-hero-bg"
          style={{
            backgroundImage:
              `url(${studyBg})`,

            transform:
              `scale(1.08) translateY(${scrollY * 0.15}px)`
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


      {/* =================================================
          CONTENT
      ================================================= */}

      <section className="study-content">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="study-top">

          <div>

            <span className="section-label">
              STUDY GROUP
            </span>

            <h2>
              함께 공부할 스터디
            </h2>

            <p className="study-description">
              관심 있는 분야의 스터디를 찾아보세요.
              <br />
              원하는 분야는 자유롭게 검색할 수 있습니다.
            </p>

          </div>


          <button
            type="button"
            className="create-study-button"
            onClick={
              handleCreateStudy
            }
          >
            + 스터디 만들기
          </button>

        </div>


        {/* =================================================
            검색 안내
        ================================================= */}

        <div className="study-filter-box">

          <div className="study-filter-title">

            <div>

              <strong>
                어떤 스터디를 찾고 있나요?
              </strong>

              <span>
                제목, 내용 또는 분야를 자유롭게 검색해보세요.
              </span>

            </div>

          </div>

        </div>


        {/* =================================================
            검색창
        ================================================= */}

        <div className="study-search-row">

          <div className="study-search">

            <span>
              ⌕
            </span>

            <input
              type="text"
              value={keyword}
              onChange={(e) => {

                setKeyword(
                  e.target.value
                );

              }}
              placeholder={
                "예: Java, Spring Boot, Python, 백엔드"
              }
            />

            {keyword && (

              <button
                type="button"
                className="search-clear"
                onClick={() =>
                  setKeyword("")
                }
              >
                ×
              </button>

            )}

          </div>


          <select
            className="study-sort"
            value={sortType}
            onChange={(e) =>
              setSortType(
                e.target.value
              )
            }
          >

            <option value="latest">
              최신순
            </option>

            <option value="deadline">
              마감 임박순
            </option>

            <option value="members">
              참여자 많은순
            </option>

          </select>

        </div>


        {/* =================================================
            검색 결과 헤더
        ================================================= */}

        <div className="study-result-header">

          <div>

            <strong>
              스터디
            </strong>

            <span>

              {keyword
                ? `"${keyword}" 검색 결과`
                : `전체 스터디 ${filteredStudies.length}개`
              }

            </span>

          </div>


          {keyword && (

            <button
              type="button"
              className="search-reset"
              onClick={
                resetSearch
              }
            >
              검색 초기화
            </button>

          )}

        </div>


        {/* =================================================
            로딩
        ================================================= */}

        {loading && (

          <div className="study-empty">

            <div className="study-loading-spinner" />

            <p>
              스터디를 불러오는 중입니다...
            </p>

          </div>

        )}


        {/* =================================================
            오류
        ================================================= */}

        {!loading &&
          error && (

            <div className="study-empty">

              <div className="empty-icon">
                ⚠️
              </div>

              <h3>
                스터디를 불러오지 못했습니다.
              </h3>

              <p>
                {error}
              </p>

              <button
                type="button"
                onClick={
                  loadStudies
                }
              >
                다시 불러오기
              </button>

            </div>

          )}


        {/* =================================================
            결과 없음
        ================================================= */}

        {!loading &&
          !error &&
          filteredStudies.length === 0 && (

            <div className="study-empty">

              <div className="empty-icon">
                📚
              </div>

              <h3>

                {keyword
                  ? "검색 결과가 없습니다."
                  : "등록된 스터디가 없습니다."
                }

              </h3>

              <p>

                {keyword
                  ? "다른 검색어로 다시 검색해보세요."
                  : "첫 번째 스터디를 만들어보세요."
                }

              </p>

              {keyword ? (

                <button
                  type="button"
                  onClick={
                    resetSearch
                  }
                >
                  검색 초기화
                </button>

              ) : (

                <button
                  type="button"
                  onClick={
                    handleCreateStudy
                  }
                >
                  첫 스터디 만들기
                </button>

              )}

            </div>

          )}


        {/* =================================================
            스터디 카드
        ================================================= */}

        {!loading &&
          !error &&
          filteredStudies.length > 0 && (

            <div className="study-grid">

              {filteredStudies.map(
                (study) => (

                  <article
                    className="study-card"
                    key={study.id}
                  >

                    <div className="study-card-top">

                      <div className="study-tags">

                        <span>
                          {study.category ||
                            "스터디"
                          }
                        </span>

                      </div>

                      <span
                        className={
                          `study-status ${
                            study.status ===
                            "RECRUITING"
                              ? "recruiting"
                              : "closed"
                          }`
                        }
                      >

                        {study.status ===
                        "RECRUITING"
                          ? "모집중"
                          : "모집완료"
                        }

                      </span>

                    </div>


                    <h3>
                      {study.title}
                    </h3>


                    <p className="study-card-content">
                      {study.content}
                    </p>


                    <div className="study-info">

                      <span>
                        👥{" "}
                        {study.currentMembers ||
                          0
                        }
                        {" / "}
                        {study.maxMembers ||
                          0
                        }
                        명
                      </span>

                      <span>
                        👤{" "}
                        {study.nickname ||
                          "작성자"
                        }
                      </span>

                    </div>


                    <div className="study-card-bottom">

                      <span>
                        {study.category ||
                          "스터디"
                        }
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleStudyDetail(
                            study.id
                          )
                        }
                      >
                        자세히 보기 →
                      </button>

                    </div>

                  </article>

                )
              )}

            </div>

          )}

      </section>

    </main>

  );
}


export default Study;