package com.easys.controller;

import com.easys.entity.StreamingStudio;
import com.easys.repository.StreamingStudioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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

    // 2. 스튜디오(방) 생성
    @PostMapping
    public ResponseEntity<StreamingStudio> createStream(@RequestBody StreamingStudio studioData) {
        // 신규 생성 시 id 비우기
        studioData.setId(null);

        // SecurityContextHolder를 통해 안전하게 현재 로그인된 유저 닉네임 가져오기
        String sessionNick = null;
        try {
            org.springframework.security.core.Authentication auth =
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();

            if (auth != null && auth.isAuthenticated() &&
                    auth.getPrincipal() instanceof com.easys.security.CustomUserDetails userDetails) {
                sessionNick = userDetails.getMember().getNickname();
                if (sessionNick == null || sessionNick.isBlank()) {
                    sessionNick = userDetails.getUsername();
                }
            }
        } catch (Exception e) {
            System.err.println("로그인 유저 정보 조회 중 예외 발생: " + e.getMessage());
        }

        if (sessionNick != null) {
            studioData.setHost(sessionNick);
        } else if (studioData.getHost() == null || studioData.getHost().isBlank()) {
            studioData.setHost("게스트");
        }

        if (studioData.getViewers() <= 0) {
            studioData.setViewers(1);
        }

        StreamingStudio savedStudio = streamingStudioRepository.save(studioData);
        System.out.println("🚀 [DB 스튜디오 생성 완료] ID: " + savedStudio.getId() + " | 제목: " + savedStudio.getTitle() + " | 호스트: " + savedStudio.getHost());

        // 3. 브로드캐스트 로직 (실시간 전송)
        try {
            List<StreamingStudio> allStreams = streamingStudioRepository.findAll();
            List<Map<String, Object>> streamMaps = new ArrayList<>();
            for (StreamingStudio studio : allStreams) {
                streamMaps.add(Map.of(
                        "id", studio.getId(),
                        "title", studio.getTitle() != null ? studio.getTitle() : "",
                        "description", studio.getDescription() != null ? studio.getDescription() : "",
                        "category", studio.getCategory() != null ? studio.getCategory() : "",
                        "host", studio.getHost() != null ? studio.getHost() : "",
                        "viewers", studio.getViewers()
                ));
            }
            com.easys.config.WebSocketConfig.SignalWebSocketHandler.broadcastStreamList(streamMaps);
        } catch (Exception e) {
            System.err.println("실시간 방 목록 브로드캐스트 실패: " + e.getMessage());
        }

        return ResponseEntity.ok(savedStudio);
    }

    // 3. 인원수 감소 및 0명일 때 자동 삭제 API
    @PostMapping("/{id}/leave")
    public ResponseEntity<String> leaveStream(@PathVariable Long id) {
        return streamingStudioRepository.findById(id).map(studio -> {
            int currentViewers = studio.getViewers() - 1;

            if (currentViewers <= 0) {
                streamingStudioRepository.delete(studio);
                System.out.println("🗑️ [방 자동 삭제] 인원이 0명이 되어 ID(" + id + ") 방이 삭제되었습니다.");

                // 삭제 후 남은 목록 브로드캐스트 갱신
                broadcastCurrentStreams();

                return ResponseEntity.ok("인원 미달로 방이 삭제되었습니다.");
            } else {
                studio.setViewers(currentViewers);
                streamingStudioRepository.save(studio);
                System.out.println("👥 [시청자 감소] ID(" + id + ") 남은 인원: " + currentViewers);

                broadcastCurrentStreams();

                return ResponseEntity.ok("퇴장 처리되었습니다.");
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    // 4. 수동 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteStream(@PathVariable Long id) {
        if (streamingStudioRepository.existsById(id)) {
            streamingStudioRepository.deleteById(id);
            System.out.println("🗑️ [DB 스튜디오 삭제] ID(" + id + ")가 삭제되었습니다.");

            // 삭제 후 남은 목록 브로드캐스트 갱신
            broadcastCurrentStreams();

            return ResponseEntity.ok("방 삭제 성공");
        }
        return ResponseEntity.notFound().build();
    }

    // 공통 브로드캐스트 헬퍼 메서드 추가 (방 삭제/퇴장 시에도 실시간 반영되도록 함)
    private void broadcastCurrentStreams() {
        try {
            List<StreamingStudio> allStreams = streamingStudioRepository.findAll();
            List<Map<String, Object>> streamMaps = new ArrayList<>();
            for (StreamingStudio studio : allStreams) {
                streamMaps.add(Map.of(
                        "id", studio.getId(),
                        "title", studio.getTitle() != null ? studio.getTitle() : "",
                        "description", studio.getDescription() != null ? studio.getDescription() : "",
                        "category", studio.getCategory() != null ? studio.getCategory() : "",
                        "host", studio.getHost() != null ? studio.getHost() : "",
                        "viewers", studio.getViewers()
                ));
            }
            com.easys.config.WebSocketConfig.SignalWebSocketHandler.broadcastStreamList(streamMaps);
        } catch (Exception e) {
            System.err.println("브로드캐스트 갱신 실패: " + e.getMessage());
        }
    }
}