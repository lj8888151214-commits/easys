package com.easys.controller;

import com.easys.dto.MentoringReservationCreateDto;
import com.easys.entity.Member;
import com.easys.repository.MemberRepository;
import com.easys.service.MentoringReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/mentor/reservation")
@RequiredArgsConstructor
public class MentoringReservationController {

    private final MemberRepository memberRepository;
    private final MentoringReservationService mentoringReservationService;

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
    // 멘토링 신청
    // POST /mentor/reservation/{mentorId}
    // =====================================================

    @PostMapping("/{mentorId}")
    public ResponseEntity<?> createReservation(
            Authentication authentication,
            @PathVariable Long mentorId,
            @RequestBody MentoringReservationCreateDto request
    ) {

        try {

            Member member =
                    getCurrentMember(authentication);

            return ResponseEntity.ok(
                    mentoringReservationService.createReservation(
                            mentorId,
                            member,
                            request
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
    // 내가 신청한 멘토링 목록
    // GET /mentor/reservation/my
    // =====================================================

    @GetMapping("/my")
    public ResponseEntity<?> getMyReservations(
            Authentication authentication
    ) {

        try {

            Member member =
                    getCurrentMember(authentication);

            return ResponseEntity.ok(
                    mentoringReservationService
                            .getMyReservations(member)
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
    // 멘토에게 들어온 신청 목록
    // GET /mentor/reservation/received
    // =====================================================

    @GetMapping("/received")
    public ResponseEntity<?> getReceivedReservations(
            Authentication authentication
    ) {

        try {

            Member member =
                    getCurrentMember(authentication);

            return ResponseEntity.ok(
                    mentoringReservationService
                            .getMentorReservations(member)
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
    // 멘토링 신청 승인
    // PUT /mentor/reservation/{reservationId}/approve
    // =====================================================

    @PutMapping("/{reservationId}/approve")
    public ResponseEntity<?> approveReservation(
            Authentication authentication,
            @PathVariable Long reservationId
    ) {

        try {

            Member member =
                    getCurrentMember(authentication);

            mentoringReservationService
                    .approveReservation(
                            reservationId,
                            member
                    );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "멘토링 신청이 승인되었습니다."
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
    // 멘토링 신청 거절
    // PUT /mentor/reservation/{reservationId}/reject
    // =====================================================

    @PutMapping("/{reservationId}/reject")
    public ResponseEntity<?> rejectReservation(
            Authentication authentication,
            @PathVariable Long reservationId
    ) {

        try {

            Member member =
                    getCurrentMember(authentication);

            mentoringReservationService
                    .rejectReservation(
                            reservationId,
                            member
                    );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "멘토링 신청이 거절되었습니다."
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
}

