package com.easys.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MainController {

    // 메인 홈 화면 (GET /)
    @GetMapping("/")
    public String index() {
        return "index"; // templates/index.html
    }

    // 로그인 화면 (GET /login)
    @GetMapping("/login")
    public String login() {
        return "login"; // templates/login.html
    }

    // 회원가입 화면 (GET /member/join)
    @GetMapping("/member/join")
    public String join() {
        return "member"; // templates/member.html
    }

    // 내 스터디 화상 캠 화면 (GET /cam)
    @GetMapping("/cam")
    public String cam() {
        return "cam"; // templates/cam.html
    }
}