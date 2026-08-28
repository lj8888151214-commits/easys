package com.easys.controller;

import com.easys.dto.StudyRoomResponseDto;
import com.easys.service.StudyRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/study-rooms")
@RequiredArgsConstructor
public class StudyRoomController {

    private final StudyRoomService studyRoomService;

    // 전체 스터디룸 조회
    @GetMapping
    public ResponseEntity<List<StudyRoomResponseDto>> getStudyRooms() {

        return ResponseEntity.ok(
                studyRoomService.getStudyRooms()
        );
    }

    // 스터디룸 상세
    @GetMapping("/{roomId}")
    public ResponseEntity<StudyRoomResponseDto> getStudyRoom(
            @PathVariable Long roomId
    ) {

        return ResponseEntity.ok(
                studyRoomService.getStudyRoom(roomId)
        );
    }

    // 스터디룸 검색
    @GetMapping("/search")
    public ResponseEntity<List<StudyRoomResponseDto>> searchStudyRooms(
            @RequestParam String keyword
    ) {

        return ResponseEntity.ok(
                studyRoomService.searchStudyRooms(keyword)
        );
    }
}