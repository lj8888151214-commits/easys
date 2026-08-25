package com.easys.controller;

import com.easys.dto.MissionDto;
import com.easys.entity.Mission;
import com.easys.repository.MissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/missions")
@RequiredArgsConstructor
public class MissionApiController {

    private final MissionRepository missionRepository;

    // 기간별 미션 목록 조회
    @GetMapping
    public ResponseEntity<List<Mission>> getMissions(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        List<Mission> list = missionRepository.findByTargetDateBetween(start, end);
        return ResponseEntity.ok(list);
    }

    // 미션 등록
    @PostMapping
    public ResponseEntity<?> createMission(@RequestBody MissionDto dto) {
        try {
            Mission mission = new Mission();
            mission.setTitle(dto.getTitle());
            mission.setDescription(dto.getDescription() != null ? dto.getDescription() : "");
            mission.setTargetDate(dto.getTargetDate());
            mission.setCategory(dto.getCategory() != null ? dto.getCategory() : "CODING");
            mission.setCompleted(false);

            Mission savedMission = missionRepository.save(mission);
            return ResponseEntity.ok(savedMission);
        } catch (Exception e) {
            e.printStackTrace(); // 👈 만약 DB 에러 발생 시 콘솔에 원인 출력
            return ResponseEntity.internalServerError().body("저장 실패: " + e.getMessage());
        }
    }

    // 완료 상태 토글 (Check)
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Mission> toggleMission(@PathVariable Long id) {
        return missionRepository.findById(id).map(mission -> {
            mission.setCompleted(!mission.isCompleted());
            return ResponseEntity.ok(missionRepository.save(mission));
        }).orElse(ResponseEntity.notFound().build());
    }

    // 미션 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMission(@PathVariable Long id) {
        if (missionRepository.existsById(id)) {
            missionRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}