document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       1. 히어로 섹션 슬라이더 기능
    ========================================= */
    const slides = document.querySelectorAll(".hero-slide");
    let currentSlide = 0;
    const slideInterval = 4000; // 4초마다 슬라이드 전환

    function nextSlide() {
        if (slides.length === 0) return;

        slides[currentSlide].classList.remove("active");
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add("active");
    }

    if (slides.length > 1) {
        setInterval(nextSlide, slideInterval);
    }

    /* =========================================
       2. 스크롤 안내 버튼 클릭 시 다음 섹션 이동
    ========================================= */
    const scrollBtn = document.getElementById("heroScrollBtn");
    if (scrollBtn) {
        scrollBtn.addEventListener("click", function () {
            const nextSection = document.querySelector(".intro-section");
            if (nextSection) {
                nextSection.scrollIntoView({ behavior: "smooth" });
            }
        });
    }

});