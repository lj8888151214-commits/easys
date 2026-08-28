package com.easys.service;

import com.easys.dto.StudyRoomReviewCreateDto;
import com.easys.dto.StudyRoomReviewResponseDto;
import com.easys.entity.Member;
import com.easys.entity.ReservationStatus;
import com.easys.entity.StudyRoom;
import com.easys.entity.StudyRoomReview;
import com.easys.repository.MemberRepository;
import com.easys.repository.ReservationRepository;
import com.easys.repository.StudyRoomRepository;
import com.easys.repository.StudyRoomReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class StudyRoomReviewService {

    private final StudyRoomReviewRepository studyRoomReviewRepository;
    private final StudyRoomRepository studyRoomRepository;
    private final ReservationRepository reservationRepository;
    private final MemberRepository memberRepository;

    // 리뷰 목록 조회
    @Transactional(readOnly = true)
    public List<StudyRoomReviewResponseDto> getReviews(Long roomId) {

        StudyRoom studyRoom = findStudyRoom(roomId);

        return studyRoomReviewRepository
                .findByStudyRoomOrderByCreatedAtDesc(studyRoom)
                .stream()
                .map(StudyRoomReviewResponseDto::from)
                .toList();
    }

    // 리뷰 작성
    //
    // 결제까지 완료해 실제로 이용한(CONFIRMED) 예약이 있어야 하고,
    // 스터디룸당 하나의 리뷰만 작성할 수 있다.
    public StudyRoomReviewResponseDto createReview(
            Long memberId,
            Long roomId,
            StudyRoomReviewCreateDto request
    ) {

        Member member = findMember(memberId);
        StudyRoom studyRoom = findStudyRoom(roomId);

        validateRating(request.rating());
        validateContent(request.content());

        boolean hasUsedRoom =
                reservationRepository.existsByMemberAndStudyRoomAndStatus(
                        member,
                        studyRoom,
                        ReservationStatus.CONFIRMED
                );

        if (!hasUsedRoom) {
            throw new IllegalArgumentException(
                    "예약을 이용한 스터디룸만 리뷰를 작성할 수 있습니다."
            );
        }

        if (studyRoomReviewRepository
                .findByStudyRoomAndMember(studyRoom, member)
                .isPresent()) {

            throw new IllegalArgumentException(
                    "이미 이 스터디룸에 리뷰를 작성했습니다. 기존 리뷰를 수정해주세요."
            );
        }

        StudyRoomReview review = new StudyRoomReview(
                member,
                studyRoom,
                request.rating(),
                request.content()
        );

        StudyRoomReview savedReview =
                studyRoomReviewRepository.save(review);

        refreshRoomRating(studyRoom);

        return StudyRoomReviewResponseDto.from(savedReview);
    }

    // 리뷰 수정
    public StudyRoomReviewResponseDto updateReview(
            Long memberId,
            Long roomId,
            Long reviewId,
            StudyRoomReviewCreateDto request
    ) {

        StudyRoomReview review = findReview(reviewId);

        validateReviewBelongsToRoom(review, roomId);
        validateOwner(review, memberId);
        validateRating(request.rating());
        validateContent(request.content());

        review.update(request.rating(), request.content());

        refreshRoomRating(review.getStudyRoom());

        return StudyRoomReviewResponseDto.from(review);
    }

    // 리뷰 삭제
    public void deleteReview(
            Long memberId,
            Long roomId,
            Long reviewId
    ) {

        StudyRoomReview review = findReview(reviewId);

        validateReviewBelongsToRoom(review, roomId);
        validateOwner(review, memberId);

        StudyRoom studyRoom = review.getStudyRoom();

        studyRoomReviewRepository.delete(review);

        refreshRoomRating(studyRoom);
    }

    // 리뷰 등록/수정/삭제 후 스터디룸 평균 평점 재계산
    private void refreshRoomRating(StudyRoom studyRoom) {

        Double average =
                studyRoomReviewRepository
                        .findAverageRatingByStudyRoom(studyRoom);

        BigDecimal rating = average == null
                ? null
                : BigDecimal.valueOf(average)
                        .setScale(2, RoundingMode.HALF_UP);

        studyRoom.applyReviewRating(rating);
    }

    private void validateRating(int rating) {

        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException(
                    "평점은 1점에서 5점 사이로 입력해주세요."
            );
        }
    }

    private void validateContent(String content) {

        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException(
                    "리뷰 내용을 입력해주세요."
            );
        }
    }

    private void validateOwner(StudyRoomReview review, Long memberId) {

        if (!review.getMember().getId().equals(memberId)) {
            throw new IllegalArgumentException(
                    "본인이 작성한 리뷰만 수정하거나 삭제할 수 있습니다."
            );
        }
    }

    private void validateReviewBelongsToRoom(
            StudyRoomReview review,
            Long roomId
    ) {

        if (!review.getStudyRoom().getId().equals(roomId)) {
            throw new IllegalArgumentException(
                    "존재하지 않는 리뷰입니다."
            );
        }
    }

    private Member findMember(Long memberId) {

        return memberRepository.findById(memberId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "존재하지 않는 회원입니다."
                        )
                );
    }

    private StudyRoom findStudyRoom(Long roomId) {

        return studyRoomRepository.findById(roomId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "존재하지 않는 스터디룸입니다."
                        )
                );
    }

    private StudyRoomReview findReview(Long reviewId) {

        return studyRoomReviewRepository.findById(reviewId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "존재하지 않는 리뷰입니다."
                        )
                );
    }
}
