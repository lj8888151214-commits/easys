package com.easys.controller;

import com.easys.dto.AiRequestDto;
import com.easys.service.AiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chatWithAi(@RequestBody AiRequestDto request) {
        String s_reply = aiService.getAiResponse(request.getModel(), request.getMessage());
        return ResponseEntity.ok(Map.of("reply", s_reply));
    }
}