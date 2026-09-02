package com.easys.controller;

import com.easys.dto.StudyRoomAdminRequestDto;
import com.easys.dto.StudyRoomAdminResponseDto;
import com.easys.dto.StudyRoomDeleteResultDto;
import com.easys.service.StudyRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/*
 * 관리자 전용 스터디룸 관리 API
 *
 * 접근 권한(ROLE_ADMIN)은 SecurityConfig에서
 * "/api/admin/**" 경로 전체에 대해 이미 체크하므로
 * 이 컨트롤러에서 별도로 로그인/권한을 확인하지 않는다.
 */
@RestController
@RequestMapping("/admin/study-rooms")
@RequiredArgsConstructor
public class AdminStudyRoomController {

    private final StudyRoomService studyRoomService;

    // 전체 스터디룸 조회 (운영 중지 포함)
    @GetMapping
    public ResponseEntity<List<StudyRoomAdminResponseDto>> getStudyRooms() {

        return ResponseEntity.ok(
                studyRoomService.getStudyRoomsForAdmin()
        );
    }

    // 스터디룸 등록
    @PostMapping
    public ResponseEntity<StudyRoomAdminResponseDto> createStudyRoom(
            @RequestBody StudyRoomAdminRequestDto request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(studyRoomService.createStudyRoom(request));
    }

    // 스터디룸 수정
    @PutMapping("/{roomId}")
    public ResponseEntity<StudyRoomAdminResponseDto> updateStudyRoom(
            @PathVariable Long roomId,
            @RequestBody StudyRoomAdminRequestDto request
    ) {

        return ResponseEntity.ok(
                studyRoomService.updateStudyRoom(roomId, request)
        );
    }

    // 스터디룸 삭제
    // (예약/리뷰 이력이 없으면 완전 삭제, 있으면 운영 중지 처리)
    @DeleteMapping("/{roomId}")
    public ResponseEntity<StudyRoomDeleteResultDto> deleteStudyRoom(
            @PathVariable Long roomId
    ) {

        return ResponseEntity.ok(
                studyRoomService.deleteStudyRoomByAdmin(roomId)
        );
    }

    // 스터디룸 운영 재개
    @PutMapping("/{roomId}/activate")
    public ResponseEntity<StudyRoomAdminResponseDto> activateStudyRoom(
            @PathVariable Long roomId
    ) {

        return ResponseEntity.ok(
                studyRoomService.activateStudyRoomByAdmin(roomId)
        );
    }
}
