package com.easys.controller;

import com.easys.entity.StreamingStudio;
import com.easys.repository.StreamingStudioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/streams")
@RequiredArgsConstructor
public class StreamController {

    private final StreamingStudioRepository streamingStudioRepository;

    // 1. DB에서 활성화된 스트리밍 스튜디오 목록 조회
    @GetMapping
    public ResponseEntity<List<StreamingStudio>> getActiveStreams() {
        List<StreamingStudio> studios = streamingStudioRepository.findAll();
        return ResponseEntity.ok(studios);
    }

    // 2. 스튜디오(방) 생성 시 DB에 저장 (중복 제거 완료)
    @PostMapping
    public ResponseEntity<StreamingStudio> createStream(@RequestBody StreamingStudio studioData) {
        StreamingStudio savedStudio = streamingStudioRepository.save(studioData);
        System.out.println("🚀 [DB 스튜디오 생성 완료] 제목: " + savedStudio.getTitle() + " | 호스트: " + savedStudio.getHost());
        return ResponseEntity.ok(savedStudio);
    }

    // 3. 스튜디오(방) 삭제 시 DB에서 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteStream(@PathVariable Long id) {
        if (streamingStudioRepository.existsById(id)) {
            streamingStudioRepository.deleteById(id);
            System.out.println("🗑️ [DB 스튜디오 삭제] ID(" + id + ")가 삭제되었습니다.");
            return ResponseEntity.ok("방 삭제 성공");
        }
        return ResponseEntity.notFound().build();
    }

    // 인원 0명 자동 삭제용 메서드 연동 (필요시 레포지토리 기반으로 변경 가능)
    public static void removeStream(String roomIdStr) {
        try {
            Long roomId = Long.valueOf(roomIdStr);
            System.out.println("🗑️ [방 자동 삭제 대상] 방 ID(" + roomId + ")");
        } catch (Exception ignored) {}
    }
}