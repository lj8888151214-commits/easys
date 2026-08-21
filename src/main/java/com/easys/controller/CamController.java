package com.easys.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/cam")
public class CamController {
    int a;
    int b;
    int c;

    // /cam/cam 접속 시 templates/cam/cam.html 렌더링
    @GetMapping("/cam")
    public String camRoom() {
        return "cam/cam";
    }
}