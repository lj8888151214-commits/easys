document.addEventListener("DOMContentLoaded", function () {

    const header =
        document.querySelector(".main-header");

    const mobileMenuBtn =
        document.getElementById("mobileMenuBtn");

    const mobileMenu =
        document.getElementById("mobileMenu");


    /* =====================================================
       스크롤 감지
    ===================================================== */

    function handleScroll() {

        if (window.scrollY > 30) {

            header.classList.add("scrolled");

        } else {

            header.classList.remove("scrolled");

        }

    }


    window.addEventListener(
        "scroll",
        handleScroll,
        {
            passive: true
        }
    );


    handleScroll();


    /* =====================================================
       모바일 메뉴
    ===================================================== */

    if (
        mobileMenuBtn &&
        mobileMenu
    ) {

        mobileMenuBtn.addEventListener(
            "click",
            function () {

                const isOpen =
                    mobileMenu.classList.toggle(
                        "active"
                    );


                mobileMenuBtn.classList.toggle(
                    "active",
                    isOpen
                );


                mobileMenuBtn.setAttribute(
                    "aria-expanded",
                    isOpen
                        ? "true"
                        : "false"
                );

            }
        );


        /* 메뉴를 누르면 닫기 */

        const mobileLinks =
            mobileMenu.querySelectorAll("a");


        mobileLinks.forEach(
            function (link) {

                link.addEventListener(
                    "click",
                    function () {

                        mobileMenu.classList.remove(
                            "active"
                        );

                        mobileMenuBtn.classList.remove(
                            "active"
                        );

                        mobileMenuBtn.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }
                );

            }
        );

    }

});