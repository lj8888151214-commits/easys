package com.easys.controller;

import com.easys.dto.StudyGroupDto;
import com.easys.entity.StudyGroup;
import com.easys.repository.StudyGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/study-groups")
@RequiredArgsConstructor
public class StudyGroupApiController {

    private final StudyGroupRepository studyGroupRepository;

    // 1. 기간별 모임 일정 조회 (달력용)
    @GetMapping
    public ResponseEntity<List<StudyGroup>> getStudyGroups(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        List<StudyGroup> list = studyGroupRepository.findByTargetDateBetween(start, end);
        return ResponseEntity.ok(list);
    }

    // 2. 다가오는 모임 일정 조회 (하단 카드용)
    @GetMapping("/upcoming")
    public ResponseEntity<List<StudyGroup>> getUpcomingGroups() {
        List<StudyGroup> list = studyGroupRepository.findByTargetDateGreaterThanEqualOrderByTargetDateAsc(LocalDate.now());
        return ResponseEntity.ok(list);
    }

    // 3. 모임 일정 등록
    @PostMapping
    public ResponseEntity<StudyGroup> createStudyGroup(@RequestBody StudyGroupDto dto) {
        StudyGroup group = StudyGroup.builder()
                .title(dto.getTitle())
                .category(dto.getCategory())
                .targetDate(dto.getTargetDate())
                .meetingTime(dto.getMeetingTime() != null ? dto.getMeetingTime() : "19:00")
                .memberCount(dto.getMemberCount() > 0 ? dto.getMemberCount() : 1)
                .description(dto.getDescription())
                .build();
        return ResponseEntity.ok(studyGroupRepository.save(group));
    }

    // 4. 모임 일정 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudyGroup(@PathVariable Long id) {
        if (studyGroupRepository.existsById(id)) {
            studyGroupRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}