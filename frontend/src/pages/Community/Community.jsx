import { useEffect, useMemo, useState } from "react";
import "./Community.css";
import communityBg from "../../assets/images/community-bg.jpg";
import CommunityWrite from "../CommunityWrite/CommunityWrite";
import CommunityDetail from "../CommunityDetail/CommunityDetail";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

function Community() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routePostId } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [scrollY, setScrollY] = useState(0);

  const [selectedPost, setSelectedPost] = useState(null);
  const [showWritePage, setShowWritePage] = useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState("전체");

  const [sortType, setSortType] = useState("latest");

  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 10;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingLogin, setCheckingLogin] = useState(true);

  const categories = [
    { name: "전체", icon: "" },
    { name: "공부인증", icon: "🔥" },
    { name: "질문", icon: "❓" },
    { name: "정보공유", icon: "💡" },
    { name: "취업", icon: "💼" },
  ];

  /* =====================================================
     로그인 상태 확인
  ===================================================== */

  const checkLoginStatus = async () => {
    try {
      setCheckingLogin(true);

      const response = await fetch(
        `${API_BASE_URL}/member/me`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        setIsLoggedIn(false);
        setCurrentUser(null);
        return;
      }

      const data = await response.json();

      setIsLoggedIn(true);
      setCurrentUser(data);
    } catch (error) {
      console.error("로그인 상태 확인 오류:", error);

      setIsLoggedIn(false);
      setCurrentUser(null);
    } finally {
      setCheckingLogin(false);
    }
  };

  /* =====================================================
     게시글 목록 조회
  ===================================================== */

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/community/posts`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(
          "게시글을 불러오지 못했습니다."
        );
      }

      const data = await response.json();

      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("게시글 조회 오류:", err);

      setError(
        err.message ||
          "게시글을 불러오는 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     글쓰기 버튼
  ===================================================== */

  const handleWriteClick = () => {
    if (checkingLogin) {
      return;
    }

    if (!isLoggedIn) {
      alert("로그인 후 이용 가능합니다.");
      return;
    }

    navigate("/community/write");
  };

  /* =====================================================
     게시글 상세 조회
  ===================================================== */

  const fetchPostDetail = async (postId) => {
    if (!postId) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/community/posts/${postId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(
          "게시글을 불러오지 못했습니다."
        );
      }

      const data = await response.json();

      setSelectedPost(data);

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === data.id
            ? {
                ...post,
                ...data,
              }
            : post
        )
      );
    } catch (err) {
      console.error(
        "게시글 상세 조회 오류:",
        err
      );

      alert(
        err.message ||
          "게시글을 불러오지 못했습니다."
      );
    }
  };

  /* =====================================================
     날짜
  ===================================================== */

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleDateString(
      "ko-KR"
    );
  };

  /* =====================================================
     이미지 URL
  ===================================================== */

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return "";
    }

    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://") ||
      imageUrl.startsWith("data:")
    ) {
      return imageUrl;
    }

    if (imageUrl.startsWith("/")) {
      return `${API_BASE_URL}${imageUrl}`;
    }

    return `${API_BASE_URL}/${imageUrl}`;
  };

  /* =====================================================
     카테고리
  ===================================================== */

  const getCategory = (post) => {
    return (
      post?.category ||
      post?.categoryName ||
      "정보공유"
    );
  };

  const getCategoryClass = (category) => {
    const categoryClassMap = {
      공부인증: "study-cert",
      질문: "question",
      정보공유: "info",
      취업: "job",
    };

    return (
      categoryClassMap[category] ||
      "info"
    );
  };

  /* =====================================================
     필터 + 정렬
  ===================================================== */

  const filteredPosts = useMemo(() => {
    return [...posts]
      .filter((post) => {
        if (selectedCategory === "전체") {
          return true;
        }

        return (
          getCategory(post) ===
          selectedCategory
        );
      })
      .sort((a, b) => {
        if (sortType === "popular") {
          return (
            Number(b.likeCount || 0) -
            Number(a.likeCount || 0)
          );
        }

        if (sortType === "comments") {
          return (
            Number(b.commentCount || 0) -
            Number(a.commentCount || 0)
          );
        }

        return (
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
        );
      });
  }, [
    posts,
    selectedCategory,
    sortType,
  ]);

  /* =====================================================
     페이지네이션
  ===================================================== */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  );

  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;

    return filteredPosts.slice(
      start,
      start + POSTS_PER_PAGE
    );
  }, [filteredPosts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, sortType]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  /* =====================================================
     인기 게시글
  ===================================================== */

  const trendingPosts = useMemo(() => {
    return [...posts]
      .sort(
        (a, b) =>
          Number(b.likeCount || 0) -
          Number(a.likeCount || 0)
      )
      .slice(0, 4);
  }, [posts]);

  /* =====================================================
     최초 실행
  ===================================================== */

  useEffect(() => {
    fetchPosts();
    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (routePostId) {
      fetchPostDetail(routePostId);
      return;
    }

    setSelectedPost(null);
    setShowWritePage(location.pathname === "/community/write");
  }, [routePostId, location.pathname]);

  /* =====================================================
     스크롤
  ===================================================== */

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  /* =====================================================
     글쓰기 화면
  ===================================================== */

  if (showWritePage) {
    return (
      <CommunityWrite
        currentUser={currentUser}
        onClose={async () => {
          navigate("/community");
        }}
        onCreated={async () => {
          navigate("/community");
        }}
      />
    );
  }

  /* =====================================================
     상세 화면
  ===================================================== */

  if (selectedPost) {
    return (
      <CommunityDetail
        post={selectedPost}
        currentUser={currentUser}
        isLoggedIn={isLoggedIn}
        getImageUrl={getImageUrl}
        onClose={async () => {
          navigate("/community");
        }}
        onUpdated={async (updatedPost) => {
          if (updatedPost) {
            setPosts((prevPosts) =>
              prevPosts.map((post) =>
                post.id === updatedPost.id
                  ? {
                      ...post,
                      ...updatedPost,
                    }
                  : post
              )
            );

            setSelectedPost((prevPost) =>
              prevPost
                ? {
                    ...prevPost,
                    ...updatedPost,
                  }
                : updatedPost
            );
          } else {
            await fetchPosts();
          }
        }}
        onDeleted={async () => {
          navigate("/community");
        }}
      />
    );
  }

  return (
    <main className="community-page">

      {/* HERO */}

      <section className="community-hero">

        <div
          className="community-hero-bg"
          style={{
            backgroundImage: `url(${communityBg})`,
            transform:
              `scale(1.08) translateY(${scrollY * 0.15}px)`,
          }}
        />

        <div className="community-hero-overlay" />

        <div className="community-hero-content">

          <span className="community-eyebrow">
            EASYS COMMUNITY
          </span>

          <h1>커뮤니티</h1>

          <p>
            함께 공부하고 자유롭게 소통하며
            <br />
            지식을 나눠보세요.
          </p>

        </div>

      </section>

      {/* CONTENT */}

      <section className="community-content">

        <div className="community-top">

          <div>
            <span className="section-label">
              DEVELOPER COMMUNITY
            </span>

            <h2>
              개발자들과 함께 이야기해보세요.
            </h2>

            <p>
              공부한 내용을 공유하고 궁금한 점을
              질문해보세요.
            </p>
          </div>

          {!checkingLogin && isLoggedIn && (
            <button
              type="button"
              className="community-write-button"
              onClick={handleWriteClick}
            >
              + 글 작성하기
            </button>
          )}

        </div>

        {/* CATEGORY */}

        <div className="community-category">

          {categories.map((category) => (
            <button
              type="button"
              key={category.name}
              className={
                `community-category-button ${
                  selectedCategory === category.name
                    ? "active"
                    : ""
                }`
              }
              onClick={() =>
                setSelectedCategory(
                  category.name
                )
              }
            >
              {category.icon && (
                <span className="category-icon">
                  {category.icon}
                </span>
              )}

              {category.name}
            </button>
          ))}

        </div>

        {/* LAYOUT */}

        <div className="community-layout">

          {/* FEED */}

          <div className="community-feed">

            <div className="feed-heading">

              <div>

                <span className="feed-label">
                  COMMUNITY FEED
                </span>

                <h3>
                  {selectedCategory === "전체"
                    ? "최근 이야기"
                    : `${selectedCategory} 이야기`}
                </h3>

              </div>

              <select
                className="feed-sort"
                value={sortType}
                onChange={(event) =>
                  setSortType(
                    event.target.value
                  )
                }
              >
                <option value="latest">
                  최신순
                </option>

                <option value="popular">
                  인기순
                </option>

                <option value="comments">
                  댓글순
                </option>
              </select>

            </div>

            {/* LOADING */}

            {loading && (
              <div className="community-message">
                <div className="message-icon">
                  ⏳
                </div>

                게시글을 불러오는 중...
              </div>
            )}

            {/* ERROR */}

            {!loading && error && (
              <div className="community-message error">

                <div className="message-icon">
                  ⚠️
                </div>

                <p>{error}</p>

                <button
                  type="button"
                  onClick={fetchPosts}
                >
                  다시 시도
                </button>

              </div>
            )}

            {/* EMPTY */}

            {!loading &&
              !error &&
              filteredPosts.length === 0 && (
                <div className="community-message">

                  <div className="message-icon">
                    📝
                  </div>

                  <p>
                    작성된 게시글이 없습니다.
                  </p>

                  {isLoggedIn && (
                    <button
                      type="button"
                      onClick={handleWriteClick}
                    >
                      첫 글 작성하기
                    </button>
                  )}

                </div>
              )}

            {/* POSTS */}

            {!loading &&
              !error &&
              paginatedPosts.map((post) => {

                const category =
                  getCategory(post);

                const categoryClass =
                  getCategoryClass(category);

                const author =
                  post.author ||
                  post.nickname ||
                  "알 수 없음";

                return (
                  <article
                    className="community-post"
                    key={post.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/community/${post.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(`/community/${post.id}`);
                      }
                    }}
                  >

                    <div className="post-user">

                      <div className="post-avatar">
                        {author.charAt(0)}
                      </div>

                      <div>

                        <strong>
                          {author}
                        </strong>

                        <span>
                          {formatDate(
                            post.createdAt
                          )}
                        </span>

                      </div>

                    </div>

                    <span
                      className={
                        `post-category ${categoryClass}`
                      }
                    >
                      {category}
                    </span>

                    <h3>
                      {post.title ||
                        "제목 없음"}
                    </h3>

                    <p>
                      {post.content ||
                        "내용이 없습니다."}
                    </p>

                    {Array.isArray(post.images) &&
                      post.images.length > 0 && (
                        <div className="post-image-preview">

                          {post.images
                            .slice(0, 3)
                            .map(
                              (image, index) => (
                                <img
                                  key={`${post.id}-${index}`}
                                  src={getImageUrl(image)}
                                  alt={
                                    `${post.title || "게시글"} 이미지 ${
                                      index + 1
                                    }`
                                  }
                                  loading="lazy"
                                />
                              )
                            )}

                        </div>
                      )}

                    <div className="post-bottom">

                      <div className="post-stats">

                        <span className="post-like-count">
                          <svg
                            className="post-stat-icon"
                            viewBox="0 0 24 24"
                            width="17"
                            height="17"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M12 20.5s-7.5-4.6-10-9.2C0.3 8 1.7 4.5 5 3.4c2.2-0.7 4.4 0.2 5.6 1.9L12 6.8l1.4-1.5c1.2-1.7 3.4-2.6 5.6-1.9 3.3 1.1 4.7 4.6 3 7.9-2.5 4.6-10 9.2-10 9.2z" />
                          </svg>{" "}
                          {Number(
                            post.likeCount || 0
                          )}
                        </span>

                        <span>
                          <svg
                            className="post-stat-icon"
                            viewBox="0 0 24 24"
                            width="17"
                            height="17"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>{" "}
                          {Number(
                            post.commentCount || 0
                          )}
                        </span>

                        <span>
                          <svg
                            className="post-stat-icon"
                            viewBox="0 0 24 24"
                            width="17"
                            height="17"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M1 12s4-7.5 11-7.5S23 12 23 12s-4 7.5-11 7.5S1 12 1 12z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>{" "}
                          {Number(
                            post.viewCount || 0
                          )}
                        </span>

                      </div>

                      <button
                        type="button"
                        className="post-detail-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/community/${post.id}`);
                        }}
                      >
                        자세히 보기 →
                      </button>

                    </div>

                  </article>
                );
              })}

            {/* PAGINATION */}

            {!loading &&
              !error &&
              filteredPosts.length > 0 &&
              totalPages > 1 && (
                <div className="community-pagination">

                  <button
                    type="button"
                    className="pagination-arrow"
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.max(1, page - 1)
                      )
                    }
                    disabled={currentPage === 1}
                  >
                    ← 이전
                  </button>

                  <div className="pagination-numbers">
                    {Array.from(
                      { length: totalPages },
                      (_, index) => index + 1
                    ).map((page) => (
                      <button
                        type="button"
                        key={page}
                        className={
                          `pagination-number ${
                            currentPage === page
                              ? "active"
                              : ""
                          }`
                        }
                        onClick={() =>
                          setCurrentPage(page)
                        }
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="pagination-arrow"
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(totalPages, page + 1)
                      )
                    }
                    disabled={currentPage === totalPages}
                  >
                    다음 →
                  </button>

                </div>
              )}

          </div>

          {/* SIDEBAR */}

          <aside className="community-sidebar">

            <div className="sidebar-card study-card">

              <span className="sidebar-label">
                🔥 TODAY
              </span>

              <h3>
                오늘도 공부하고 있나요?
              </h3>

              <p>
                오늘 공부한 내용을
                기록해보세요.
              </p>

              {isLoggedIn && (
                <button
                  type="button"
                  onClick={handleWriteClick}
                >
                  공부 인증하기 →
                </button>
              )}

            </div>

            <div className="sidebar-card">

              <span className="sidebar-label">
                TRENDING
              </span>

              <h3>
                지금 인기있는 이야기
              </h3>

              <div className="trending-list">

                {trendingPosts.length === 0 ? (
                  <div className="trending-empty">
                    아직 게시글이 없습니다.
                  </div>
                ) : (
                  trendingPosts.map(
                    (post, index) => (
                      <button
                        type="button"
                        className="trending-item"
                        key={post.id}
                        onClick={() =>
                          fetchPostDetail(post.id)
                        }
                      >

                        <strong>
                          {String(index + 1).padStart(
                            2,
                            "0"
                          )}
                        </strong>

                        <span>
                          {post.title ||
                            "제목 없음"}
                        </span>

                      </button>
                    )
                  )
                )}

              </div>

            </div>

          </aside>

        </div>

      </section>

    </main>
  );
}

export default Community;
