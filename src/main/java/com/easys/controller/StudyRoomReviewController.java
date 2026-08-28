package com.easys.controller;

import com.easys.dto.StudyRoomReviewCreateDto;
import com.easys.dto.StudyRoomReviewResponseDto;
import com.easys.security.CustomUserDetails;
import com.easys.service.StudyRoomReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/study-rooms/{roomId}/reviews")
@RequiredArgsConstructor
public class StudyRoomReviewController {

    private final StudyRoomReviewService studyRoomReviewService;

    /*
     * 리뷰 목록 조회
     *
     * 누구나 조회 가능
     */
    @GetMapping
    public ResponseEntity<List<StudyRoomReviewResponseDto>> getReviews(
            @PathVariable Long roomId
    ) {

        return ResponseEntity.ok(
                studyRoomReviewService.getReviews(roomId)
        );
    }

    /*
     * 리뷰 작성
     *
     * 로그인 + 결제 완료된 예약 이력이 있어야 가능
     */
    @PostMapping
    public ResponseEntity<?> createReview(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long roomId,
            @RequestBody StudyRoomReviewCreateDto request
    ) {

        if (userDetails == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("로그인이 필요합니다.");
        }

        StudyRoomReviewResponseDto response =
                studyRoomReviewService.createReview(
                        userDetails.getMember().getId(),
                        roomId,
                        request
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    /*
     * 리뷰 수정
     */
    @PutMapping("/{reviewId}")
    public ResponseEntity<?> updateReview(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long roomId,
            @PathVariable Long reviewId,
            @RequestBody StudyRoomReviewCreateDto request
    ) {

        if (userDetails == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("로그인이 필요합니다.");
        }

        StudyRoomReviewResponseDto response =
                studyRoomReviewService.updateReview(
                        userDetails.getMember().getId(),
                        roomId,
                        reviewId,
                        request
                );

        return ResponseEntity.ok(response);
    }

    /*
     * 리뷰 삭제
     */
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long roomId,
            @PathVariable Long reviewId
    ) {

        if (userDetails == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("로그인이 필요합니다.");
        }

        studyRoomReviewService.deleteReview(
                userDetails.getMember().getId(),
                roomId,
                reviewId
        );

        return ResponseEntity.noContent().build();
    }
}
