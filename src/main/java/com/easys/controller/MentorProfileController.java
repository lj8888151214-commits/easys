package com.easys.controller;

import com.easys.dto.MentorProfileCreateDto;
import com.easys.dto.MentorProfileResponseDto;
import com.easys.entity.Member;
import com.easys.repository.MemberRepository;
import com.easys.service.MentorProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/mentor")
@RequiredArgsConstructor
public class MentorProfileController {

    private final MemberRepository memberRepository;
    private final MentorProfileService mentorProfileService;

    // =====================================================
    // 현재 로그인한 회원 가져오기
    // =====================================================

    private Member getCurrentMember(
            Authentication authentication
    ) {

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new IllegalArgumentException(
                    "로그인이 필요합니다."
            );
        }

        String email =
                authentication.getName();

        return memberRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "회원 정보를 찾을 수 없습니다."
                        )
                );
    }

    // =====================================================
    // 멘토 등록
    // POST /mentor
    // =====================================================

    @PostMapping
    public ResponseEntity<?> createMentorProfile(
            Authentication authentication,
            @RequestBody MentorProfileCreateDto request
    ) {

        try {

            Member member =
                    getCurrentMember(authentication);

            MentorProfileResponseDto response =
                    mentorProfileService.createMentorProfile(
                            member,
                            request
                    );

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "message",
                            e.getMessage()
                    )
            );
        }
    }

    // =====================================================
    // 내 멘토 정보 조회
    // GET /mentor/me
    // =====================================================

    @GetMapping("/me")
    public ResponseEntity<?> getMyMentorProfile(
            Authentication authentication
    ) {

        try {

            Member member =
                    getCurrentMember(authentication);

            MentorProfileResponseDto response =
                    mentorProfileService.getMyMentorProfile(
                            member
                    );

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "message",
                            e.getMessage()
                    )
            );
        }
    }

    // =====================================================
    // 내 멘토 정보 수정
    // PUT /mentor/me
    // =====================================================

    @PutMapping("/me")
    public ResponseEntity<?> updateMyMentorProfile(
            Authentication authentication,
            @RequestBody MentorProfileCreateDto request
    ) {

        try {

            Member member =
                    getCurrentMember(authentication);

            MentorProfileResponseDto response =
                    mentorProfileService.updateMentorProfile(
                            member,
                            request
                    );

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "message",
                            e.getMessage()
                    )
            );
        }
    }

    // =====================================================
    // 내 멘토 정보 삭제
    // DELETE /mentor/me
    // =====================================================

    @DeleteMapping("/me")
    public ResponseEntity<?> deleteMyMentorProfile(
            Authentication authentication
    ) {

        try {

            Member member =
                    getCurrentMember(authentication);

            mentorProfileService.deleteMyMentorProfile(
                    member
            );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "멘토 등록 정보가 삭제되었습니다."
                    )
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "message",
                            e.getMessage()
                    )
            );
        }
    }

    // =====================================================
    // 멘토 상세보기
    // GET /mentor/{mentorId}
    // =====================================================

    @GetMapping("/{mentorId}")
    public ResponseEntity<?> getMentorProfile(
            @PathVariable Long mentorId
    ) {

        try {

            MentorProfileResponseDto response =
                    mentorProfileService.getMentorProfile(
                            mentorId
                    );

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {

            return ResponseEntity.notFound().build();
        }
    }

    // =====================================================
    // 멘토 목록
    // GET /mentor
    // =====================================================

    @GetMapping
    public ResponseEntity<List<MentorProfileResponseDto>>
    getApprovedMentors() {

        List<MentorProfileResponseDto> mentors =
                mentorProfileService.getApprovedMentors();

        return ResponseEntity.ok(mentors);
    }
}