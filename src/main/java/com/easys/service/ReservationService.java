package com.easys.service;

import com.easys.dto.ReservationCreateDto;
import com.easys.dto.ReservationResponseDto;
import com.easys.entity.*;
import com.easys.repository.MemberRepository;
import com.easys.repository.ReservationRepository;
import com.easys.repository.StudyRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final StudyRoomRepository studyRoomRepository;
    private final MemberRepository memberRepository;

    private final PersonalScheduleService personalScheduleService;

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

        // 1. 스터디룸이 예약 가능한 상태인지 확인
        if (studyRoom.getStatus() != StudyRoomStatus.ACTIVE) {
            throw new IllegalArgumentException(
                    "현재 예약할 수 없는 스터디룸입니다."
            );
        }

        // 2. 날짜 검증
        if (request.reservationDate() == null) {
            throw new IllegalArgumentException(
                    "예약 날짜를 입력해주세요."
            );
        }

        if (request.reservationDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "지난 날짜는 예약할 수 없습니다."
            );
        }

        // 3. 시간 검증
        if (request.startTime() == null ||
                request.endTime() == null) {

            throw new IllegalArgumentException(
                    "예약 시간을 입력해주세요."
            );
        }

        if (!request.startTime().isBefore(request.endTime())) {
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

        // 5. 예약 시간이 과거인지 확인
        if (request.reservationDate().equals(LocalDate.now())
                && request.startTime().isBefore(
                java.time.LocalTime.now()
        )) {

            throw new IllegalArgumentException(
                    "이미 지난 시간은 예약할 수 없습니다."
            );
        }

        // 6. 기존 예약과 시간 중복 확인
        long overlappingCount =
                reservationRepository.countOverlappingReservations(
                        studyRoom,
                        request.reservationDate(),
                        request.startTime(),
                        request.endTime(),
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
                request.startTime(),
                request.endTime()
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
                request.reservationDate(),
                request.startTime(),
                request.endTime(),
                request.peopleCount(),
                totalPrice
        );

        // 10. DB 저장
        Reservation savedReservation =
                reservationRepository.save(reservation);

        return ReservationResponseDto.from(savedReservation);
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

        // 캘린더 시작/종료 시간 생성
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

        // 캘린더 일정 생성
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

        // 예약 확정 + 캘린더 연결
        reservation.confirm(schedule);

        return ReservationResponseDto.from(reservation);
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

        // 연결된 캘린더 일정이 있다면 삭제
        if (reservation.getPersonalSchedule() != null) {

            personalScheduleService.deleteSchedule(
                    reservation.getPersonalSchedule().getId(),
                    reservation.getMember()
            );
        }

        reservation.cancel();
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