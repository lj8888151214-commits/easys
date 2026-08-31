package com.easys.service;

import com.easys.dto.MentorScheduleDto;
import com.easys.dto.MentoringOfferingCreateDto;
import com.easys.dto.MentoringOfferingResponseDto;
import com.easys.dto.MentoringOfferingSlotDto;
import com.easys.entity.Member;
import com.easys.entity.MentorProfile;
import com.easys.entity.MentorStatus;
import com.easys.entity.MentoringOffering;
import com.easys.entity.MentoringReservation;
import com.easys.entity.MentoringReservationStatus;
import com.easys.entity.PaymentProductType;
import com.easys.repository.MentorProfileRepository;
import com.easys.repository.MentoringOfferingRepository;
import com.easys.repository.MentoringReservationRepository;
import com.easys.repository.PaymentRepository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

// =====================================================
// 멘토링 등록/수정
//
// MentorProfile(멘토 등록, 1인당 1개)과 별개로,
// 한 멘토가 여러 개의 멘토링(Java/Spring/React 등)을
// 등록할 수 있도록 하는 서비스.
// =====================================================

@Service
@RequiredArgsConstructor
@Transactional
public class MentoringOfferingService {

    // 프로젝트 전반이 한국 사용자를 대상으로 하고(DB 접속 URL의 serverTimezone=Asia/Seoul 참고),
    // 서버 JVM 기본 시간대에 의존하지 않도록 "오늘" 계산은 명시적으로 이 시간대를 기준으로 한다.
    private static final ZoneId KOREA_ZONE = ZoneId.of("Asia/Seoul");

    private final MentoringOfferingRepository mentoringOfferingRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final MentoringReservationRepository mentoringReservationRepository;
    private final PaymentRepository paymentRepository;

    // =====================================================
    // 새로운 멘토링 등록 (기존 멘토링에는 영향 없음)
    // =====================================================

    public MentoringOfferingResponseDto createOffering(
            Member member,
            MentoringOfferingCreateDto request
    ) {
        if (member == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
        validate(request);
        ensureNoPastDates(request, Set.of());

        // "멘토 등록하기"는 클릭할 때마다 새로운 멘토링(Offering)을 만드는 버튼이다.
        // 아직 MentorProfile이 없는 첫 등록이라면, 별도의 "멘토 프로필 만들기" 화면 없이
        // 지금 입력한 멘토링 정보를 바탕으로 MentorProfile을 함께 만들어준다.
        MentorProfile mentor = getOrCreateMentorOfMember(member, request);

        MentoringOffering offering = new MentoringOffering(
                mentor,
                request.getTitle().trim(),
                trim(request.getSkills()),
                trim(request.getConsultationFields()),
                request.getMentoringType().trim(),
                request.getPrice(),
                trim(request.getAvailableDays()),
                trim(request.getAvailableDates()),
                trim(request.getAvailableStart()),
                trim(request.getAvailableEnd()),
                trim(request.getAvailableSchedules())
        );

        MentoringOffering saved = mentoringOfferingRepository.save(offering);
        return new MentoringOfferingResponseDto(saved, buildSlots(saved, Map.of(), true));
    }

    // =====================================================
    // 내가 등록한 멘토링 목록 (본인 관리 화면)
    //
    // 삭제되거나 사라지지 않고, 각 멘토링(offering)에 등록된
    // 날짜/시간(슬롯)별로 예약 가능/예약됨(신청자·상태 포함) 상태를
    // 함께 내려준다.
    // =====================================================

    @Transactional(readOnly = true)
    public List<MentoringOfferingResponseDto> getMyOfferings(Member member) {
        MentorProfile mentor = getMentorOfMember(member);
        List<MentoringOffering> offerings =
                mentoringOfferingRepository.findByMentorOrderByCreatedAtDesc(mentor);

        Map<Long, Map<String, MentoringReservation>> reservationsByOfferingAndDate =
                groupActiveReservationsByOfferingAndDate(offerings);

        return offerings.stream()
                .map(offering -> new MentoringOfferingResponseDto(
                        offering,
                        buildSlots(
                                offering,
                                reservationsByOfferingAndDate.getOrDefault(offering.getId(), Map.of()),
                                true
                        )
                ))
                .toList();
    }

    // =====================================================
    // 특정 멘토가 등록한 멘토링 목록 (다른 사용자의 멘토 찾기 화면 = 공개 목록)
    //
    // 멘토링(offering) 하나 전체를 숨기는 것이 아니라,
    // 그 안의 날짜/시간(슬롯) 중 이미 예약(거절 제외)이 걸린 슬롯만 제외한다.
    // - DB에서 지우는 것이 아니라 "공개 목록 조회"에서만 걸러낸다.
    // - 같은 멘토가 등록한 다른 멘토링/다른 날짜에는 영향을 주지 않는다.
    // - 신청 가능한 슬롯이 하나도 남지 않은 멘토링만 공개 목록에서 숨긴다.
    // - 예약이 거절(REJECTED)되면 해당 슬롯은 다시 신청 가능해진다.
    // =====================================================

    @Transactional(readOnly = true)
    public List<MentoringOfferingResponseDto> getOfferingsByMentor(Long mentorId) {
        return toPublicOfferingDtos(
                mentoringOfferingRepository.findByMentorIdOrderByCreatedAtDesc(mentorId)
        );
    }

    // =====================================================
    // 전체 공개 멘토링 목록 (mentor-grid).
    //
    // "사람 1명 = 카드 1개"가 아니라 "등록한 멘토링 1개 = 공개 카드 1개"이다.
    // 같은 멘토가 여러 멘토링을 등록했다면 그만큼 여러 카드로 노출된다.
    // 위 getOfferingsByMentor()와 동일한 슬롯 기준(신청 가능한 슬롯이
    // 하나도 없으면 숨김)을 그대로 적용한다.
    // =====================================================

    @Transactional(readOnly = true)
    public List<MentoringOfferingResponseDto> getAllPublicOfferings() {
        return toPublicOfferingDtos(
                mentoringOfferingRepository.findByMentorStatusOrderByCreatedAtDesc(MentorStatus.APPROVED)
        );
    }

    private List<MentoringOfferingResponseDto> toPublicOfferingDtos(List<MentoringOffering> offerings) {
        Map<Long, Map<String, MentoringReservation>> reservationsByOfferingAndDate =
                groupActiveReservationsByOfferingAndDate(offerings);

        LocalDate today = LocalDate.now(KOREA_ZONE);

        return offerings.stream()
                .map(offering -> {
                    List<MentoringOfferingSlotDto> availableSlots = buildSlots(
                            offering,
                            reservationsByOfferingAndDate.getOrDefault(offering.getId(), Map.of()),
                            false
                    ).stream()
                            .filter(MentoringOfferingSlotDto::isAvailable)
                            .filter(slot -> !LocalDate.parse(slot.getDate()).isBefore(today))
                            .toList();

                    return availableSlots.isEmpty()
                            ? null
                            : new MentoringOfferingResponseDto(offering, availableSlots);
                })
                .filter(Objects::nonNull)
                .toList();
    }

    // =====================================================
    // offeringId 목록에 걸린 예약(거절 제외)을 offeringId -> (날짜 -> 예약)으로 묶는다.
    //
    // 하나의 offering 안에서는 같은 날짜에 슬롯을 중복 등록할 수 없으므로
    // (validate() 참고) 날짜만으로 슬롯을 유일하게 식별할 수 있다.
    // =====================================================

    private Map<Long, Map<String, MentoringReservation>> groupActiveReservationsByOfferingAndDate(
            List<MentoringOffering> offerings
    ) {
        if (offerings.isEmpty()) {
            return Map.of();
        }

        List<Long> offeringIds = offerings.stream()
                .map(MentoringOffering::getId)
                .toList();

        Map<Long, Map<String, MentoringReservation>> result = new HashMap<>();
        for (MentoringReservation reservation : mentoringReservationRepository
                .findByOfferingIdInAndStatusNot(offeringIds, MentoringReservationStatus.REJECTED)) {
            result.computeIfAbsent(reservation.getOffering().getId(), key -> new HashMap<>())
                    .put(reservation.getReservationDate(), reservation);
        }
        return result;
    }

    // =====================================================
    // offering.availableSchedules(JSON)에 등록된 날짜별 항목을
    // 예약 존재 여부와 대조해 슬롯 목록으로 변환한다.
    //
    // includeReservationDetail = true  : 예약자 닉네임/상태/예약id까지 포함 (본인 관리 화면용)
    // includeReservationDetail = false : available 여부만 포함 (공개 목록용, 개인정보 노출 방지)
    // =====================================================

    private List<MentoringOfferingSlotDto> buildSlots(
            MentoringOffering offering,
            Map<String, MentoringReservation> reservationsByDate,
            boolean includeReservationDetail
    ) {
        List<MentorScheduleDto> schedules = parseSchedulesQuietly(offering.getAvailableSchedules());

        return schedules.stream()
                .map(schedule -> {
                    MentoringReservation reservation = reservationsByDate.get(schedule.getDate());
                    boolean available = reservation == null;

                    return new MentoringOfferingSlotDto(
                            schedule.getDate(),
                            schedule.getStartTime(),
                            schedule.getEndTime(),
                            available,
                            !available && includeReservationDetail ? reservation.getId() : null,
                            !available && includeReservationDetail ? reservation.getStatus().name() : null,
                            !available && includeReservationDetail ? reservation.getMember().getNickname() : null,
                            !available && includeReservationDetail ? findPaymentStatus(reservation.getId()) : null
                    );
                })
                .toList();
    }

    private String findPaymentStatus(Long reservationId) {
        return paymentRepository
                .findByProductTypeAndTargetId(PaymentProductType.MENTORING, reservationId)
                .map(payment -> payment.getStatus().name())
                .orElse(null);
    }

    private List<MentorScheduleDto> parseSchedulesQuietly(String availableSchedules) {
        if (availableSchedules == null || availableSchedules.isBlank()) {
            return List.of();
        }

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            List<MentorScheduleDto> schedules = objectMapper.readValue(
                    availableSchedules,
                    new TypeReference<List<MentorScheduleDto>>() {}
            );
            return schedules == null ? List.of() : schedules;
        } catch (Exception e) {
            return List.of();
        }
    }

    // =====================================================
    // 멘토링 수정 (해당 멘토링 하나만 수정, 다른 멘토링은 그대로 유지)
    //
    // 이미 예약(거절 제외)이 걸린 날짜/시간은 삭제하거나 시간을 바꿀 수 없다.
    // (예약 데이터와 슬롯 정보가 어긋나는 것을 막기 위함)
    // =====================================================

    public MentoringOfferingResponseDto updateOffering(
            Long offeringId,
            Member member,
            MentoringOfferingCreateDto request
    ) {
        MentorProfile mentor = getMentorOfMember(member);

        MentoringOffering offering =
                mentoringOfferingRepository.findByIdAndMentor(offeringId, mentor)
                        .orElseThrow(() ->
                                new IllegalArgumentException("본인이 등록한 멘토링만 수정할 수 있습니다.")
                        );

        validate(request);

        Map<String, MentoringReservation> bookedByDate =
                groupActiveReservationsByOfferingAndDate(List.of(offering))
                        .getOrDefault(offering.getId(), Map.of());

        ensureBookedSlotsPreserved(bookedByDate, request);
        ensureNoPastDates(request, bookedByDate.keySet());

        offering.update(
                request.getTitle().trim(),
                trim(request.getSkills()),
                trim(request.getConsultationFields()),
                request.getMentoringType().trim(),
                request.getPrice(),
                trim(request.getAvailableDays()),
                trim(request.getAvailableDates()),
                trim(request.getAvailableStart()),
                trim(request.getAvailableEnd()),
                trim(request.getAvailableSchedules())
        );

        return new MentoringOfferingResponseDto(offering, buildSlots(offering, bookedByDate, true));
    }

    // =====================================================
    // 멘토링(offering) 삭제
    //
    // - 예약중(PENDING)이거나 승인되어 진행 예정(APPROVED)인 예약이 하나라도
    //   있으면 삭제를 막는다.
    // - 이미 끝난 예약(COMPLETED/REJECTED)은 삭제하지 않고, offering 연결만
    //   끊어서(detach) "나의 멘토링 기록"에서 계속 확인할 수 있게 한다.
    //   (MentoringReservation.offering은 nullable FK라 기존에도
    //   offeringId 없이 신청된 예약을 그대로 지원하던 구조를 그대로 재사용한다.)
    // =====================================================

    public void deleteOffering(Long offeringId, Member member) {
        MentorProfile mentor = getMentorOfMember(member);

        MentoringOffering offering =
                mentoringOfferingRepository.findByIdAndMentor(offeringId, mentor)
                        .orElseThrow(() ->
                                new IllegalArgumentException("본인이 등록한 멘토링만 삭제할 수 있습니다.")
                        );

        List<MentoringReservation> reservations =
                mentoringReservationRepository.findByOfferingId(offeringId);

        boolean hasActiveReservation = reservations.stream()
                .anyMatch(reservation ->
                        reservation.getStatus() == MentoringReservationStatus.PENDING
                                || reservation.getStatus() == MentoringReservationStatus.APPROVED
                );

        if (hasActiveReservation) {
            throw new IllegalArgumentException("예약이 진행 중인 멘토링은 삭제할 수 없습니다.");
        }

        reservations.forEach(MentoringReservation::detachOffering);

        mentoringOfferingRepository.delete(offering);
    }

    // =====================================================
    // 이미 예약(PENDING/APPROVED/COMPLETED)이 걸린 날짜는
    // 수정 요청에서도 동일한 시작/종료 시간으로 남아있어야 한다.
    // 삭제되었거나 시간이 바뀌었다면 수정 자체를 막는다.
    // =====================================================

    private void ensureBookedSlotsPreserved(
            Map<String, MentoringReservation> bookedByDate,
            MentoringOfferingCreateDto request
    ) {
        if (bookedByDate.isEmpty()) {
            return;
        }

        Map<String, MentorScheduleDto> newSchedulesByDate = parseSchedulesQuietly(request.getAvailableSchedules())
                .stream()
                .collect(Collectors.toMap(MentorScheduleDto::getDate, schedule -> schedule, (a, b) -> a));

        for (Map.Entry<String, MentoringReservation> entry : bookedByDate.entrySet()) {
            String date = entry.getKey();
            MentoringReservation reservation = entry.getValue();
            MentorScheduleDto newSchedule = newSchedulesByDate.get(date);

            String expectedTime = newSchedule == null
                    ? null
                    : newSchedule.getStartTime() + " ~ " + newSchedule.getEndTime();

            if (newSchedule == null || !reservation.getReservationTime().equals(expectedTime)) {
                throw new IllegalArgumentException(
                        String.format("%s에는 이미 예약이 있어 해당 날짜/시간을 수정하거나 삭제할 수 없습니다.", date)
                );
            }
        }
    }

    // =====================================================
    // 오늘(한국 시간) 이전 날짜는 새로 등록/수정할 수 없다.
    // 단, 이미 예약(거절 제외)이 걸려 보호되고 있는 날짜(protectedDates)는
    // 시간이 지나 과거가 되었더라도 예외로 둔다. (기존 예약 기록 보존)
    // =====================================================

    private void ensureNoPastDates(MentoringOfferingCreateDto request, Set<String> protectedDates) {
        LocalDate today = LocalDate.now(KOREA_ZONE);

        for (MentorScheduleDto schedule : parseSchedulesQuietly(request.getAvailableSchedules())) {
            if (schedule == null || schedule.getDate() == null || protectedDates.contains(schedule.getDate())) {
                continue;
            }

            LocalDate date;
            try {
                date = LocalDate.parse(schedule.getDate());
            } catch (Exception e) {
                continue; // 형식 오류는 validate()에서 이미 걸러진다.
            }

            if (date.isBefore(today)) {
                throw new IllegalArgumentException(
                        String.format("%s는 이미 지난 날짜입니다. 오늘 이후 날짜만 등록할 수 있습니다.", schedule.getDate())
                );
            }
        }
    }

    private MentorProfile getMentorOfMember(Member member) {
        if (member == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        return mentorProfileRepository.findByMember(member)
                .orElseThrow(() ->
                        new IllegalArgumentException("먼저 멘토로 등록해주세요.")
                );
    }

    // =====================================================
    // 멘토링(Offering) 등록 시 사용하는 버전.
    //
    // 이 회원이 아직 MentorProfile이 없다면(=첫 멘토링 등록),
    // 지금 입력한 멘토링 정보(제목/가격/방식/기술/상담분야/일정)를
    // 그대로 재사용해 MentorProfile을 함께 생성한다.
    // 사용자 입장에서는 "멘토 등록"과 "멘토링 등록"이 하나의 동작으로
    // 느껴져야 하므로, 별도의 프로필 작성 화면을 거치게 하지 않는다.
    // (career/자격증/포트폴리오 등 프로필 전용 항목은 비워두고,
    //  필요하면 이후 "내 멘토 정보 수정하기"에서 채울 수 있다.)
    // =====================================================

    private MentorProfile getOrCreateMentorOfMember(Member member, MentoringOfferingCreateDto request) {
        return mentorProfileRepository.findByMember(member)
                .orElseGet(() -> mentorProfileRepository.save(
                        MentorProfile.builder()
                                .member(member)
                                .title(request.getTitle().trim())
                                .introduction(request.getTitle().trim() + " 멘토링을 진행합니다.")
                                .skills(trim(request.getSkills()))
                                .price(request.getPrice())
                                .mentoringType(request.getMentoringType().trim())
                                .consultationFields(trim(request.getConsultationFields()))
                                .availableDays(trim(request.getAvailableDays()))
                                .availableDates(trim(request.getAvailableDates()))
                                .availableStart(trim(request.getAvailableStart()))
                                .availableEnd(trim(request.getAvailableEnd()))
                                .availableSchedules(trim(request.getAvailableSchedules()))
                                .build()
                ));
    }

    // =====================================================
    // 입력값 검증 (MentorProfileService의 검증 로직과 동일한 규칙 적용)
    // =====================================================

    private void validate(MentoringOfferingCreateDto request) {
        if (request == null) {
            throw new IllegalArgumentException("멘토링 등록 정보가 없습니다.");
        }

        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("멘토링 이름을 입력해주세요.");
        }

        if (request.getPrice() == null || request.getPrice() < 0) {
            throw new IllegalArgumentException("멘토링 가격을 입력해주세요.");
        }

        if (request.getMentoringType() == null || request.getMentoringType().isBlank()) {
            throw new IllegalArgumentException("상담 방식을 선택해주세요.");
        }

        if (request.getConsultationFields() == null || request.getConsultationFields().isBlank()) {
            throw new IllegalArgumentException("상담 가능한 분야를 선택해주세요.");
        }

        if (request.getSkills() == null || request.getSkills().isBlank()) {
            throw new IllegalArgumentException("관련 기술을 선택해주세요.");
        }

        if (request.getAvailableSchedules() == null || request.getAvailableSchedules().isBlank()) {
            throw new IllegalArgumentException("상담 가능한 날짜를 하나 이상 등록해주세요.");
        }

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            List<MentorScheduleDto> schedules = objectMapper.readValue(
                    request.getAvailableSchedules(),
                    new TypeReference<List<MentorScheduleDto>>() {}
            );

            if (schedules == null || schedules.isEmpty()) {
                throw new IllegalArgumentException("상담 가능한 날짜를 하나 이상 등록해주세요.");
            }

            Set<String> scheduleDates = new HashSet<>();
            for (MentorScheduleDto schedule : schedules) {
                if (schedule == null || schedule.getDate() == null || schedule.getDate().isBlank()
                        || schedule.getStartTime() == null || schedule.getStartTime().isBlank()
                        || schedule.getEndTime() == null || schedule.getEndTime().isBlank()) {
                    throw new IllegalArgumentException("날짜별 상담 시작 시간과 종료 시간을 모두 입력해주세요.");
                }

                LocalDate.parse(schedule.getDate());
                LocalTime start = LocalTime.parse(schedule.getStartTime());
                LocalTime end = LocalTime.parse(schedule.getEndTime());
                if (!start.isBefore(end)) {
                    throw new IllegalArgumentException(
                            String.format("%s의 시작 시간은 종료 시간보다 빨라야 합니다.", schedule.getDate())
                    );
                }
                if (!scheduleDates.add(schedule.getDate())) {
                    throw new IllegalArgumentException("동일한 상담 날짜를 중복 등록할 수 없습니다.");
                }
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("상담 일정 데이터 형식이 올바르지 않습니다.");
        }
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }
}
