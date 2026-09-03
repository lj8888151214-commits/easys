package com.easys.controller;

import com.easys.dto.StudyRoomMapResponseDto;
import com.easys.service.StudyRoomLocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/study-rooms")
public class StudyRoomLocationController {

    private final StudyRoomLocationService studyRoomLocationService;

    @GetMapping("/locations")
    public ResponseEntity<List<StudyRoomMapResponseDto>> getStudyRoomLocations() {
        List<StudyRoomMapResponseDto> rooms = studyRoomLocationService.getAllStudyRoomLocations();
        return ResponseEntity.ok(rooms);
    }
}