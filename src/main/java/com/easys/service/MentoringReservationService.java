package com.easys.service;

import com.easys.dto.MentorScheduleDto;
import com.easys.dto.MentoringReservationCreateDto;
import com.easys.dto.MentoringReservationResponseDto;
import com.easys.entity.Member;
import com.easys.entity.MentorProfile;
import com.easys.entity.MentoringOffering;
import com.easys.entity.MentoringReservation;
import com.easys.entity.MentoringReservationStatus;
import com.easys.entity.Payment;
import com.easys.entity.PaymentProductType;
import com.easys.entity.PaymentStatus;
import com.easys.repository.MentorProfileRepository;
import com.easys.repository.MentoringOfferingRepository;
import com.easys.repository.MentoringReservationRepository;
import com.easys.repository.PaymentRepository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MentoringReservationService {

    private final MentoringReservationRepository mentoringReservationRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final MentoringOfferingRepository mentoringOfferingRepository;
    private final PaymentRepository paymentRepository;

    // =====================================================
    // 멘토링 신청
    // =====================================================

    public MentoringReservationResponseDto createReservation(
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

        if (mentor.getMember().getId().equals(member.getId())) {
            throw new IllegalArgumentException("본인에게는 멘토링 상담을 신청할 수 없습니다.");
        }

        // =================================================
        // 신청 대상 멘토링(등록 상품) 확인
        //
        // 멘토 한 명이 여러 개의 멘토링(Java/Spring/React 등)을
        // 등록할 수 있으므로, 특정 멘토링을 선택해 신청한 경우에는
        // 그 멘토링의 가격/기술/일정을 기준으로 검증한다.
        // offeringId가 없으면(과거 방식) 멘토 프로필 자체의
        // 정보를 그대로 사용한다.
        // =================================================

        MentoringOffering offering = null;

        if (request.getOfferingId() != null) {
            offering = mentoringOfferingRepository.findById(request.getOfferingId())
                    .orElseThrow(() ->
                            new IllegalArgumentException("멘토링 정보를 찾을 수 없습니다.")
                    );

            if (!offering.getMentor().getId().equals(mentor.getId())) {
                throw new IllegalArgumentException("해당 멘토가 등록한 멘토링이 아닙니다.");
            }

            // =============================================
            // 이미 신청(거절 제외)이 들어온 멘토링인지 확인
            //
            // 공개 목록에서는 이미 숨겨지지만, API를 직접 호출하는
            // 경우에도 동일한 멘토링에 중복으로 신청할 수 없도록
            // 서버에서도 한 번 더 막는다.
            // =============================================

            if (mentoringReservationRepository.existsByOfferingIdAndStatusNot(
                    offering.getId(),
                    MentoringReservationStatus.REJECTED
            )) {
                throw new IllegalArgumentException("이미 다른 사용자가 신청한 멘토링입니다.");
            }
        }

        String targetAvailableSchedules = offering != null ? offering.getAvailableSchedules() : mentor.getAvailableSchedules();
        String targetAvailableDates = offering != null ? offering.getAvailableDates() : mentor.getAvailableDates();
        String targetAvailableStart = offering != null ? offering.getAvailableStart() : mentor.getAvailableStart();
        String targetAvailableEnd = offering != null ? offering.getAvailableEnd() : mentor.getAvailableEnd();
        String targetAvailableDays = offering != null ? offering.getAvailableDays() : mentor.getAvailableDays();
        String targetConsultationFields = offering != null ? offering.getConsultationFields() : mentor.getConsultationFields();
        String targetSkills = offering != null ? offering.getSkills() : mentor.getSkills();
        Integer targetPrice = offering != null ? offering.getPrice() : mentor.getPrice();

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
        // 멘토 상담 가능 일정 및 시간 확인
        // =================================================

        String reservationTime = getReservationTimeRange(
                targetAvailableSchedules,
                targetAvailableDates,
                targetAvailableStart,
                targetAvailableEnd,
                targetAvailableDays,
                reservationDate,
                request.getReservationDate()
        );

        validateReservationSelections(targetConsultationFields, targetSkills, request);

        // =================================================
        // 동일 시간 예약 확인
        // =================================================

        List<MentoringReservation> reservations =
                mentoringReservationRepository
                        .findByMentorAndReservationDate(
                                mentor,
                                request.getReservationDate()
                        );

        boolean alreadyReserved = reservations.stream()
                .anyMatch(item -> item.getStatus() != MentoringReservationStatus.REJECTED);

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
                        offering,
                        member,
                        request.getConsultationTypes(),
                        request.getSkills(),
                        request.getReservationDate(),
                        reservationTime,
                        request.getProblem(),
                        request.getFileName(),
                        request.getFilePath()
                );

        MentoringReservation saved = mentoringReservationRepository.save(reservation);
        paymentRepository.save(
                new Payment(
                        member,
                        PaymentProductType.MENTORING,
                        saved.getId(),
                        targetPrice == null ? 0 : targetPrice
                )
        );

        return new MentoringReservationResponseDto(saved);
    }

    // =====================================================
    // 내가 신청한 멘토링 목록
    // =====================================================

    @Transactional(readOnly = true)
    public List<MentoringReservationResponseDto> getMyReservations(
            Member member
    ) {

        return mentoringReservationRepository
                .findByMemberOrderByCreatedAtDesc(member)
                .stream()
                .map(MentoringReservationResponseDto::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> getBookedReservationDates(Long mentorId) {
        MentorProfile mentor = mentorProfileRepository.findById(mentorId)
                .orElseThrow(() -> new IllegalArgumentException("멘토 정보를 찾을 수 없습니다."));

        return mentoringReservationRepository.findByMentorOrderByCreatedAtDesc(mentor)
                .stream()
                .filter(reservation -> reservation.getStatus() != MentoringReservationStatus.REJECTED)
                .map(MentoringReservation::getReservationDate)
                .collect(Collectors.collectingAndThen(
                        Collectors.toCollection(LinkedHashSet::new),
                        List::copyOf
                ));
    }

    // =====================================================
    // 멘토에게 들어온 신청 목록
    // =====================================================

    @Transactional(readOnly = true)
    public List<MentoringReservationResponseDto> getMentorReservations(
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
                .findByMentorOrderByCreatedAtDesc(mentor)
                .stream()
                .map(MentoringReservationResponseDto::new)
                .toList();
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
        updatePaymentStatus(reservation.getId(), PaymentStatus.PAID);
    }

    // =====================================================
    // 신청 거절
    // =====================================================

    public void rejectReservation(
            Long reservationId,
            Member member,
            String reason
    ) {

        MentoringReservation reservation =
                getReservationForMentor(
                        reservationId,
                        member
                );

        String trimmedReason = reason == null ? null : reason.trim();

        reservation.reject(trimmedReason == null || trimmedReason.isEmpty() ? null : trimmedReason);
        updatePaymentStatus(reservation.getId(), PaymentStatus.CANCELLED);
    }

    // =====================================================
    // 수업 완료 처리 (승인된 예약 → 완료)
    //
    // 발표/테스트 목적으로 실제 상담 날짜를 기다리지 않고
    // 신청자 본인이 직접 완료 처리할 수 있도록 한다.
    // =====================================================

    public void completeReservation(
            Long reservationId,
            Member member
    ) {

        MentoringReservation reservation =
                getReservationForMember(
                        reservationId,
                        member
                );

        if (reservation.getStatus() != MentoringReservationStatus.APPROVED) {
            throw new IllegalArgumentException(
                    "승인된 멘토링만 완료 처리할 수 있습니다."
            );
        }

        reservation.complete();
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
    // 예약 신청자 본인인지 확인
    // =====================================================

    private MentoringReservation getReservationForMember(
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

        if (!reservation.getMember()
                .getId()
                .equals(member.getId())) {

            throw new IllegalArgumentException(
                    "본인이 신청한 멘토링만 처리할 수 있습니다."
            );
        }

        return reservation;
    }

    private void updatePaymentStatus(Long reservationId, PaymentStatus status) {
        paymentRepository.findByProductTypeAndTargetId(
                        PaymentProductType.MENTORING,
                        reservationId
                )
                .ifPresent(payment -> {
                    if (status == PaymentStatus.PAID) {
                        payment.markPaid();
                    } else if (status == PaymentStatus.CANCELLED) {
                        payment.cancel();
                    }
                });
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
    // 멘토 상담 가능 일정 및 시간 확인
    // =====================================================

    private String getReservationTimeRange(
            String availableSchedules,
            String availableDates,
            String availableStart,
            String availableEnd,
            String availableDays,
            LocalDate reservationDate,
            String reservationDateStr
    ) {
        if (availableSchedules != null && !availableSchedules.isBlank()) {
            try {
                ObjectMapper objectMapper = new ObjectMapper();
                List<MentorScheduleDto> schedules = objectMapper.readValue(
                        availableSchedules,
                        new TypeReference<List<MentorScheduleDto>>() {}
                );
                MentorScheduleDto schedule = schedules.stream()
                        .filter(item -> item != null && reservationDateStr.equals(item.getDate()))
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("선택한 날짜는 상담 가능한 날짜가 아닙니다."));

                java.time.LocalTime start = java.time.LocalTime.parse(schedule.getStartTime());
                java.time.LocalTime end = java.time.LocalTime.parse(schedule.getEndTime());
                if (!start.isBefore(end)) {
                    throw new IllegalArgumentException("멘토의 상담 가능 시간이 올바르지 않습니다.");
                }
                return schedule.getStartTime() + " ~ " + schedule.getEndTime();
            } catch (IllegalArgumentException e) {
                throw e;
            } catch (Exception e) {
                throw new IllegalArgumentException("멘토의 상담 일정 데이터가 올바르지 않습니다.");
            }
        }

        if (availableDates != null && !availableDates.isBlank()) {
            boolean dateMatched = Arrays.stream(availableDates.split(","))
                    .map(String::trim)
                    .anyMatch(date -> date.equals(reservationDateStr));
            if (!dateMatched) {
                throw new IllegalArgumentException("선택한 날짜는 상담 가능한 날짜가 아닙니다.");
            }
        } else {
            validateAvailableDay(availableDays, reservationDate);
        }

        try {
            java.time.LocalTime start = java.time.LocalTime.parse(availableStart);
            java.time.LocalTime end = java.time.LocalTime.parse(availableEnd);
            if (!start.isBefore(end)) {
                throw new IllegalArgumentException("멘토의 상담 가능 시간이 올바르지 않습니다.");
            }
            return availableStart + " ~ " + availableEnd;
        } catch (java.time.format.DateTimeParseException | NullPointerException e) {
            throw new IllegalArgumentException("멘토의 상담 가능 시간이 올바르지 않습니다.");
        }
    }

    private void validateReservationSelections(
            String consultationFields,
            String skills,
            MentoringReservationCreateDto request
    ) {
        validateSelectedItems(
                consultationFields,
                request.getConsultationTypes(),
                "멘토가 제공하지 않는 상담 분야입니다."
        );
        validateSelectedItems(
                skills,
                request.getSkills(),
                "멘토가 제공하지 않는 관련 기술입니다."
        );
    }

    private void validateSelectedItems(
            String mentorItems,
            String requestedItems,
            String message
    ) {
        Set<String> allowedItems = Arrays.stream(mentorItems == null ? new String[0] : mentorItems.split(","))
                .map(String::trim)
                .filter(item -> !item.isEmpty())
                .collect(Collectors.toSet());
        List<String> selectedItems = Arrays.stream(requestedItems.split(","))
                .map(String::trim)
                .filter(item -> !item.isEmpty())
                .toList();

        if (selectedItems.isEmpty() || !allowedItems.containsAll(selectedItems)) {
            throw new IllegalArgumentException(message);
        }
    }

    private void validateAvailableScheduleAndTime(
            MentorProfile mentor,
            LocalDate reservationDate,
            String reservationDateStr,
            String reservationTime
    ) {
        String availableSchedules = mentor.getAvailableSchedules();

        // availableSchedules(JSON) 데이터가 존재하는 경우
        if (availableSchedules != null && !availableSchedules.isBlank()) {
            List<MentorScheduleDto> schedules;
            try {
                ObjectMapper objectMapper = new ObjectMapper();
                schedules = objectMapper.readValue(
                        availableSchedules,
                        new TypeReference<List<MentorScheduleDto>>() {}
                );
            } catch (Exception e) {
                throw new IllegalArgumentException("멘토의 상담 일정 데이터가 올바르지 않습니다.");
            }

            if (schedules == null || schedules.isEmpty()) {
                throw new IllegalArgumentException("멘토가 등록한 상담 가능 일정이 없습니다.");
            }

            MentorScheduleDto targetSchedule = schedules.stream()
                    .filter(s -> s != null && s.getDate() != null && s.getDate().equals(reservationDateStr))
                    .findFirst()
                    .orElseThrow(() ->
                            new IllegalArgumentException("해당 날짜는 멘토의 상담 가능 날짜가 아닙니다.")
                    );

            if (targetSchedule.getStartTime() == null || targetSchedule.getStartTime().isBlank()
                    || targetSchedule.getEndTime() == null || targetSchedule.getEndTime().isBlank()) {
                throw new IllegalArgumentException("멘토의 상담 가능 시간이 올바르지 않습니다.");
            }

            try {
                java.time.LocalTime requestedTime = java.time.LocalTime.parse(reservationTime);
                java.time.LocalTime startTime = java.time.LocalTime.parse(targetSchedule.getStartTime());
                java.time.LocalTime endTime = java.time.LocalTime.parse(targetSchedule.getEndTime());

                if (!startTime.isBefore(endTime)) {
                    throw new IllegalArgumentException("멘토의 상담 가능 시간이 올바르지 않습니다.");
                }
                if (requestedTime.isBefore(startTime) || requestedTime.isAfter(endTime)) {
                    throw new IllegalArgumentException(
                            String.format("해당 날짜의 상담 가능 시간(%s ~ %s) 외에는 예약할 수 없습니다.",
                                    targetSchedule.getStartTime(), targetSchedule.getEndTime())
                    );
                }
            } catch (java.time.format.DateTimeParseException e) {
                throw new IllegalArgumentException("예약 시간 형식이 올바르지 않습니다.");
            }
            return;
        }

        // 기존 일정 데이터와의 호환 처리
        if (mentor.getAvailableDates() != null && !mentor.getAvailableDates().isBlank()) {
            boolean dateMatched = Arrays.stream(mentor.getAvailableDates().split(","))
                    .map(String::trim)
                    .anyMatch(d -> d.equals(reservationDateStr));
            if (!dateMatched) {
                throw new IllegalArgumentException("멘토가 지정한 상담 가능 날짜가 아닙니다.");
            }
        } else if (mentor.getAvailableDays() != null && !mentor.getAvailableDays().isBlank()) {
            validateAvailableDay(mentor.getAvailableDays(), reservationDate);
        }

        validateAvailableTime(mentor, reservationTime);
    }

    // =====================================================
    // 상담 가능 요일 확인
    // =====================================================

    private void validateAvailableDay(
            String availableDays,
            LocalDate reservationDate
    ) {

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
