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
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MentoringReservationService {

    // MentoringOfferingService와 동일한 기준(한국 시간)으로 "오늘"을 계산한다.
    private static final ZoneId KOREA_ZONE = ZoneId.of("Asia/Seoul");

    private final MentoringReservationRepository mentoringReservationRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final MentoringOfferingRepository mentoringOfferingRepository;
    private final PaymentRepository paymentRepository;
    private final PersonalScheduleService personalScheduleService;
    private final NotificationService notificationService;

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

            // 같은 멘토링(offering) 안의 다른 날짜/시간(슬롯)은 계속 신청할 수 있어야 하므로
            // 여기서는 offering 전체를 막지 않는다. 같은 날짜에 대한 중복 신청 여부는
            // 아래의 "동일 시간 예약 확인"(멘토 + 예약 날짜 기준)에서 한 번에 검증한다.
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

        if (reservationDate.isBefore(LocalDate.now(KOREA_ZONE))) {
            throw new IllegalArgumentException(
                    "이미 지난 날짜에는 멘토링을 신청할 수 없습니다."
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
        Payment payment = paymentRepository.save(
                new Payment(
                        member,
                        PaymentProductType.MENTORING,
                        saved.getId(),
                        targetPrice == null ? 0 : targetPrice,
                        mentor.getMember().getNickname() + " 멘토링"
                )
        );

        return new MentoringReservationResponseDto(saved, payment);
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
                .filter(reservation -> !Boolean.TRUE.equals(reservation.getHiddenByApplicant()))
                .map(reservation -> new MentoringReservationResponseDto(reservation, findPayment(reservation.getId())))
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
                .filter(reservation -> !Boolean.TRUE.equals(reservation.getHiddenByMentor()))
                .map(reservation -> new MentoringReservationResponseDto(reservation, findPayment(reservation.getId())))
                .toList();
    }

    // =====================================================
    // 나의 멘토링 기록에서 삭제 (본인 화면에서만 숨김)
    //
    // MentoringReservation row 자체는 지우지 않는다 — 상대방은 계속
    // 자신의 기록/후기/PersonalSchedule에서 이 예약을 참조하기 때문이다.
    // 완료된 기록만 대상으로 하며, 요청한 사람이 이 예약의 멘토인지
    // 신청자인지에 따라 해당하는 쪽 플래그만 켠다.
    // =====================================================

    public void hideMyRecord(Long reservationId, Member member) {
        MentoringReservation reservation = mentoringReservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("멘토링 예약 정보를 찾을 수 없습니다."));

        if (reservation.getStatus() != MentoringReservationStatus.COMPLETED) {
            throw new IllegalArgumentException("완료된 멘토링 기록만 삭제할 수 있습니다.");
        }

        boolean isMentor = reservation.getMentor().getMember().getId().equals(member.getId());
        boolean isApplicant = reservation.getMember().getId().equals(member.getId());

        if (!isMentor && !isApplicant) {
            throw new IllegalArgumentException("본인의 멘토링 기록만 삭제할 수 있습니다.");
        }

        if (isMentor) {
            reservation.hideForMentor();
        }
        if (isApplicant) {
            reservation.hideForApplicant();
        }
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

        // 승인만으로 결제 완료 처리하지 않는다. 결제는 토스 결제가 실제로
        // 성공한 뒤 onMentoringPaymentConfirmed()에서만 반영된다.
        reservation.approve();

        notificationService.notify(
                reservation.getMember(),
                "멘토가 선정되었습니다",
                mentoringName(reservation) + " 신청이 승인되었습니다. 결제를 진행해주세요.",
                "MENTORING_RESERVATION_APPROVED",
                reservation.getId()
        );
    }

    // =====================================================
    // 토스 결제 승인(confirm) 성공 후 PaymentController가 호출한다.
    //
    // - 승인(APPROVED) 상태가 아니면 결제를 확정할 수 없다(승인 전 결제 금지).
    // - 캘린더 등록은 결제 성공 시점에만 이루어진다.
    // =====================================================

    public void onMentoringPaymentConfirmed(Long reservationId) {
        MentoringReservation reservation =
                mentoringReservationRepository.findById(reservationId)
                        .orElseThrow(() -> new IllegalArgumentException("멘토링 신청 정보를 찾을 수 없습니다."));

        if (reservation.getStatus() != MentoringReservationStatus.APPROVED) {
            throw new IllegalArgumentException("승인된 예약만 결제를 확정할 수 있습니다.");
        }

        createCalendarSchedulesIfNeeded(reservation);

        notificationService.notify(
                reservation.getMentor().getMember(),
                "새로운 멘토링 예약이 결제 완료되었습니다",
                reservation.getMember().getNickname() + "님의 " + mentoringName(reservation) + " 결제가 완료되었습니다.",
                "MENTORING_PAYMENT_COMPLETED",
                reservation.getId()
        );

        notificationService.notify(
                reservation.getMember(),
                "결제가 완료되었습니다",
                "결제가 완료되었습니다. " + mentoringName(reservation) + " 일정이 확정되었습니다.",
                "MENTORING_PAYMENT_COMPLETED",
                reservation.getId()
        );
    }

    // 알림 문구에 쓸 멘토링 이름 (특정 멘토링을 선택해 신청한 경우 그 이름을,
    // 과거 방식(offering 없음)이면 "멘토 닉네임 멘토링"을 사용한다)
    private String mentoringName(MentoringReservation reservation) {
        return reservation.getOffering() != null
                ? reservation.getOffering().getTitle()
                : reservation.getMentor().getMember().getNickname() + " 멘토링";
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
        cancelPaymentIfExists(reservation.getId());
        removeCalendarSchedulesIfAny(reservation);
    }

    // =====================================================
    // 승인 시점에 멘토/신청자 각각의 개인 캘린더(PersonalSchedule)에
    // 확정 일정을 자동 생성한다.
    //
    // - 이미 생성되어 있으면(재승인 등) 다시 만들지 않는다.
    // - 예약 신청(PENDING) 단계가 아니라 "실제 확정"된 승인(APPROVED)
    //   시점에만 생성한다.
    // =====================================================

    private void createCalendarSchedulesIfNeeded(MentoringReservation reservation) {
        if (reservation.getMentorScheduleId() != null) {
            return;
        }

        LocalDateTime[] range = parseReservationDateTimeRange(reservation);
        if (range == null) {
            return;
        }

        Member mentorMember = reservation.getMentor().getMember();
        Member applicantMember = reservation.getMember();

        // 별도의 "멘토링" 일정 타입을 만들지 않고, 기존 개인 일정(일반일정)에
        // "상대방 이름님과 멘토링"이라는 단순한 제목으로만 등록한다.
        var mentorSchedule = personalScheduleService.createSchedule(
                mentorMember,
                applicantMember.getNickname() + "님과 멘토링",
                "",
                range[0],
                range[1]
        );

        var applicantSchedule = personalScheduleService.createSchedule(
                applicantMember,
                mentorMember.getNickname() + "님과 멘토링",
                "",
                range[0],
                range[1]
        );

        reservation.linkSchedules(mentorSchedule.getId(), applicantSchedule.getId());
    }

    // =====================================================
    // 승인 후 거절/취소될 때, 자동 생성됐던 캘린더 일정을 함께 정리한다.
    // =====================================================

    private void removeCalendarSchedulesIfAny(MentoringReservation reservation) {
        if (reservation.getMentorScheduleId() == null && reservation.getApplicantScheduleId() == null) {
            return;
        }

        personalScheduleService.deleteScheduleIfOwnedBy(
                reservation.getMentorScheduleId(), reservation.getMentor().getMember()
        );
        personalScheduleService.deleteScheduleIfOwnedBy(
                reservation.getApplicantScheduleId(), reservation.getMember()
        );
        reservation.clearScheduleLinks();
    }

    // reservationDate("2026-08-30") + reservationTime("14:00 ~ 15:00")를
    // PersonalSchedule에 필요한 시작/종료 LocalDateTime으로 변환한다.
    private LocalDateTime[] parseReservationDateTimeRange(MentoringReservation reservation) {
        try {
            LocalDate date = LocalDate.parse(reservation.getReservationDate());
            String[] times = reservation.getReservationTime().split("~");
            LocalTime startTime = LocalTime.parse(times[0].trim());
            LocalTime endTime = LocalTime.parse(times[1].trim());
            return new LocalDateTime[]{date.atTime(startTime), date.atTime(endTime)};
        } catch (Exception e) {
            return null;
        }
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

        boolean paid = paymentRepository
                .findByProductTypeAndTargetId(PaymentProductType.MENTORING, reservation.getId())
                .map(payment -> payment.getStatus() == PaymentStatus.PAID)
                .orElse(false);

        if (!paid) {
            throw new IllegalArgumentException(
                    "결제가 완료된 멘토링만 완료 처리할 수 있습니다."
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

    // 거절/취소된 예약에 연결된 결제가 있으면(READY 상태로 대기 중이던 결제)
    // CANCELLED로 정리한다. 결제를 PAID로 만드는 것은 오직
    // onMentoringPaymentConfirmed()를 통해서만 가능하다.
    private void cancelPaymentIfExists(Long reservationId) {
        paymentRepository.findByProductTypeAndTargetId(
                        PaymentProductType.MENTORING,
                        reservationId
                )
                .ifPresent(Payment::cancel);
    }

    private Payment findPayment(Long reservationId) {
        return paymentRepository
                .findByProductTypeAndTargetId(PaymentProductType.MENTORING, reservationId)
                .orElse(null);
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
