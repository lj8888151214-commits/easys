package com.easys.controller;

import com.easys.dto.StudyGroupDto;
import com.easys.dto.StudyGroupResponseDto;
import com.easys.entity.StudyGroup;
import com.easys.security.CustomUserDetails;
import com.easys.service.StudyGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/study-groups")
@RequiredArgsConstructor
public class StudyGroupApiController {

    private final StudyGroupService studyGroupService;

    // 1. 기간별 모임 일정 조회 (달력용) - 로그인 회원이 볼 수 있는 일정만 반환
    @GetMapping
    public ResponseEntity<?> getStudyGroups(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        List<StudyGroupResponseDto> list = studyGroupService
                .getVisibleForMember(userDetails.getMember(), start, end)
                .stream()
                .map(StudyGroupResponseDto::from)
                .toList();

        return ResponseEntity.ok(list);
    }

    // 2. 다가오는 모임 일정 조회 (하단 카드용)
    @GetMapping("/upcoming")
    public ResponseEntity<?> getUpcomingGroups(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        List<StudyGroupResponseDto> list = studyGroupService
                .getUpcomingVisibleForMember(userDetails.getMember())
                .stream()
                .map(StudyGroupResponseDto::from)
                .toList();

        return ResponseEntity.ok(list);
    }

    // 3. 모임 일정 수동 등록
    @PostMapping
    public ResponseEntity<?> createStudyGroup(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody StudyGroupDto dto
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        StudyGroup group = studyGroupService.createManual(userDetails.getMember(), dto);
        return ResponseEntity.ok(StudyGroupResponseDto.from(group));
    }

    // 4. 모임 일정 삭제 (본인이 수동으로 등록한 일정만 가능)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStudyGroup(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        studyGroupService.deleteManual(id, userDetails.getMember());
        return ResponseEntity.ok().build();
    }
}
