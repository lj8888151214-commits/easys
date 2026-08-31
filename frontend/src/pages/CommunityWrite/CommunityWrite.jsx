import { useEffect, useState } from "react";
import "./CommunityWrite.css";

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

function CommunityWrite({
  currentUser,
  onClose,
  onCreated,
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] =
    useState("정보공유");

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] =
    useState([]);

  const [saving, setSaving] =
    useState(false);

  const categories = [
    "공부인증",
    "질문",
    "정보공유",
    "취업",
  ];


  /* =====================================================
     이미지 미리보기 URL 정리
  ===================================================== */

  useEffect(() => {
    return () => {
      imagePreviews.forEach(
        (preview) => {
          URL.revokeObjectURL(
            preview
          );
        }
      );
    };
  }, [imagePreviews]);


  /* =====================================================
     이미지 선택
  ===================================================== */

  const handleImageChange = (event) => {
    const files = Array.from(
      event.target.files || []
    );

    if (files.length === 0) {
      return;
    }

    /*
     * 최대 5장
     */
    const selectedFiles =
      files.slice(0, 5);

    /*
     * 기존 미리보기 URL 제거
     */
    imagePreviews.forEach(
      (preview) => {
        URL.revokeObjectURL(
          preview
        );
      }
    );

    setImages(selectedFiles);

    /*
     * 새 미리보기 생성
     */
    const previews =
      selectedFiles.map(
        (file) =>
          URL.createObjectURL(file)
      );

    setImagePreviews(previews);

    /*
     * 같은 파일을 다시 선택할 수 있도록 초기화
     */
    event.target.value = "";
  };


  /* =====================================================
     이미지 제거
  ===================================================== */

  const handleRemoveImage = (index) => {
    const previewToRemove =
      imagePreviews[index];

    if (previewToRemove) {
      URL.revokeObjectURL(
        previewToRemove
      );
    }

    setImages((prev) =>
      prev.filter(
        (_, imageIndex) =>
          imageIndex !== index
      )
    );

    setImagePreviews((prev) =>
      prev.filter(
        (_, imageIndex) =>
          imageIndex !== index
      )
    );
  };


  /* =====================================================
     게시글 작성
  ===================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    if (!currentUser) {
      alert(
        "로그인 후 게시글을 작성할 수 있습니다."
      );
      return;
    }

    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    try {
      setSaving(true);

      /*
       * 이미지 업로드까지 처리할 수 있도록
       * FormData 사용
       */
      const formData =
        new FormData();

      formData.append(
        "title",
        title.trim()
      );

      formData.append(
        "content",
        content.trim()
      );

      formData.append(
        "category",
        category
      );

      images.forEach((image) => {
        formData.append(
          "images",
          image
        );
      });


      const response =
        await fetch(
          `${API_BASE_URL}/community/posts`,
          {
            method: "POST",
            credentials: "include",
            body: formData,
          }
        );


      if (!response.ok) {
        const message = await extractErrorMessage(
          response,
          "게시글 작성에 실패했습니다."
        );

        throw new Error(message);
      }


      const createdPost =
        await response.json().catch(
          () => null
        );


      alert(
        "게시글이 작성되었습니다."
      );


      /*
       * 부모에게 새 게시글 전달
       */
      if (onCreated) {
        await onCreated(
          createdPost
        );
        return;
      }


      /*
       * onCreated가 없으면 닫기
       */
      if (onClose) {
        await onClose();
      }

    } catch (error) {
      console.error(
        "게시글 작성 오류:",
        error
      );

      alert(
        error.message ||
          "게시글 작성 중 오류가 발생했습니다."
      );

    } finally {
      setSaving(false);
    }
  };


  /* =====================================================
     화면
  ===================================================== */

  return (
    <main className="community-write-page">

      {/* CONTENT */}

      <section className="community-write-container">

        <button
          type="button"
          className="community-write-back"
          onClick={onClose}
          disabled={saving}
        >
          ← 목록으로
        </button>

        <div className="community-write-heading">

          <span>
            COMMUNITY
          </span>

          <h1>
            글 작성하기
          </h1>

          <p>
            공부한 내용이나 궁금한 점을
            자유롭게 공유해보세요.
          </p>

        </div>


        <form
          className="community-write-form"
          onSubmit={handleSubmit}
        >

          {/* CATEGORY */}

          <div className="community-write-field">

            <label htmlFor="community-category">
              카테고리
            </label>

            <select
              id="community-category"
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
              disabled={saving}
            >
              {categories.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>

          </div>


          {/* TITLE */}

          <div className="community-write-field">

            <label htmlFor="community-title">
              제목
            </label>

            <input
              id="community-title"
              type="text"
              placeholder="제목을 입력해주세요."
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              maxLength={100}
              disabled={saving}
            />

          </div>


          {/* CONTENT */}

          <div className="community-write-field">

            <label htmlFor="community-content">
              내용
            </label>

            <textarea
              id="community-content"
              placeholder="내용을 입력해주세요."
              value={content}
              onChange={(event) =>
                setContent(
                  event.target.value
                )
              }
              rows={15}
              disabled={saving}
            />

          </div>


          {/* IMAGE */}

          <div className="community-write-field">

            <label htmlFor="community-images">
              이미지
            </label>

            <input
              id="community-images"
              type="file"
              accept="image/*"
              multiple
              onChange={
                handleImageChange
              }
              disabled={saving}
            />

            <small>
              최대 5장까지 업로드할 수 있습니다.
            </small>

          </div>


          {/* IMAGE PREVIEW */}

          {imagePreviews.length > 0 && (
            <div className="community-write-image-preview">

              {imagePreviews.map(
                (preview, index) => (
                  <div
                    className="community-write-preview-item"
                    key={`${preview}-${index}`}
                  >

                    <img
                      src={preview}
                      alt={`미리보기 ${
                        index + 1
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveImage(
                          index
                        )
                      }
                      disabled={saving}
                    >
                      ×
                    </button>

                  </div>
                )
              )}

            </div>
          )}


          {/* BUTTON */}

          <div className="community-write-actions">

            <button
              type="button"
              className="community-write-cancel"
              onClick={onClose}
              disabled={saving}
            >
              취소
            </button>

            <button
              type="submit"
              className="community-write-submit"
              disabled={saving}
            >
              {saving
                ? "작성 중..."
                : "게시글 작성"}
            </button>

          </div>

        </form>

      </section>

    </main>
  );
}

export default CommunityWrite;
