package com.easys.controller;

import com.easys.dto.MentoringReviewCreateDto;
import com.easys.dto.MentoringReviewUpdateDto;
import com.easys.entity.Member;
import com.easys.repository.MemberRepository;
import com.easys.service.MentoringReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/mentor/reviews")
@RequiredArgsConstructor
public class MentoringReviewController {

    private final MemberRepository memberRepository;
    private final MentoringReviewService mentoringReviewService;

    @GetMapping("/{mentorId}")
    public ResponseEntity<?> getMentorReviews(@PathVariable Long mentorId) {
        return ResponseEntity.ok(mentoringReviewService.getMentorReviews(mentorId));
    }

    @GetMapping("/eligible/me")
    public ResponseEntity<?> getEligibleReservations(Authentication authentication) {
        try {
            return ResponseEntity.ok(mentoringReviewService.getEligibleReservations(getCurrentMember(authentication)));
        } catch (IllegalArgumentException e) {
            return badRequest(e);
        }
    }

    @PostMapping
    public ResponseEntity<?> createReview(
            Authentication authentication,
            @RequestBody MentoringReviewCreateDto request
    ) {
        try {
            return ResponseEntity.ok(mentoringReviewService.createReview(getCurrentMember(authentication), request));
        } catch (IllegalArgumentException e) {
            return badRequest(e);
        }
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<?> updateReview(
            Authentication authentication,
            @PathVariable Long reviewId,
            @RequestBody MentoringReviewUpdateDto request
    ) {
        try {
            return ResponseEntity.ok(mentoringReviewService.updateReview(reviewId, getCurrentMember(authentication), request));
        } catch (IllegalArgumentException e) {
            return badRequest(e);
        }
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(
            Authentication authentication,
            @PathVariable Long reviewId
    ) {
        try {
            mentoringReviewService.deleteReview(reviewId, getCurrentMember(authentication));
            return ResponseEntity.ok(Map.of("message", "후기가 삭제되었습니다."));
        } catch (IllegalArgumentException e) {
            return badRequest(e);
        }
    }

    private Member getCurrentMember(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
        return memberRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("회원 정보를 찾을 수 없습니다."));
    }

    private ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}
