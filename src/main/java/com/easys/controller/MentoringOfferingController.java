package com.easys.controller;

import com.easys.dto.MentoringOfferingCreateDto;
import com.easys.entity.Member;
import com.easys.repository.MemberRepository;
import com.easys.service.MentoringOfferingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/mentor/offerings")
@RequiredArgsConstructor
public class MentoringOfferingController {

    private final MemberRepository memberRepository;
    private final MentoringOfferingService mentoringOfferingService;

    private Member getCurrentMember(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
        return memberRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다."));
    }

    // =====================================================
    // 새로운 멘토링 등록
    // POST /mentor/offerings
    // =====================================================

    @PostMapping
    public ResponseEntity<?> createOffering(
            Authentication authentication,
            @RequestBody MentoringOfferingCreateDto request
    ) {
        try {
            return ResponseEntity.ok(
                    mentoringOfferingService.createOffering(getCurrentMember(authentication), request)
            );
        } catch (IllegalArgumentException e) {
            return badRequest(e);
        }
    }

    // =====================================================
    // 내가 등록한 멘토링 목록
    // GET /mentor/offerings/me
    // =====================================================

    @GetMapping("/me")
    public ResponseEntity<?> getMyOfferings(Authentication authentication) {
        try {
            return ResponseEntity.ok(
                    mentoringOfferingService.getMyOfferings(getCurrentMember(authentication))
            );
        } catch (IllegalArgumentException e) {
            return badRequest(e);
        }
    }

    // =====================================================
    // 특정 멘토가 등록한 멘토링 목록 (멘토 상세 모달)
    // GET /mentor/offerings/mentor/{mentorId}
    // =====================================================

    @GetMapping("/mentor/{mentorId}")
    public ResponseEntity<?> getOfferingsByMentor(@PathVariable Long mentorId) {
        return ResponseEntity.ok(
                mentoringOfferingService.getOfferingsByMentor(mentorId)
        );
    }

    // =====================================================
    // 전체 공개 멘토링 목록 (mentor-grid, "등록한 멘토링 1개 = 카드 1개")
    // GET /mentor/offerings
    // =====================================================

    @GetMapping
    public ResponseEntity<?> getAllPublicOfferings() {
        return ResponseEntity.ok(
                mentoringOfferingService.getAllPublicOfferings()
        );
    }

    // =====================================================
    // 멘토링 수정
    // PUT /mentor/offerings/{offeringId}
    // =====================================================

    @PutMapping("/{offeringId}")
    public ResponseEntity<?> updateOffering(
            Authentication authentication,
            @PathVariable Long offeringId,
            @RequestBody MentoringOfferingCreateDto request
    ) {
        try {
            return ResponseEntity.ok(
                    mentoringOfferingService.updateOffering(offeringId, getCurrentMember(authentication), request)
            );
        } catch (IllegalArgumentException e) {
            return badRequest(e);
        }
    }

    // =====================================================
    // 멘토링 삭제
    // DELETE /mentor/offerings/{offeringId}
    // =====================================================

    @DeleteMapping("/{offeringId}")
    public ResponseEntity<?> deleteOffering(
            Authentication authentication,
            @PathVariable Long offeringId
    ) {
        try {
            mentoringOfferingService.deleteOffering(offeringId, getCurrentMember(authentication));
            return ResponseEntity.ok(Map.of("message", "멘토링이 삭제되었습니다."));
        } catch (IllegalArgumentException e) {
            return badRequest(e);
        }
    }

    private ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}
