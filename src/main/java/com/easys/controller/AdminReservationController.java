package com.easys.controller;

import com.easys.dto.AdminReservationResponseDto;
import com.easys.dto.ReservationResponseDto;
import com.easys.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/*
 * 관리자 전용 스터디룸 예약 관리 API.
 *
 * 접근 권한(ROLE_ADMIN)은 SecurityConfig에서
 * "/api/admin/**" 경로 전체에 대해 이미 체크하므로
 * 이 컨트롤러에서 별도로 로그인/권한을 확인하지 않는다.
 */
@RestController
@RequestMapping("/admin/reservations")
@RequiredArgsConstructor
public class AdminReservationController {

    private final ReservationService reservationService;

    // 전체 예약 목록 (누가 몇 시에 어느 스터디룸을 예약했는지)
    @GetMapping
    public ResponseEntity<List<AdminReservationResponseDto>> getReservations() {

        return ResponseEntity.ok(
                reservationService.getAllReservationsForAdmin()
        );
    }

    // 예약 승인 (결제 완료된 예약 → 확정 + 캘린더 등록)
    @PostMapping("/{reservationId}/approve")
    public ResponseEntity<?> approveReservation(
            @PathVariable Long reservationId
    ) {

        try {
            ReservationResponseDto response =
                    reservationService.approveReservation(reservationId);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // 예약 취소
    // (PAID면 거절, CONFIRMED면 카페 사정으로 인한 취소 — 둘 다 결제도 함께 취소)
    @PostMapping("/{reservationId}/cancel")
    public ResponseEntity<?> cancelReservation(
            @PathVariable Long reservationId
    ) {

        try {
            ReservationResponseDto response =
                    reservationService.cancelReservationByAdmin(reservationId);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
