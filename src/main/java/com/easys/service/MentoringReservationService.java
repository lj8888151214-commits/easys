package com.easys.service;

import com.easys.dto.MentoringReservationCreateDto;
import com.easys.entity.Member;
import com.easys.entity.MentorProfile;
import com.easys.entity.MentoringReservation;
import com.easys.repository.MentorProfileRepository;
import com.easys.repository.MentoringReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MentoringReservationService {

    private final MentoringReservationRepository mentoringReservationRepository;
    private final MentorProfileRepository mentorProfileRepository;

    // =====================================================
    // 멘토링 신청
    // =====================================================

    public MentoringReservation createReservation(
            Long mentorId,
            Member member,
            MentoringReservationCreateDto request
    ) {

        if (member == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        if (request == null) {
            throw new IllegalArgumentException("멘토링 신청 정보가 없습니다.");
        }

        // 멘토 조회
        MentorProfile mentor =
                mentorProfileRepository.findById(mentorId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "멘토 정보를 찾을 수 없습니다."
                                )
                        );

        // 예약 정보 검증
        validate(request);

        // =================================================
        // 예약 날짜 확인
        // =================================================

        LocalDate reservationDate;

        try {
            reservationDate = LocalDate.parse(
                    request.getReservationDate()
            );
        } catch (Exception e) {
            throw new IllegalArgumentException(
                    "예약 날짜 형식이 올바르지 않습니다."
            );
        }

        // =================================================
        // 멘토 상담 가능 요일 확인
        // =================================================

        validateAvailableDay(
                mentor,
                reservationDate
        );

        // =================================================
        // 멘토 상담 가능 시간 확인
        // =================================================

        validateAvailableTime(
                mentor,
                request.getReservationTime()
        );

        // =================================================
        // 동일 시간 예약 확인
        // =================================================

        List<MentoringReservation> reservations =
                mentoringReservationRepository
                        .findByMentorAndReservationDate(
                                mentor,
                                request.getReservationDate()
                        );

        boolean alreadyReserved =
                reservations.stream()
                        .anyMatch(reservation ->
                                reservation.getReservationTime()
                                        .equals(request.getReservationTime())
                        );

        if (alreadyReserved) {
            throw new IllegalArgumentException(
                    "해당 시간에는 이미 멘토링 예약이 있습니다."
            );
        }

        // =================================================
        // 멘토링 신청 생성
        // =================================================

        MentoringReservation reservation =
                new MentoringReservation(
                        mentor,
                        member,
                        request.getConsultationTypes(),
                        request.getSkills(),
                        request.getReservationDate(),
                        request.getReservationTime(),
                        request.getProblem(),
                        request.getFileName(),
                        request.getFilePath()
                );

        return mentoringReservationRepository.save(
                reservation
        );
    }

    // =====================================================
    // 내가 신청한 멘토링 목록
    // =====================================================

    @Transactional(readOnly = true)
    public List<MentoringReservation> getMyReservations(
            Member member
    ) {

        return mentoringReservationRepository
                .findByMemberOrderByCreatedAtDesc(member);
    }

    // =====================================================
    // 멘토에게 들어온 신청 목록
    // =====================================================

    @Transactional(readOnly = true)
    public List<MentoringReservation> getMentorReservations(
            Member member
    ) {

        MentorProfile mentor =
                mentorProfileRepository
                        .findByMember(member)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "멘토 등록 정보를 찾을 수 없습니다."
                                )
                        );

        return mentoringReservationRepository
                .findByMentorOrderByCreatedAtDesc(mentor);
    }

    // =====================================================
    // 신청 승인
    // =====================================================

    public void approveReservation(
            Long reservationId,
            Member member
    ) {

        MentoringReservation reservation =
                getReservationForMentor(
                        reservationId,
                        member
                );

        reservation.approve();
    }

    // =====================================================
    // 신청 거절
    // =====================================================

    public void rejectReservation(
            Long reservationId,
            Member member
    ) {

        MentoringReservation reservation =
                getReservationForMentor(
                        reservationId,
                        member
                );

        reservation.reject();
    }

    // =====================================================
    // 멘토 본인 신청인지 확인
    // =====================================================

    private MentoringReservation getReservationForMentor(
            Long reservationId,
            Member member
    ) {

        MentoringReservation reservation =
                mentoringReservationRepository
                        .findById(reservationId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "멘토링 신청 정보를 찾을 수 없습니다."
                                )
                        );

        if (!reservation.getMentor()
                .getMember()
                .getId()
                .equals(member.getId())) {

            throw new IllegalArgumentException(
                    "본인에게 들어온 신청만 처리할 수 있습니다."
            );
        }

        return reservation;
    }

    // =====================================================
    // 신청 기본 검증
    // =====================================================

    private void validate(
            MentoringReservationCreateDto request
    ) {

        if (request.getConsultationTypes() == null ||
                request.getConsultationTypes().isBlank()) {

            throw new IllegalArgumentException(
                    "상담 분야를 선택해주세요."
            );
        }

        if (request.getSkills() == null ||
                request.getSkills().isBlank()) {

            throw new IllegalArgumentException(
                    "관련 기술을 선택해주세요."
            );
        }

        if (request.getReservationDate() == null ||
                request.getReservationDate().isBlank()) {

            throw new IllegalArgumentException(
                    "예약 날짜를 선택해주세요."
            );
        }

        if (request.getReservationTime() == null ||
                request.getReservationTime().isBlank()) {

            throw new IllegalArgumentException(
                    "예약 시간을 선택해주세요."
            );
        }

        if (request.getProblem() == null ||
                request.getProblem().isBlank()) {

            throw new IllegalArgumentException(
                    "현재 문제를 작성해주세요."
            );
        }
    }

    // =====================================================
    // 상담 가능 요일 확인
    // =====================================================

    private void validateAvailableDay(
            MentorProfile mentor,
            LocalDate reservationDate
    ) {

        String availableDays =
                mentor.getAvailableDays();

        if (availableDays == null ||
                availableDays.isBlank()) {

            throw new IllegalArgumentException(
                    "멘토가 상담 가능한 요일을 등록하지 않았습니다."
            );
        }

        String reservationDay =
                convertDayToKorean(
                        reservationDate.getDayOfWeek()
                );

        boolean available =
                Arrays.stream(
                                availableDays.split(",")
                        )
                        .map(String::trim)
                        .anyMatch(day ->
                                day.equals(reservationDay)
                        );

        if (!available) {
            throw new IllegalArgumentException(
                    "멘토가 해당 요일에는 상담이 불가능합니다."
            );
        }
    }

    // =====================================================
    // 상담 가능 시간 확인
    // =====================================================

    private void validateAvailableTime(
            MentorProfile mentor,
            String reservationTime
    ) {

        String availableStart =
                mentor.getAvailableStart();

        String availableEnd =
                mentor.getAvailableEnd();

        // 멘토가 시간을 등록하지 않았다면 시간 검증 생략
        if (availableStart == null ||
                availableStart.isBlank() ||
                availableEnd == null ||
                availableEnd.isBlank()) {
            return;
        }

        try {

            java.time.LocalTime requestedTime =
                    java.time.LocalTime.parse(
                            reservationTime
                    );

            java.time.LocalTime startTime =
                    java.time.LocalTime.parse(
                            availableStart
                    );

            java.time.LocalTime endTime =
                    java.time.LocalTime.parse(
                            availableEnd
                    );

            if (requestedTime.isBefore(startTime) ||
                    requestedTime.isAfter(endTime)) {

                throw new IllegalArgumentException(
                        "멘토의 상담 가능 시간 외에는 예약할 수 없습니다."
                );
            }

        } catch (java.time.format.DateTimeParseException e) {

            throw new IllegalArgumentException(
                    "예약 시간 형식이 올바르지 않습니다."
            );
        }
    }

    // =====================================================
    // 요일 변환
    // =====================================================

    private String convertDayToKorean(
            DayOfWeek dayOfWeek
    ) {

        return switch (dayOfWeek) {
            case MONDAY -> "월";
            case TUESDAY -> "화";
            case WEDNESDAY -> "수";
            case THURSDAY -> "목";
            case FRIDAY -> "금";
            case SATURDAY -> "토";
            case SUNDAY -> "일";
        };
    }
}
