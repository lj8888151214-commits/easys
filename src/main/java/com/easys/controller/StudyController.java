package com.easys.controller;

import com.easys.dto.StudyCreateDto;
import com.easys.dto.StudyResponseDto;
import com.easys.security.CustomUserDetails;
import com.easys.service.StudyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/study")
public class StudyController {

    private final StudyService studyService;
    // =====================================================
    // 1. 스터디 생성
    // POST /study
    // =====================================================
    @PostMapping
    public ResponseEntity<StudyResponseDto> createStudy(
            @RequestBody StudyCreateDto request,
            @AuthenticationPrincipal CustomUserDetails userDetails

    ) {
        // 현재 로그인한 사용자의 이메일 가져오기
        String email = userDetails
                        .getMember()
                        .getEmail();


        // 서비스에게 스터디 생성 요청
        StudyResponseDto response =
                studyService.createStudy(request, email);
        return ResponseEntity.ok(response);
    }


    // =====================================================
    // 2. 스터디 전체 조회
    // GET /study
    // =====================================================

    @GetMapping
    public ResponseEntity<List<StudyResponseDto>> getStudies() {
        return ResponseEntity.ok(studyService.getStudies());
    }


    // =====================================================
    // 3. 스터디 검색
    // GET /study/search
    //======================================================


    @GetMapping("/search")
    public ResponseEntity<List<StudyResponseDto>> searchStudy(
            @RequestParam(required = false)
            String keyword,
            @RequestParam(required = false)
            String category
    ) {
        return ResponseEntity.ok(
                studyService.searchStudy(keyword, category));
    }
    // =====================================================
    // 4. 스터디 상세 조회
    // GET /study/{id}
    // =====================================================
    @GetMapping("/{id}")
    public ResponseEntity<StudyResponseDto> getStudy(@PathVariable Long id) {
        return ResponseEntity.ok(studyService.getStudy(id)
        );
    }
    // =====================================================
    // 5. 스터디 수정
    // PUT /study/{id}
    // =====================================================
    @PutMapping("/{id}")
    public ResponseEntity<StudyResponseDto> updateStudy(
            @PathVariable Long id,
            @RequestBody StudyCreateDto request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        // 현재 로그인한 사용자의 이메일
        String email = userDetails
                        .getMember()
                        .getEmail();


        return ResponseEntity.ok(
                studyService.updateStudy(id, request, email));
    }


    // =====================================================
    // 6. 스터디 삭제
    // DELETE /study/{id}
    // =====================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudy(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        // 현재 로그인한 사용자의 이메일
        String email =
                userDetails
                        .getMember()
                        .getEmail();
        // 스터디 삭제
        studyService.deleteStudy(
                id,
                email
        );
        return ResponseEntity
                .noContent()
                .build();
    }

}