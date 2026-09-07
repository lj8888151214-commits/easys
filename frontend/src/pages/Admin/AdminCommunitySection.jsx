import { Fragment, useEffect, useState } from "react";

const API_BASE = "/api";

function formatDate(dateTime) {
  return dateTime.slice(0, 10).replace(/-/g, ".");
}

function AdminCommunitySection() {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState("");

  const [expandedPostId, setExpandedPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const loadPosts = async () => {
    try {
      setLoadingPosts(true);
      setPostsError("");

      const response = await fetch(`${API_BASE}/community/posts`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`게시글 목록을 불러오지 못했습니다. (HTTP ${response.status})`);
      }

      setPosts(await response.json());
    } catch (error) {
      console.error("관리자 게시글 목록 조회 오류:", error);
      setPostsError(error.message || "게시글 목록을 불러오지 못했습니다.");
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleDeletePost = async (post) => {
    if (!window.confirm(`"${post.title}" 게시글을 삭제할까요? (댓글도 함께 삭제됩니다)`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/community/posts/${post.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "삭제에 실패했습니다.");
      }

      if (expandedPostId === post.id) {
        setExpandedPostId(null);
        setComments([]);
      }

      loadPosts();
    } catch (error) {
      console.error("게시글 삭제 오류:", error);
      alert(error.message || "삭제에 실패했습니다.");
    }
  };

  const toggleComments = async (postId) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      setComments([]);
      return;
    }

    setExpandedPostId(postId);
    setLoadingComments(true);

    try {
      const response = await fetch(
        `${API_BASE}/community/posts/${postId}/comments`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error("댓글을 불러오지 못했습니다.");
      }

      setComments(await response.json());
    } catch (error) {
      console.error("댓글 조회 오류:", error);
      alert(error.message || "댓글을 불러오지 못했습니다.");
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleDeleteComment = async (postId, comment) => {
    if (!window.confirm(`"${comment.author}"님의 댓글을 삭제할까요?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/community/posts/${postId}/comments/${comment.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("댓글 삭제에 실패했습니다.");
      }

      setComments((prev) => prev.filter((c) => c.id !== comment.id));
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, commentCount: Math.max(0, post.commentCount - 1) }
            : post
        )
      );
    } catch (error) {
      console.error("댓글 삭제 오류:", error);
      alert(error.message || "댓글 삭제에 실패했습니다.");
    }
  };

  return (
    <section className="admin-section">
      <div className="admin-section-header">
        <h2>커뮤니티 게시글 목록</h2>
      </div>

      {loadingPosts && <p className="admin-state-message">불러오는 중입니다...</p>}
      {!loadingPosts && postsError && (
        <p className="admin-state-message error">{postsError}</p>
      )}

      {!loadingPosts && !postsError && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>제목</th>
                <th>작성자</th>
                <th>카테고리</th>
                <th>조회/좋아요/댓글</th>
                <th>작성일</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <Fragment key={post.id}>
                  <tr>
                    <td className="admin-cell-title">{post.title}</td>
                    <td>{post.author}</td>
                    <td>{post.category}</td>
                    <td>
                      {post.viewCount} / {post.likeCount} / {post.commentCount}
                    </td>
                    <td>{formatDate(post.createdAt)}</td>
                    <td className="admin-row-actions">
                      <button type="button" onClick={() => toggleComments(post.id)}>
                        {expandedPostId === post.id ? "댓글 닫기" : "댓글 보기"}
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleDeletePost(post)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>

                  {expandedPostId === post.id && (
                    <tr>
                      <td colSpan={6} className="admin-comment-panel">
                        {loadingComments && (
                          <p className="admin-state-message">댓글을 불러오는 중입니다...</p>
                        )}

                        {!loadingComments && comments.length === 0 && (
                          <p className="admin-state-message">댓글이 없어요.</p>
                        )}

                        {!loadingComments && comments.length > 0 && (
                          <ul className="admin-comment-list">
                            {comments.map((comment) => (
                              <li key={comment.id}>
                                <div>
                                  <strong>{comment.author}</strong>
                                  <span>{formatDate(comment.createdAt)}</span>
                                </div>
                                <p>{comment.content}</p>
                                <button
                                  type="button"
                                  className="danger"
                                  onClick={() => handleDeleteComment(post.id, comment)}
                                >
                                  삭제
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}

              {posts.length === 0 && (
                <tr>
                  <td colSpan={6} className="admin-state-message">
                    등록된 게시글이 없어요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default AdminCommunitySection;
