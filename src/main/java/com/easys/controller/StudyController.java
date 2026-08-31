package com.easys.controller;

import com.easys.dto.StudyApplicationResponseDto;
import com.easys.dto.StudyCreateDto;
import com.easys.dto.StudyResponseDto;
import com.easys.security.CustomUserDetails;
import com.easys.service.StudyApplicationService;
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

    private final StudyApplicationService studyApplicationService;


    // =====================================================
    // 1. 스터디 생성
    // POST /study
    // =====================================================

    @PostMapping
    public ResponseEntity<StudyResponseDto> createStudy(
            @RequestBody StudyCreateDto request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {

        String email =
                userDetails
                        .getMember()
                        .getEmail();

        return ResponseEntity.ok(
                studyService.createStudy(
                        request,
                        email
                )
        );
    }


    // =====================================================
    // 2. 스터디 전체 조회
    // GET /study
    // =====================================================

    @GetMapping
    public ResponseEntity<List<StudyResponseDto>> getStudies() {

        return ResponseEntity.ok(
                studyService.getStudies()
        );
    }


    // =====================================================
    // 3. 스터디 검색
    // GET /study/search
    // =====================================================

    @GetMapping("/search")
    public ResponseEntity<List<StudyResponseDto>> searchStudy(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category
    ) {

        return ResponseEntity.ok(
                studyService.searchStudy(
                        keyword,
                        category
                )
        );
    }


    // =====================================================
    // 4. 내가 신청한 스터디
    // GET /study/my-applications
    // =====================================================

    @GetMapping("/my-applications")
    public ResponseEntity<List<StudyApplicationResponseDto>>
    getMyApplications(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {

        String email =
                userDetails
                        .getMember()
                        .getEmail();

        return ResponseEntity.ok(
                studyApplicationService
                        .getMyApplications(email)
        );
    }


    // =====================================================
    // 5. 스터디 상세
    // GET /study/{id}
    // =====================================================

    @GetMapping("/{id}")
    public ResponseEntity<StudyResponseDto> getStudy(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                studyService.getStudy(id)
        );
    }


    // =====================================================
    // 6. 스터디 참여 신청
    // POST /study/{id}/apply
    // =====================================================

    @PostMapping("/{id}/apply")
    public ResponseEntity<StudyApplicationResponseDto>
    applyStudy(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {

        String email =
                userDetails
                        .getMember()
                        .getEmail();

        return ResponseEntity.ok(
                studyApplicationService
                        .applyStudy(
                                id,
                                email
                        )
        );
    }


    // =====================================================
    // 7. 신청자 목록
    // GET /study/{id}/applications
    // =====================================================

    @GetMapping("/{id}/applications")
    public ResponseEntity<List<StudyApplicationResponseDto>>
    getApplications(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {

        String email =
                userDetails
                        .getMember()
                        .getEmail();

        return ResponseEntity.ok(
                studyApplicationService
                        .getApplications(
                                id,
                                email
                        )
        );
    }


    // =====================================================
    // 8. 신청 승인
    // PUT /study/applications/{applicationId}/approve
    // =====================================================

    @PutMapping("/applications/{applicationId}/approve")
    public ResponseEntity<StudyApplicationResponseDto>
    approveApplication(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {

        String email =
                userDetails
                        .getMember()
                        .getEmail();

        return ResponseEntity.ok(
                studyApplicationService
                        .approveApplication(
                                applicationId,
                                email
                        )
        );
    }


    // =====================================================
    // 9. 신청 거절
    // PUT /study/applications/{applicationId}/reject
    // =====================================================

    @PutMapping("/applications/{applicationId}/reject")
    public ResponseEntity<StudyApplicationResponseDto>
    rejectApplication(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {

        String email =
                userDetails
                        .getMember()
                        .getEmail();

        return ResponseEntity.ok(
                studyApplicationService
                        .rejectApplication(
                                applicationId,
                                email
                        )
        );
    }


    // =====================================================
    // 10. 신청 취소
    // DELETE /study/applications/{applicationId}
    // =====================================================

    @DeleteMapping("/applications/{applicationId}")
    public ResponseEntity<Void> cancelApplication(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {

        String email =
                userDetails
                        .getMember()
                        .getEmail();

        studyApplicationService
                .cancelApplication(
                        applicationId,
                        email
                );

        return ResponseEntity
                .noContent()
                .build();
    }


    // =====================================================
    // 11. 스터디 탈퇴
    // DELETE /study/{id}/leave
    // =====================================================

    @DeleteMapping("/{id}/leave")
    public ResponseEntity<Void> leaveStudy(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {

        String email =
                userDetails
                        .getMember()
                        .getEmail();

        studyApplicationService
                .leaveStudy(
                        id,
                        email
                );

        return ResponseEntity
                .noContent()
                .build();
    }


    // =====================================================
    // 12. 스터디 수정
    // PUT /study/{id}
    // =====================================================

    @PutMapping("/{id}")
    public ResponseEntity<StudyResponseDto> updateStudy(
            @PathVariable Long id,
            @RequestBody StudyCreateDto request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {

        String email =
                userDetails
                        .getMember()
                        .getEmail();

        return ResponseEntity.ok(
                studyService.updateStudy(
                        id,
                        request,
                        email
                )
        );
    }


    // =====================================================
    // 13. 스터디 삭제
    // DELETE /study/{id}
    // =====================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudy(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {

        String email =
                userDetails
                        .getMember()
                        .getEmail();

        studyService.deleteStudy(
                id,
                email
        );

        return ResponseEntity
                .noContent()
                .build();
    }
}