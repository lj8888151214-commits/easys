package com.easys.service;

import com.easys.dto.AdminReservationResponseDto;
import com.easys.dto.ReservationCreateDto;
import com.easys.dto.ReservationResponseDto;
import com.easys.entity.*;
import com.easys.repository.MemberRepository;
import com.easys.repository.PaymentRepository;
import com.easys.repository.ReservationRepository;
import com.easys.repository.StudyApplicationRepository;
import com.easys.repository.StudyRepository;
import com.easys.repository.StudyRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class ReservationService {

    // 이용 시작 시각으로부터 GRACE_PERIOD_MINUTES(10분)까지는 신규 예약/결제가
    // 가능하다 (시계 오차/클릭 지연으로 1초 차이에 마감되는 것을 막기 위한
    // 여유 시간. 한국 시간 기준 서버 시각 LocalDateTime.now()로 판단).
    private static final int RESERVATION_GRACE_PERIOD_MINUTES = 10;

    // 일반 사용자의 예약 취소는 이용 시작 이 시간(1시간) 전까지만 가능하다.
    // (예약 생성/결제 마감과는 별개 기준이다.)
    // 관리자 취소(cancelReservationByAdmin)는 이 마감 정책의 적용을 받지 않는다.
    private static final int CANCELLATION_TIME_LIMIT_HOURS = 1;
    private static final int ORDER_NAME_MAX_LENGTH = 200;

    private final ReservationRepository reservationRepository;
    private final StudyRoomRepository studyRoomRepository;
    private final StudyRepository studyRepository;
    private final MemberRepository memberRepository;


    private final PersonalScheduleService personalScheduleService;

    private final PaymentRepository paymentRepository;
    private final StudyApplicationRepository studyApplicationRepository;

    private final StudyGroupService studyGroupService;
    private final EmailService emailService;
    private final NotificationService notificationService;


    /*
     * 예약 생성
     *
     * 주의:
     * 아직 결제하지 않았기 때문에 PENDING 상태로 저장한다.
     *
     * 결제 담당자가 결제 성공을 확인하면
     * confirmReservation()을 호출하여
     * CONFIRMED + 캘린더 등록을 처리한다.
     */
    public ReservationResponseDto createReservation(
            Long memberId,
            ReservationCreateDto request
    ) {

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "존재하지 않는 회원입니다."
                        )
                );

        StudyRoom studyRoom = studyRoomRepository.findById(
                request.studyRoomId()
        ).orElseThrow(() ->
                new IllegalArgumentException(
                        "존재하지 않는 스터디룸입니다."
                )
        );

        // 0. 스터디 예약이면 studyId로 Study를 조회한다.
        //
        // 비관적 락(findByIdForUpdate)으로 조회해 같은 스터디에 대한
        // 중복 예약 생성 요청(더블클릭 등)이 동시에 통과하지 못하게 막는다.
        //
        // 스터디 카드 자체는 날짜/시간 일정을 갖지 않으므로, 스터디 예약도
        // 개인 예약과 동일하게 클라이언트가 보낸 reservationDate/startTime/endTime을
        // 그대로 사용한다 (아래 2~5번 검증도 두 경우 모두 동일하게 적용된다).
        Study study = null;
        LocalDate reservationDate = request.reservationDate();
        LocalTime startTime = request.startTime();
        LocalTime endTime = request.endTime();

        if (request.studyId() != null) {

            study = studyRepository.findByIdForUpdate(request.studyId())
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "존재하지 않는 스터디입니다."
                            )
                    );

            if (!study.getMember().getId().equals(memberId)) {
                throw new IllegalArgumentException(
                        "스터디 대표자만 스터디룸을 예약할 수 있습니다."
                );
            }
        }

        // 1. 스터디룸이 예약 가능한 상태인지 확인
        if (studyRoom.getStatus() != StudyRoomStatus.ACTIVE) {
            throw new IllegalArgumentException(
                    "현재 예약할 수 없는 스터디룸입니다."
            );
        }

        // 2. 날짜 검증
        if (reservationDate == null) {
            throw new IllegalArgumentException(
                    "예약 날짜를 입력해주세요."
            );
        }

        if (reservationDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "지난 날짜는 예약할 수 없습니다."
            );
        }

        // 3. 시간 검증
        if (startTime == null || endTime == null) {

            throw new IllegalArgumentException(
                    "예약 시간을 입력해주세요."
            );
        }

        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException(
                    "시작 시간은 종료 시간보다 빨라야 합니다."
            );
        }

        // 4. 예약 인원 검증
        if (request.peopleCount() < studyRoom.getMinCapacity()
                || request.peopleCount() > studyRoom.getMaxCapacity()) {

            throw new IllegalArgumentException(
                    "예약 인원은 "
                            + studyRoom.getMinCapacity()
                            + "명 이상 "
                            + studyRoom.getMaxCapacity()
                            + "명 이하만 가능합니다."
            );
        }

        // 5. 신규 예약 마감(이용 시작 + 10분 여유) 확인
        //
        // 과거 시간은 물론, 이용 시작 후 여유 시간(10분)까지 지난 경우도
        // 신규 예약을 막는다. 개인 예약/스터디 예약 모두 동일하게 적용된다.
        if (!isBeforeStartDeadline(reservationDate.atTime(startTime))) {
            throw new IllegalArgumentException(
                    "예약은 이용 시작 " + RESERVATION_GRACE_PERIOD_MINUTES + "분 후까지만 가능합니다."
            );
        }

        // 6. 기존 예약과 시간 중복 확인
        long overlappingCount =
                reservationRepository.countOverlappingReservations(
                        studyRoom,
                        reservationDate,
                        startTime,
                        endTime,
                        List.of(
                                ReservationStatus.PENDING,
                                ReservationStatus.CONFIRMED
                        )
                );

        if (overlappingCount > 0) {
            throw new IllegalArgumentException(
                    "선택한 시간에는 이미 예약이 존재합니다."
            );
        }

        // 7. 예약 시간 계산
        long minutes = Duration.between(
                startTime,
                endTime
        ).toMinutes();

        // 현재는 시간 단위 예약만 허용
        if (minutes % 60 != 0) {
            throw new IllegalArgumentException(
                    "예약은 1시간 단위로만 가능합니다."
            );
        }

        long hours = minutes / 60;

        // 8. 서버에서 최종 금액 계산 (시간당 가격 * 시간 * 인원)
        BigDecimal totalPrice =
                studyRoom.getPricePerHour()
                        .multiply(BigDecimal.valueOf(hours))
                        .multiply(BigDecimal.valueOf(request.peopleCount()))
                        .setScale(2, RoundingMode.HALF_UP);

        // 9. 예약 Entity 생성
        Reservation reservation = new Reservation(
                member,
                studyRoom,
                study,
                reservationDate,
                startTime,
                endTime,
                request.peopleCount(),
                totalPrice
        );

        // 10. DB 저장
        Reservation savedReservation =
                reservationRepository.save(reservation);

        // 11. 결제 대기(READY) 상태의 Payment 생성
        // 결제창에는 서버가 계산한 금액(totalPrice)만 사용하며,
        // 실제 결제 승인은 PaymentService.confirmPayment()에서 이 금액을 기준으로 검증한다.
        String orderName = study != null
                ? study.getTitle() + " - " + studyRoom.getName() + " 스터디룸 예약"
                : studyRoom.getName() + " 스터디룸 예약";

        if (orderName.length() > ORDER_NAME_MAX_LENGTH) {
            orderName = orderName.substring(0, ORDER_NAME_MAX_LENGTH);
        }

        Payment payment = paymentRepository.save(
                new Payment(
                        member,
                        PaymentProductType.STUDY,
                        savedReservation.getId(),
                        totalPrice.setScale(0, RoundingMode.HALF_UP).intValueExact(),
                        orderName
                )
        );

        return ReservationResponseDto.from(savedReservation, payment);

    }

    // 내 예약 목록
    @Transactional(readOnly = true)
    public List<ReservationResponseDto> getMyReservations(
            Long memberId
    ) {

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "존재하지 않는 회원입니다."
                        )
                );

        return reservationRepository
                .findByMemberOrderByReservationDateDescStartTimeDesc(
                        member
                )
                .stream()
                .map(ReservationResponseDto::from)
                .toList();
    }

    // 스터디 예약 목록 (방장 + 승인된 참여자 모두 조회 가능)
    //
    // 방장이 어떤 스터디룸을 예약했는지 다른 팀원들도 볼 수 있어야 하므로,
    // 예약을 만든 사람이 아니라 그 스터디에 접근 권한이 있는 사람(방장 또는
    // 승인된 신청자)이면 누구나 조회할 수 있게 한다.
    @Transactional(readOnly = true)
    public List<ReservationResponseDto> getStudyReservations(
            Long memberId,
            Long studyId
    ) {

        Study study =
                studyRepository.findById(studyId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "존재하지 않는 스터디입니다."
                                )
                        );

        boolean isOwner =
                study.getMember().getId().equals(memberId);

        boolean isApprovedMember =
                studyApplicationRepository.existsByStudyIdAndMemberIdAndStatus(
                        studyId,
                        memberId,
                        StudyApplicationStatus.APPROVED
                );

        if (!isOwner && !isApprovedMember) {
            throw new IllegalArgumentException(
                    "스터디 참여자만 예약 현황을 조회할 수 있습니다."
            );
        }

        return reservationRepository
                .findByStudyOrderByCreatedAtDesc(study)
                .stream()
                .map(reservation -> ReservationResponseDto.from(reservation, findPayment(reservation.getId())))
                .toList();
    }

    // 예약 상세
    @Transactional(readOnly = true)
    public ReservationResponseDto getReservation(
            Long memberId,
            Long reservationId
    ) {

        Reservation reservation =
                reservationRepository.findById(reservationId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "존재하지 않는 예약입니다."
                                )
                        );

        validateOwner(reservation, memberId);

        return ReservationResponseDto.from(reservation);
    }

    /*
     * 예약 가능 시간 조회
     *
     * 해당 날짜에 이미 예약된 시간들을 반환한다.
     */
    @Transactional(readOnly = true)
    public List<ReservationResponseDto> getReservedTimes(
            Long roomId,
            LocalDate date
    ) {

        StudyRoom studyRoom =
                studyRoomRepository.findById(roomId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "존재하지 않는 스터디룸입니다."
                                )
                        );

        return reservationRepository
                .findByStudyRoomAndReservationDateAndStatusInOrderByStartTimeAsc(
                        studyRoom,
                        date,
                        List.of(
                                ReservationStatus.PENDING,
                                ReservationStatus.CONFIRMED
                        )
                )
                .stream()
                .map(ReservationResponseDto::from)
                .toList();
    }


    /*
     * 결제 성공 후 예약 확정
     *
     * 결제 담당자가 결제를 완료하면
     * 이 메서드를 호출한다.
     *
     * CONFIRMED가 되면서
     * PersonalSchedule이 생성된다.
     */
    public ReservationResponseDto confirmReservation(
            Long reservationId
    ) {

        Reservation reservation =
                reservationRepository.findById(reservationId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "존재하지 않는 예약입니다."
                                )
                        );

        if (reservation.getStatus()
                != ReservationStatus.PENDING) {

            throw new IllegalArgumentException(
                    "결제 대기 상태의 예약만 확정할 수 있습니다."
            );
        }

        confirmReservationAndCreateCalendar(reservation);

        return ReservationResponseDto.from(reservation, findPayment(reservation.getId()));
    }

    // =====================================================
    // 관리자 기능
    // =====================================================

    // 관리자 페이지: 전체 예약 목록 (누가 몇 시에 어느 스터디룸을 예약했는지)
    @Transactional(readOnly = true)
    public List<AdminReservationResponseDto> getAllReservationsForAdmin() {

        return reservationRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(reservation -> AdminReservationResponseDto.from(reservation, findPayment(reservation.getId())))
                .toList();
    }

    // 관리자 승인
    //
    // 결제가 완료(PAID)된 예약만 승인할 수 있으며, 승인되는 순간
    // 캘린더 일정이 생성되고 예약이 최종 확정(CONFIRMED)된다.
    // 스터디 연동 예약이면 모임 캘린더(StudyGroup)에, 개인 예약이면
    // 나의 캘린더(PersonalSchedule)에 등록된다.
    public ReservationResponseDto approveReservation(Long reservationId) {


        Reservation reservation =
                reservationRepository.findById(reservationId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "존재하지 않는 예약입니다."
                                )
                        );

        if (reservation.getStatus()
                != ReservationStatus.PAID) {

            throw new IllegalArgumentException(
                    "결제가 완료된 예약만 승인할 수 있습니다."
            );
        }


        // 캘린더 시작/종료 시간 생성

        confirmReservationAndCreateCalendar(reservation);

        return ReservationResponseDto.from(reservation, findPayment(reservation.getId()));
    }

    // 예약 확정 처리 (캘린더 일정 생성 + 상태 CONFIRMED 전환 + 알림)
    //
    // 스터디 예약이면 모임 캘린더(StudyGroup) 일정 하나를 만들어 참여자 전원이
    // 공유하고, 개인 예약이면 기존처럼 예약자 본인의 나의 캘린더(PersonalSchedule)에
    // 일정을 만든다.
    private void confirmReservationAndCreateCalendar(Reservation reservation) {


        LocalDateTime startAt =
                LocalDateTime.of(
                        reservation.getReservationDate(),
                        reservation.getStartTime()
                );

        LocalDateTime endAt =
                LocalDateTime.of(
                        reservation.getReservationDate(),
                        reservation.getEndTime()
                );

        if (reservation.isStudyReservation()) {

            StudyGroup groupSchedule =
                    studyGroupService.createForStudyReservation(reservation, startAt, endAt);

            reservation.confirmGroup(groupSchedule);

            // 모임장(예약자) + 승인된 스터디 참여자 전원에게 알림/이메일을 보낸다.
            // 승인되지 않은(PENDING/REJECTED) 신청자는 대상에서 제외된다.
            notifyStudyReservationConfirmed(reservation);

        } else {

            PersonalSchedule schedule =
                    personalScheduleService.createSchedule(
                            reservation.getMember(),
                            "스터디룸 예약 - "
                                    + reservation.getStudyRoom().getName(),
                            reservation.getStudyRoom().getLocation()
                                    + " / "
                                    + reservation.getPeopleCount()
                                    + "명 예약",
                            startAt,
                            endAt
                    );

            reservation.confirm(schedule);

            emailService.sendStudyReservationApprovedNotification(reservation, reservation.getMember());

            notificationService.notify(
                    reservation.getMember(),
                    "스터디룸 예약이 확정되었습니다",
                    reservation.getStudyRoom().getName() + " · "
                            + reservation.getReservationDate() + " "
                            + reservation.getStartTime() + " ~ " + reservation.getEndTime(),
                    "STUDY_RESERVATION_APPROVED",
                    reservation.getId()
            );
        }
    }

    // 스터디 연동 예약 확정 알림 대상(방장 + 승인된 참여자)을 모아 각자에게
    // 이메일 + 웹 알림을 보낸다. Map을 사용해 동일 회원에게 중복 발송되지
    // 않도록 회원 id로 중복을 제거한다.
    private void notifyStudyReservationConfirmed(Reservation reservation) {

        Map<Long, Member> recipients = new LinkedHashMap<>();

        recipients.put(reservation.getMember().getId(), reservation.getMember());

        studyApplicationRepository
                .findByStudyIdAndStatus(reservation.getStudy().getId(), StudyApplicationStatus.APPROVED)
                .forEach(application ->
                        recipients.put(application.getMember().getId(), application.getMember())
                );

        for (Member recipient : recipients.values()) {

            emailService.sendStudyReservationApprovedNotification(reservation, recipient);

            notificationService.notify(
                    recipient,
                    "스터디룸 예약이 확정되었습니다",
                    reservation.getStudyRoom().getName() + " · "
                            + reservation.getReservationDate() + " "
                            + reservation.getStartTime() + " ~ " + reservation.getEndTime(),
                    "STUDY_RESERVATION_APPROVED",
                    reservation.getId(),
                    reservation.getStudy().getId()
            );
        }
    }

    // 관리자에 의한 예약 취소
    //
    // - PAID(결제완료, 승인 대기) 상태면 "거절"에 해당한다.
    // - CONFIRMED(이미 승인 확정된) 상태면 카페 사정(휴업, 시설 문제 등)으로
    //   인한 "취소"에 해당하며, 이미 만들어둔 캘린더 일정도 함께 정리한다.
    // 두 경우 모두 결제를 취소 처리하고(실제 토스 환불은 별도) 예약자에게
    // 이메일 + 웹 알림으로 안내한다.
    public ReservationResponseDto cancelReservationByAdmin(Long reservationId) {

        Reservation reservation =
                reservationRepository.findById(reservationId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "존재하지 않는 예약입니다."
                                )
                        );

        ReservationStatus previousStatus = reservation.getStatus();

        if (previousStatus != ReservationStatus.PAID
                && previousStatus != ReservationStatus.CONFIRMED) {
            throw new IllegalArgumentException(
                    "결제가 완료됐거나 확정된 예약만 취소할 수 있습니다."
            );
        }

        // 캘린더 일정을 지우려면, 이 예약이 그 일정을 참조하는 FK부터 먼저
        // 끊어야 한다(cancel()이 personalSchedule/groupSchedule을 null로 만든다).
        // 그래서 "일정 id를 미리 기억해두고 → cancel() + flush → 그 다음에 삭제"
        // 순서로 처리한다.
        Long scheduleIdToDelete =
                reservation.getPersonalSchedule() != null
                        ? reservation.getPersonalSchedule().getId()
                        : null;
        Long groupScheduleIdToDelete =
                reservation.getGroupSchedule() != null
                        ? reservation.getGroupSchedule().getId()
                        : null;
        Member reservationOwner = reservation.getMember();

        reservation.cancel();
        cancelPaymentIfExists(reservation.getId());

        if (scheduleIdToDelete != null) {
            reservationRepository.flush();
            personalScheduleService.deleteScheduleIfOwnedBy(scheduleIdToDelete, reservationOwner);
        }

        if (groupScheduleIdToDelete != null) {
            reservationRepository.flush();
            studyGroupService.deleteIfLinkedToReservation(groupScheduleIdToDelete);
        }

        boolean wasConfirmed = previousStatus == ReservationStatus.CONFIRMED;

        emailService.sendStudyReservationCancelledByAdminNotification(reservation, wasConfirmed);

        notificationService.notify(
                reservation.getMember(),
                wasConfirmed ? "스터디룸 예약이 취소되었습니다" : "스터디룸 예약이 거절되었습니다",
                reservation.getStudyRoom().getName() + " · "
                        + reservation.getReservationDate() + " "
                        + reservation.getStartTime() + " ~ " + reservation.getEndTime(),
                wasConfirmed ? "STUDY_RESERVATION_CANCELLED_BY_ADMIN" : "STUDY_RESERVATION_REJECTED",
                reservation.getId()
        );

        return ReservationResponseDto.from(reservation, findPayment(reservation.getId()));
    }

    /*
     * 토스 결제 승인(confirm) 성공 후 PaymentController가 호출한다.
     *
     * 결제만으로 바로 예약을 확정하지 않고 PAID(승인 대기) 상태로
     * 전환한 뒤, 관리자와 스터디룸 사장님에게 알림 메일을 보낸다.
     * 실제 확정(CONFIRMED) + 캘린더 등록(개인 예약이면 나의 캘린더,
     * 스터디 연동 예약이면 모임 캘린더)은 관리자가 approveReservation()을
     * 호출해야 이루어진다.
     */
    public ReservationResponseDto onStudyPaymentConfirmed(
            Long reservationId
    ) {

        Reservation reservation =
                reservationRepository.findById(reservationId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "존재하지 않는 예약입니다."
                                )
                        );

        if (reservation.getStatus()
                != ReservationStatus.PENDING) {

            throw new IllegalArgumentException(
                    "결제 대기 상태의 예약만 결제 확정할 수 있습니다."
            );
        }

        reservation.markPaid();

        List<String> adminEmails = memberRepository.findByRole(MemberRole.ADMIN)
                .stream()
                .map(Member::getEmail)
                .toList();

        emailService.sendStudyReservationPaidNotification(
                reservation,
                adminEmails,
                reservation.getStudyRoom().getOwnerEmail()
        );

        return ReservationResponseDto.from(reservation, findPayment(reservation.getId()));

    }

    /*
     * 예약의 결제 마감(이용 시작 1시간 전) 여부를 검증한다.
     *
     * PaymentController가 Toss 결제 승인(paymentService.confirmPayment)을
     * 호출하기 "이전에" 이 메서드를 호출해, 마감이 지났으면 실제 결제가
     * 이뤄지기 전에 막는다. 개인 예약/스터디 예약 모두 동일하게 적용된다
     * (createReservation()의 신규 예약 마감과 같은 기준).
     */
    @Transactional(readOnly = true)
    public void assertPaymentDeadlineNotPassed(Long reservationId) {

        Reservation reservation =
                reservationRepository.findById(reservationId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "존재하지 않는 예약입니다."
                                )
                        );

        LocalDateTime startAt =
                reservation.getReservationDate().atTime(reservation.getStartTime());

        if (!isBeforeStartDeadline(startAt)) {
            throw new IllegalArgumentException(
                    "결제 마감(이용 시작 " + RESERVATION_GRACE_PERIOD_MINUTES + "분 후)이 지나 결제할 수 없습니다."
            );
        }
    }

    /*
     * 예약 취소
     */
    public void cancelReservation(
            Long memberId,
            Long reservationId
    ) {

        Reservation reservation =
                reservationRepository.findById(reservationId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "존재하지 않는 예약입니다."
                                )
                        );

        validateOwner(reservation, memberId);

        if (reservation.getStatus()
                == ReservationStatus.CANCELLED) {

            throw new IllegalArgumentException(
                    "이미 취소된 예약입니다."
            );
        }


        // 일반 사용자는 이용 시작 1시간 전부터는 취소할 수 없다.
        // (관리자 취소는 cancelReservationByAdmin()을 통해 별도로 처리되며
        // 이 마감 정책의 적용을 받지 않는다.)
        LocalDateTime startAt =
                reservation.getReservationDate().atTime(reservation.getStartTime());

        if (!isBeforeCancellationDeadline(startAt)) {
            throw new IllegalArgumentException(
                    "이용 시작 " + CANCELLATION_TIME_LIMIT_HOURS + "시간 전부터는 예약을 취소할 수 없습니다."
            );
        }

        // 캘린더 일정을 지우려면, 이 예약이 그 일정을 참조하는 FK부터 먼저
        // 끊어야 한다(cancel()이 personalSchedule/groupSchedule을 null로 만든다).
        // 그래서 "일정 id를 미리 기억해두고 → cancel() + flush → 그 다음에 삭제"
        // 순서로 처리한다.
        Long scheduleIdToDelete =
                reservation.getPersonalSchedule() != null
                        ? reservation.getPersonalSchedule().getId()
                        : null;
        Long groupScheduleIdToDelete =
                reservation.getGroupSchedule() != null
                        ? reservation.getGroupSchedule().getId()
                        : null;
        Member reservationOwner = reservation.getMember();

        reservation.cancel();
        cancelPaymentIfExists(reservation.getId());

        if (scheduleIdToDelete != null) {
            reservationRepository.flush();
            personalScheduleService.deleteSchedule(scheduleIdToDelete, reservationOwner);
        }

        if (groupScheduleIdToDelete != null) {
            reservationRepository.flush();
            studyGroupService.deleteIfLinkedToReservation(groupScheduleIdToDelete);
        }

        // 예약자가 직접 취소했을 때도 관리자가 알 수 있도록 관리자 전원에게
        // 웹 알림을 보낸다(관리자 페이지 방문 여부와 무관하게 헤더 알림에 뜬다).
        String notificationContent =
                reservationOwner.getNickname() + "님 · "
                        + reservation.getStudyRoom().getName() + " · "
                        + reservation.getReservationDate() + " "
                        + reservation.getStartTime() + " ~ " + reservation.getEndTime();

        memberRepository.findByRole(MemberRole.ADMIN)
                .forEach(admin -> notificationService.notify(
                        admin,
                        "고객이 예약을 취소했습니다",
                        notificationContent,
                        "STUDY_RESERVATION_CANCELLED_BY_MEMBER",
                        reservation.getId()
                ));
    }

    // 거절/취소된 예약에 연결된 결제가 있으면(READY 상태로 대기 중이던 결제)
    // CANCELLED로 정리한다. 결제를 PAID로 만드는 것은 오직
    // onStudyPaymentConfirmed()를 통해서만 가능하다.
    private void cancelPaymentIfExists(Long reservationId) {
        paymentRepository.findByProductTypeAndTargetId(
                        PaymentProductType.STUDY,
                        reservationId
                )
                .ifPresent(Payment::cancel);
    }

    private Payment findPayment(Long reservationId) {
        return paymentRepository
                .findByProductTypeAndTargetId(PaymentProductType.STUDY, reservationId)
                .orElse(null);

    }

    // 이용 시작 시각(startAt) 기준으로 지금이 신규 예약/결제 마감
    // (이용 시작 + 10분 여유) 이전인지 확인한다.
    // 경계값: 이용 시작이 15:00이면, 15:09는 마감 전(true), 15:10 이후는 마감 지남(false)이다.
    private boolean isBeforeStartDeadline(LocalDateTime startAt) {
        return LocalDateTime.now().isBefore(
                startAt.plusMinutes(RESERVATION_GRACE_PERIOD_MINUTES)
        );
    }

    // 이용 시작 시각(startAt) 기준으로 지금이 취소 마감(이용 시작 1시간 전) 이전인지 확인한다.
    // 경계값: 이용 시작이 15:00이면, 13:59는 마감 전(true), 14:00 이후는 마감 지남(false)이다.
    private boolean isBeforeCancellationDeadline(LocalDateTime startAt) {
        return LocalDateTime.now().isBefore(
                startAt.minusHours(CANCELLATION_TIME_LIMIT_HOURS)
        );
    }

    // 예약 소유자 확인
    private void validateOwner(
            Reservation reservation,
            Long memberId
    ) {

        if (!reservation.getMember().getId()
                .equals(memberId)) {

            throw new IllegalArgumentException(
                    "본인의 예약만 조회하거나 수정할 수 있습니다."
            );
        }
    }
}