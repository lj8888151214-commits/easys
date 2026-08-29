package com.easys.service;

import com.easys.dto.*;
import com.easys.entity.Member;
import com.easys.entity.MentoringReservation;
import com.easys.entity.MentoringReservationStatus;
import com.easys.entity.MentoringReview;
import com.easys.entity.PaymentProductType;
import com.easys.entity.PaymentStatus;
import com.easys.repository.MentoringReservationRepository;
import com.easys.repository.MentoringReviewRepository;
import com.easys.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MentoringReviewService {

    private final MentoringReviewRepository mentoringReviewRepository;
    private final MentoringReservationRepository mentoringReservationRepository;
    private final PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public MentoringReviewSummaryDto getMentorReviews(Long mentorId) {
        List<MentoringReviewResponseDto> reviews = mentoringReviewRepository
                .findByReservationMentorIdOrderByCreatedAtDesc(mentorId)
                .stream()
                .map(MentoringReviewResponseDto::new)
                .toList();

        double averageRating = reviews.isEmpty()
                ? 0.0
                : reviews.stream()
                        .mapToInt(MentoringReviewResponseDto::getRating)
                        .average()
                        .orElse(0.0);

        return new MentoringReviewSummaryDto(
                Math.round(averageRating * 10) / 10.0,
                reviews.size(),
                reviews
        );
    }

    @Transactional(readOnly = true)
    public List<MentoringReviewEligibleReservationDto> getEligibleReservations(Member member) {
        return mentoringReservationRepository.findByMemberOrderByCreatedAtDesc(member)
                .stream()
                .filter(reservation -> isEligibleForReview(reservation, member))
                .map(MentoringReviewEligibleReservationDto::new)
                .toList();
    }

    public MentoringReviewResponseDto createReview(
            Member member,
            MentoringReviewCreateDto request
    ) {
        if (request == null || request.getReservationId() == null) {
            throw new IllegalArgumentException("후기를 작성할 예약 정보를 선택해주세요.");
        }

        MentoringReservation reservation = mentoringReservationRepository
                .findById(request.getReservationId())
                .orElseThrow(() -> new IllegalArgumentException("멘토링 예약 정보를 찾을 수 없습니다."));

        validateReviewEligibility(reservation, member);
        validateReviewInput(request.getRating(), request.getContent());

        MentoringReview review = new MentoringReview(
                reservation,
                member,
                request.getRating(),
                request.getContent().trim()
        );

        return new MentoringReviewResponseDto(mentoringReviewRepository.save(review));
    }

    public MentoringReviewResponseDto updateReview(
            Long reviewId,
            Member member,
            MentoringReviewUpdateDto request
    ) {
        MentoringReview review = getMyReview(reviewId, member);
        validateReviewInput(request == null ? null : request.getRating(),
                request == null ? null : request.getContent());

        review.update(request.getRating(), request.getContent().trim());
        return new MentoringReviewResponseDto(review);
    }

    public void deleteReview(Long reviewId, Member member) {
        mentoringReviewRepository.delete(getMyReview(reviewId, member));
    }

    private boolean isEligibleForReview(MentoringReservation reservation, Member member) {
        return reservation.getMember().getId().equals(member.getId())
                && reservation.getStatus() == MentoringReservationStatus.COMPLETED
                && !mentoringReviewRepository.existsByReservationId(reservation.getId())
                && isReviewPaymentSatisfied(reservation.getId());
    }

    private void validateReviewEligibility(MentoringReservation reservation, Member member) {
        if (!reservation.getMember().getId().equals(member.getId())) {
            throw new IllegalArgumentException("본인이 신청한 멘토링에만 후기를 작성할 수 있습니다.");
        }
        if (reservation.getStatus() != MentoringReservationStatus.COMPLETED) {
            throw new IllegalArgumentException("수업이 완료된 멘토링에만 후기를 작성할 수 있습니다.");
        }
        if (mentoringReviewRepository.existsByReservationId(reservation.getId())) {
            throw new IllegalArgumentException("해당 멘토링 예약에는 이미 후기가 작성되었습니다.");
        }
        if (!isReviewPaymentSatisfied(reservation.getId())) {
            throw new IllegalArgumentException("결제 완료된 멘토링에만 후기를 작성할 수 있습니다.");
        }
    }

    private MentoringReview getMyReview(Long reviewId, Member member) {
        MentoringReview review = mentoringReviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("후기 정보를 찾을 수 없습니다."));

        if (!review.getMember().getId().equals(member.getId())) {
            throw new IllegalArgumentException("본인이 작성한 후기만 수정하거나 삭제할 수 있습니다.");
        }
        return review;
    }

    private boolean isReviewPaymentSatisfied(Long reservationId) {
        if (!paymentRepository.existsByProductTypeAndTargetId(
                PaymentProductType.MENTORING,
                reservationId
        )) {
            return true;
        }
        return paymentRepository.existsByProductTypeAndTargetIdAndStatus(
                PaymentProductType.MENTORING,
                reservationId,
                PaymentStatus.PAID
        );
    }

    private void validateReviewInput(Integer rating, String content) {
        if (rating == null || rating < 1 || rating > 5) {
            throw new IllegalArgumentException("별점은 1점부터 5점까지 선택해주세요.");
        }
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("후기 내용을 입력해주세요.");
        }
        if (content.trim().length() > 1000) {
            throw new IllegalArgumentException("후기 내용은 1000자 이하로 입력해주세요.");
        }
    }
}
