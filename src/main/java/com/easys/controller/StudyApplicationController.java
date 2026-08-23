package com.easys.controller;

import com.easys.dto.StudyApplicationResponseDto;
import com.easys.security.CustomUserDetails;
import com.easys.service.StudyApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/study-application")
public class StudyApplicationController {


    private final StudyApplicationService applicationService;


    // =====================================================
    // 1. 스터디 신청
    // POST /study-application/{studyId}
    // =====================================================

    @PostMapping("/{studyId}")
    public ResponseEntity<StudyApplicationResponseDto>
    apply(@PathVariable Long studyId, @AuthenticationPrincipal CustomUserDetails userDetails) {

        String email = userDetails
                        .getMember()
                        .getEmail();
        return ResponseEntity.ok(applicationService.apply(studyId, email));

    }
    // =====================================================
    // 2. 신청 취소
    // DELETE /study-application/{applicationId}
    // =====================================================

    @DeleteMapping("/{applicationId}")
    public ResponseEntity<Void> cancel(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String email = userDetails
                        .getMember()
                        .getEmail();

        applicationService.cancel(applicationId, email);
        return ResponseEntity
                .noContent()
                .build();
    }
    // =====================================================
    // 3. 방장용 신청자 목록
    // GET /study-application/study/{studyId}
    // =====================================================

    @GetMapping("/study/{studyId}")
    public ResponseEntity<List<StudyApplicationResponseDto>>
    getApplications(
            @PathVariable Long studyId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {String email = userDetails
                        .getMember()
                        .getEmail();
        return ResponseEntity.ok(applicationService.getApplications(studyId, email));
    }


    // =====================================================
    // 4. 승인
    // PUT /study-application/{applicationId}/approve
    // =====================================================

    @PutMapping("/{applicationId}/approve")
    public ResponseEntity<StudyApplicationResponseDto>
    approve(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String email = userDetails
                        .getMember()
                        .getEmail();

        return ResponseEntity.ok(applicationService.approve(applicationId, email)
        );
    }
    // =====================================================
    // 5. 거절
    // PUT /study-application/{applicationId}/reject
    // =====================================================

    @PutMapping("/{applicationId}/reject")
    public ResponseEntity<StudyApplicationResponseDto>
    reject(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal CustomUserDetails userDetails

    ) {
        String email = userDetails
                        .getMember()
                        .getEmail();

        return ResponseEntity.ok(applicationService.reject(applicationId, email));
    }


    // =====================================================
    // 6. 내가 신청한 스터디
    // GET /study-application/my
    // =====================================================
    @GetMapping("/my")
    public ResponseEntity<List<StudyApplicationResponseDto>>
    getMyApplications(@AuthenticationPrincipal CustomUserDetails userDetails) {
        String email = userDetails
                        .getMember()
                        .getEmail();

        return ResponseEntity.ok(applicationService.getMyApplications(email));
    }

}