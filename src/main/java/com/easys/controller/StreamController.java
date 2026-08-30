package com.easys.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/streams")
public class StreamController {

    private static final Map<Long, Map<String, Object>> activeStreams = new ConcurrentHashMap<>();

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getActiveStreams() {
        List<Map<String, Object>> streams = new ArrayList<>(activeStreams.values());
        return ResponseEntity.ok(streams);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createStream(@RequestBody Map<String, Object> streamData) {
        Long id = Long.valueOf(streamData.getOrDefault("id", System.currentTimeMillis()).toString());
        activeStreams.put(id, streamData);
        System.out.println("🚀 [방 생성 완료] 제목: " + streamData.get("title") + " | 호스트: " + streamData.get("host"));
        return ResponseEntity.ok(streamData);
    }

    public static void removeStream(String roomIdStr) {
        try {
            Long roomId = Long.valueOf(roomIdStr);
            activeStreams.remove(roomId);
            System.out.println("🗑️ [방 자동 삭제] 인원 0명으로 인해 방 ID(" + roomId + ")가 삭제되었습니다.");
        } catch (Exception ignored) {}
    }
}