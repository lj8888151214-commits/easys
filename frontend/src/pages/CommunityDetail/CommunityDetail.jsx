import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CommunityDetail.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

// 서버 에러 응답(JSON 또는 순수 텍스트)에서
// 사용자에게 보여줄 메시지를 추출
const extractErrorMessage = async (response, fallback) => {
  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => null);
    return data?.message || fallback;
  }

  const text = await response.text().catch(() => "");
  return text || fallback;
};

function CommunityDetail({
  post,
  currentUser,
  isLoggedIn,
  getImageUrl,
  onClose,
  onUpdated,
  onDeleted,
}) {
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(
    Boolean(
      post?.likedByCurrentUser ??
        post?.liked ??
        post?.isLiked ??
        false
    )
  );

  const [likeCount, setLikeCount] = useState(
    Number(post?.likeCount || 0)
  );

  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editTitle, setEditTitle] = useState(
    post?.title || ""
  );

  const [editContent, setEditContent] = useState(
    post?.content || ""
  );


  const [commentCount, setCommentCount] = useState(
    Number(post?.commentCount || 0)
  );

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);

  const [deletingCommentId, setDeletingCommentId] = useState(null);


  /* =====================================================
     작성자
  ===================================================== */

  const author =
    post?.author ||
    post?.nickname ||
    "알 수 없음";

  const category =
    post?.category ||
    post?.categoryName ||
    "정보공유";


  /* =====================================================
     현재 사용자가 작성자인지 확인
  ===================================================== */

  const isAuthor = () => {
    if (!post || !currentUser || !isLoggedIn) {
      return false;
    }

    /*
     * 백엔드에서 직접 작성자 여부를 내려주는 경우
     */
    if (typeof post.isAuthor === "boolean") {
      return post.isAuthor;
    }

    /*
     * 게시글 작성자 ID
     */
    const authorId =
      post.authorId ??
      post.memberId ??
      post.userId;

    /*
     * 현재 로그인 사용자 ID
     */
    const currentUserId =
      currentUser.id ??
      currentUser.memberId ??
      currentUser.userId;

    /*
     * ID가 둘 다 존재하면 ID 비교
     */
    if (
      authorId !== undefined &&
      authorId !== null &&
      currentUserId !== undefined &&
      currentUserId !== null
    ) {
      return (
        String(authorId) ===
        String(currentUserId)
      );
    }

    /*
     * ID가 없는 경우 이메일 비교
     */
    const authorEmail =
      post.authorEmail ??
      post.email;

    const currentUserEmail =
      currentUser.email;

    if (
      authorEmail &&
      currentUserEmail
    ) {
      return (
        authorEmail ===
        currentUserEmail
      );
    }

    /*
     * 마지막으로 닉네임 비교
     */
    const authorNickname =
      post.author ??
      post.nickname;

    const currentNickname =
      currentUser.nickname;

    if (
      authorNickname &&
      currentNickname
    ) {
      return (
        authorNickname ===
        currentNickname
      );
    }

    return false;
  };


  /* =====================================================
     현재 사용자가 댓글 작성자인지 확인
  ===================================================== */

  const isCommentAuthor = (comment) => {
    if (!comment || !currentUser || !isLoggedIn) {
      return false;
    }

    const authorId = comment.authorId;

    const currentUserId =
      currentUser.id ??
      currentUser.memberId ??
      currentUser.userId;

    if (
      authorId !== undefined &&
      authorId !== null &&
      currentUserId !== undefined &&
      currentUserId !== null
    ) {
      return (
        String(authorId) ===
        String(currentUserId)
      );
    }

    return Boolean(
      comment.author &&
        currentUser.nickname &&
        comment.author === currentUser.nickname
    );
  };


  /* =====================================================
     날짜
  ===================================================== */

  const formatDateTime = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleString(
      "ko-KR"
    );
  };


  /* =====================================================
     좋아요
  ===================================================== */

  const handleLike = async () => {
    if (!isLoggedIn) {
      const goLogin = window.confirm(
        "좋아요는 로그인 후 이용할 수 있습니다.\n로그인 페이지로 이동할까요?"
      );

      if (goLogin) {
        navigate("/login");
      }

      return;
    }

    if (liking || !post?.id) {
      return;
    }

    try {
      setLiking(true);

      const response = await fetch(
        `${API_BASE_URL}/community/posts/${post.id}/like`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const message = await extractErrorMessage(
          response,
          "좋아요 처리에 실패했습니다."
        );

        throw new Error(message);
      }

      const data =
        await response.json();

      let nextLiked;
      let nextLikeCount;

      if (
        data &&
        typeof data === "object"
      ) {
        if (
          data.liked !== undefined
        ) {
          nextLiked =
            Boolean(data.liked);
        } else if (
          data.isLiked !== undefined
        ) {
          nextLiked =
            Boolean(data.isLiked);
        } else {
          nextLiked = !isLiked;
        }

        if (
          data.likeCount !== undefined
        ) {
          nextLikeCount =
            Number(data.likeCount);
        } else {
          nextLikeCount = nextLiked
            ? likeCount + 1
            : Math.max(
                0,
                likeCount - 1
              );
        }
      } else {
        nextLiked = !isLiked;

        nextLikeCount = nextLiked
          ? likeCount + 1
          : Math.max(
              0,
              likeCount - 1
            );
      }

      setIsLiked(nextLiked);
      setLikeCount(nextLikeCount);

      if (onUpdated) {
        await onUpdated({
          ...post,
          likeCount: nextLikeCount,
          liked: nextLiked,
          isLiked: nextLiked,
          likedByCurrentUser: nextLiked,
        });
      }
    } catch (error) {
      console.error(
        "좋아요 오류:",
        error
      );

      alert(
        error.message ||
          "좋아요 처리에 실패했습니다."
      );
    } finally {
      setLiking(false);
    }
  };


  /* =====================================================
     수정
  ===================================================== */

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!isLoggedIn) {
      alert(
        "로그인 후 이용할 수 있습니다."
      );
      return;
    }

    if (!isAuthor()) {
      alert(
        "작성자만 게시글을 수정할 수 있습니다."
      );
      return;
    }

    if (!editTitle.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!editContent.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    if (saving) {
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_BASE_URL}/community/posts/${post.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title: editTitle.trim(),
            content: editContent.trim(),
          }),
        }
      );

      if (!response.ok) {
        const message = await extractErrorMessage(
          response,
          "게시글 수정에 실패했습니다."
        );

        throw new Error(message);
      }

      const updatedPost =
        await response.json().catch(
          () => null
        );

      const finalPost =
        updatedPost || {
          ...post,
          title: editTitle.trim(),
          content: editContent.trim(),
        };

      setShowEdit(false);

      setEditTitle(
        finalPost.title || ""
      );

      setEditContent(
        finalPost.content || ""
      );

      alert(
        "게시글이 수정되었습니다."
      );

      if (onUpdated) {
        await onUpdated(finalPost);
      }
    } catch (error) {
      console.error(
        "게시글 수정 오류:",
        error
      );

      alert(
        error.message ||
          "게시글 수정에 실패했습니다."
      );
    } finally {
      setSaving(false);
    }
  };


  /* =====================================================
     삭제
  ===================================================== */

  const handleDelete = async () => {
    if (!isLoggedIn) {
      alert(
        "로그인 후 이용할 수 있습니다."
      );
      return;
    }

    if (!isAuthor()) {
      alert(
        "작성자만 게시글을 삭제할 수 있습니다."
      );
      return;
    }

    if (deleting) {
      return;
    }

    const confirmed =
      window.confirm(
        "정말 이 게시글을 삭제하시겠습니까?\n삭제한 게시글은 복구할 수 없습니다."
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        `${API_BASE_URL}/community/posts/${post.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const message = await extractErrorMessage(
          response,
          "게시글 삭제에 실패했습니다."
        );

        throw new Error(message);
      }

      alert(
        "게시글이 삭제되었습니다."
      );

      if (onDeleted) {
        await onDeleted();
      }
    } catch (error) {
      console.error(
        "게시글 삭제 오류:",
        error
      );

      alert(
        error.message ||
          "게시글 삭제에 실패했습니다."
      );
    } finally {
      setDeleting(false);
    }
  };


  /* =====================================================
     post 변경 시 상태 동기화
  ===================================================== */

  useEffect(() => {
    if (!post) {
      return;
    }

    setLikeCount(
      Number(post.likeCount || 0)
    );

    setIsLiked(
      Boolean(
        post.likedByCurrentUser ??
          post.liked ??
          post.isLiked ??
          false
      )
    );

    setEditTitle(
      post.title || ""
    );

    setEditContent(
      post.content || ""
    );

    setShowEdit(false);

    setCommentCount(
      Number(post.commentCount || 0)
    );

    setNewComment("");

    setEditingCommentId(null);
    setEditingCommentContent("");
  }, [post]);


  /* =====================================================
     실제 좋아요 상태 조회
     (post 응답에는 현재 사용자의 좋아요 여부가
     들어있지 않으므로 별도 API로 동기화)
  ===================================================== */

  useEffect(() => {
    if (!post?.id || !isLoggedIn) {
      return;
    }

    let cancelled = false;

    const fetchLikeStatus = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/community/posts/${post.id}/like`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok || cancelled) {
          return;
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        setIsLiked(Boolean(data.liked));
        setLikeCount(Number(data.likeCount || 0));
      } catch (error) {
        console.error(
          "좋아요 상태 조회 오류:",
          error
        );
      }
    };

    fetchLikeStatus();

    return () => {
      cancelled = true;
    };
  }, [post?.id, isLoggedIn]);


  /* =====================================================
     댓글 목록 조회
  ===================================================== */

  const fetchComments = async () => {
    if (!post?.id) {
      return;
    }

    try {
      setCommentsLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/community/posts/${post.id}/comments`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(
          "댓글을 불러오지 못했습니다."
        );
      }

      const data = await response.json();

      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        "댓글 조회 오류:",
        error
      );
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [post?.id]);


  /* =====================================================
     댓글 작성
  ===================================================== */

  const handleCommentSubmit = async (event) => {
    event.preventDefault();

    if (!isLoggedIn) {
      alert(
        "댓글은 로그인 후 작성할 수 있습니다."
      );
      return;
    }

    if (!newComment.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    if (commentSubmitting) {
      return;
    }

    try {
      setCommentSubmitting(true);

      const response = await fetch(
        `${API_BASE_URL}/community/posts/${post.id}/comments`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: newComment.trim(),
          }),
        }
      );

      if (!response.ok) {
        const message = await extractErrorMessage(
          response,
          "댓글 작성에 실패했습니다."
        );

        throw new Error(message);
      }

      setNewComment("");

      await fetchComments();

      const nextCount = commentCount + 1;

      setCommentCount(nextCount);

      if (onUpdated) {
        await onUpdated({
          ...post,
          commentCount: nextCount,
        });
      }
    } catch (error) {
      console.error(
        "댓글 작성 오류:",
        error
      );

      alert(
        error.message ||
          "댓글 작성 중 오류가 발생했습니다."
      );
    } finally {
      setCommentSubmitting(false);
    }
  };


  /* =====================================================
     댓글 수정
  ===================================================== */

  const handleCommentEditStart = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content || "");
  };

  const handleCommentEditCancel = () => {
    setEditingCommentId(null);
    setEditingCommentContent("");
  };

  const handleCommentUpdate = async (event, commentId) => {
    event.preventDefault();

    if (!editingCommentContent.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    if (commentSaving) {
      return;
    }

    try {
      setCommentSaving(true);

      const response = await fetch(
        `${API_BASE_URL}/community/posts/${post.id}/comments/${commentId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: editingCommentContent.trim(),
          }),
        }
      );

      if (!response.ok) {
        const message = await extractErrorMessage(
          response,
          "댓글 수정에 실패했습니다."
        );

        throw new Error(message);
      }

      setEditingCommentId(null);
      setEditingCommentContent("");

      await fetchComments();
    } catch (error) {
      console.error(
        "댓글 수정 오류:",
        error
      );

      alert(
        error.message ||
          "댓글 수정 중 오류가 발생했습니다."
      );
    } finally {
      setCommentSaving(false);
    }
  };


  /* =====================================================
     댓글 삭제
  ===================================================== */

  const handleCommentDelete = async (commentId) => {
    const confirmed = window.confirm(
      "정말 이 댓글을 삭제하시겠습니까?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingCommentId(commentId);

      const response = await fetch(
        `${API_BASE_URL}/community/posts/${post.id}/comments/${commentId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const message = await extractErrorMessage(
          response,
          "댓글 삭제에 실패했습니다."
        );

        throw new Error(message);
      }

      await fetchComments();

      const nextCount = Math.max(
        0,
        commentCount - 1
      );

      setCommentCount(nextCount);

      if (onUpdated) {
        await onUpdated({
          ...post,
          commentCount: nextCount,
        });
      }
    } catch (error) {
      console.error(
        "댓글 삭제 오류:",
        error
      );

      alert(
        error.message ||
          "댓글 삭제 중 오류가 발생했습니다."
      );
    } finally {
      setDeletingCommentId(null);
    }
  };


  /* =====================================================
     화면
  ===================================================== */

  if (!post) {
    return null;
  }

  return (
    <main className="community-detail-page">

      {/* CONTENT */}

      <section className="community-detail-container">

        <button
          type="button"
          className="community-detail-back"
          onClick={onClose}
          disabled={
            deleting || saving
          }
        >
          ←
        </button>

        <div className="community-detail-top">

          <span className="community-detail-category">
            {category}
          </span>

          <h1 className="community-detail-title">
            {post.title ||
              "제목 없음"}
          </h1>

          <div className="community-detail-author-area">

            <div className="community-detail-avatar">
              {author.charAt(0)}
            </div>

            <div className="community-detail-author-info">

              <strong className="community-detail-author">
                {author}
              </strong>

              <span className="community-detail-date">
                {formatDateTime(
                  post.createdAt
                )}
              </span>

            </div>

          </div>

        </div>


        <div className="community-detail-divider" />


        {/* 본문 */}

        <article className="community-detail-content">

          <p>
            {post.content ||
              "내용이 없습니다."}
          </p>

          {Array.isArray(
            post.images
          ) &&
            post.images.length > 0 && (
              <div className="community-detail-images">

                {post.images.map(
                  (image, index) => (
                    <img
                      key={`${post.id}-${index}`}
                      src={getImageUrl(
                        image
                      )}
                      alt={`게시글 이미지 ${
                        index + 1
                      }`}
                    />
                  )
                )}

              </div>
            )}

        </article>


        {/* 하단 */}

        <div className="community-detail-bottom">

          <div className="community-detail-stats">

            <button
              type="button"
              className={`community-detail-like-button ${
                isLiked
                  ? "liked"
                  : ""
              }`}
              onClick={handleLike}
              disabled={liking}
              title={
                isLoggedIn
                  ? "좋아요"
                  : "로그인 후 이용 가능합니다."
              }
            >
              <span className="detail-like-heart">
                {isLiked
                  ? "♥"
                  : "♡"}
              </span>

              <span>
                {likeCount}
              </span>
            </button>


            <span className="community-detail-stat">
              💬{" "}
              {commentCount}
            </span>


            <span className="community-detail-stat">
              👁{" "}
              {Number(
                post.viewCount || 0
              )}
            </span>

          </div>


          {/* 작성자만 수정/삭제 */}

          {isLoggedIn &&
            isAuthor() &&
            !showEdit && (
              <div className="community-detail-actions">

                <button
                  type="button"
                  className="community-detail-action-button"
                  onClick={() =>
                    setShowEdit(true)
                  }
                >
                  수정
                </button>

                <button
                  type="button"
                  className="community-detail-action-button delete"
                  onClick={
                    handleDelete
                  }
                  disabled={deleting}
                >
                  {deleting
                    ? "삭제 중..."
                    : "삭제"}
                </button>

              </div>
            )}

        </div>


        {/* 수정 */}

        {showEdit && (
          <form
            className="community-detail-edit-form"
            onSubmit={
              handleUpdate
            }
          >

            <h2>
              게시글 수정
            </h2>


            <label htmlFor="community-edit-title">
              제목
            </label>

            <input
              id="community-edit-title"
              type="text"
              value={editTitle}
              onChange={(event) =>
                setEditTitle(
                  event.target.value
                )
              }
              maxLength={200}
              disabled={saving}
            />


            <label htmlFor="community-edit-content">
              내용
            </label>

            <textarea
              id="community-edit-content"
              value={editContent}
              onChange={(event) =>
                setEditContent(
                  event.target.value
                )
              }
              rows={12}
              disabled={saving}
            />


            <div className="community-detail-edit-actions">

              <button
                type="button"
                onClick={() =>
                  setShowEdit(false)
                }
                disabled={saving}
              >
                취소
              </button>

              <button
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "수정 중..."
                  : "수정 완료"}
              </button>

            </div>

          </form>
        )}


        {/* 댓글 */}

        <section className="community-comments">

          <h2 className="community-comments-heading">
            댓글 {commentCount}
          </h2>

          {isLoggedIn ? (
            <form
              className="community-comment-form"
              onSubmit={handleCommentSubmit}
            >

              <textarea
                placeholder="댓글을 입력해주세요."
                value={newComment}
                onChange={(event) =>
                  setNewComment(
                    event.target.value
                  )
                }
                maxLength={500}
                rows={3}
                disabled={commentSubmitting}
              />

              <button
                type="submit"
                disabled={commentSubmitting}
              >
                {commentSubmitting
                  ? "등록 중..."
                  : "댓글 등록"}
              </button>

            </form>
          ) : (
            <p className="community-comment-login-message">
              댓글은 로그인 후 작성할 수 있습니다.
            </p>
          )}

          {commentsLoading ? (
            <p className="community-comment-status">
              댓글을 불러오는 중...
            </p>
          ) : comments.length === 0 ? (
            <p className="community-comment-status">
              첫 댓글을 남겨보세요.
            </p>
          ) : (
            <ul className="community-comment-list">

              {comments.map((comment) => (
                <li
                  className="community-comment-item"
                  key={comment.id}
                >

                  <div className="community-comment-header">
                    <strong>
                      {comment.author || "알 수 없음"}
                    </strong>

                    <span>
                      {formatDateTime(comment.createdAt)}
                    </span>
                  </div>

                  {editingCommentId === comment.id ? (
                    <form
                      className="community-comment-edit-form"
                      onSubmit={(event) =>
                        handleCommentUpdate(event, comment.id)
                      }
                    >

                      <textarea
                        value={editingCommentContent}
                        onChange={(event) =>
                          setEditingCommentContent(
                            event.target.value
                          )
                        }
                        maxLength={500}
                        rows={3}
                        disabled={commentSaving}
                      />

                      <div className="community-comment-edit-actions">

                        <button
                          type="button"
                          onClick={handleCommentEditCancel}
                          disabled={commentSaving}
                        >
                          취소
                        </button>

                        <button
                          type="submit"
                          disabled={commentSaving}
                        >
                          {commentSaving
                            ? "저장 중..."
                            : "저장"}
                        </button>

                      </div>

                    </form>
                  ) : (
                    <>
                      <p className="community-comment-content">
                        {comment.content}
                      </p>

                      {isCommentAuthor(comment) && (
                        <div className="community-comment-actions">

                          <button
                            type="button"
                            onClick={() =>
                              handleCommentEditStart(comment)
                            }
                          >
                            수정
                          </button>

                          <button
                            type="button"
                            className="delete"
                            onClick={() =>
                              handleCommentDelete(comment.id)
                            }
                            disabled={
                              deletingCommentId === comment.id
                            }
                          >
                            {deletingCommentId === comment.id
                              ? "삭제 중..."
                              : "삭제"}
                          </button>

                        </div>
                      )}
                    </>
                  )}

                </li>
              ))}

            </ul>
          )}

        </section>

      </section>

    </main>
  );
}

export default CommunityDetail;