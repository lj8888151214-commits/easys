package com.easys.controller;

import com.easys.dto.ReservationCreateDto;
import com.easys.dto.ReservationResponseDto;
import com.easys.security.CustomUserDetails;
import com.easys.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    /*
     * 예약 생성
     *
     * 로그인한 사용자만 가능
     */
    @PostMapping
    public ResponseEntity<?> createReservation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody ReservationCreateDto request
    ) {

        if (userDetails == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("로그인이 필요합니다.");
        }

        Long memberId =
                userDetails.getMember().getId();

        ReservationResponseDto response =
                reservationService.createReservation(
                        memberId,
                        request
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    /*
     * 내 예약 목록
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMyReservations(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {

        if (userDetails == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("로그인이 필요합니다.");
        }

        Long memberId =
                userDetails.getMember().getId();

        return ResponseEntity.ok(
                reservationService.getMyReservations(memberId)
        );
    }

    /*
     * 예약 상세
     */
    @GetMapping("/{reservationId}")
    public ResponseEntity<?> getReservation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long reservationId
    ) {

        if (userDetails == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("로그인이 필요합니다.");
        }

        Long memberId =
                userDetails.getMember().getId();

        return ResponseEntity.ok(
                reservationService.getReservation(
                        memberId,
                        reservationId
                )
        );
    }

    /*
     * 특정 스터디룸의 특정 날짜 예약 현황
     *
     * 예:
     * GET /api/reservations/availability
     *     ?roomId=1
     *     &date=2026-09-01
     */
    @GetMapping("/availability")
    public ResponseEntity<?> getReservedTimes(
            @RequestParam Long roomId,
            @RequestParam LocalDate date
    ) {

        return ResponseEntity.ok(
                reservationService.getReservedTimes(
                        roomId,
                        date
                )
        );
    }

    /*
     * 예약 취소
     */
    @DeleteMapping("/{reservationId}")
    public ResponseEntity<?> cancelReservation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long reservationId
    ) {

        if (userDetails == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("로그인이 필요합니다.");
        }

        Long memberId =
                userDetails.getMember().getId();

        reservationService.cancelReservation(
                memberId,
                reservationId
        );

        return ResponseEntity.noContent().build();
    }
}