package com.easys.service;

import com.easys.dto.MentorProfileCreateDto;
import com.easys.dto.MentorProfileResponseDto;
import com.easys.dto.MentorScheduleDto;
import com.easys.entity.Member;
import com.easys.entity.MentorProfile;
import com.easys.entity.MentorStatus;
import com.easys.entity.MentoringReservation;
import com.easys.entity.PaymentProductType;
import com.easys.repository.MentorProfileRepository;
import com.easys.repository.MentoringOfferingRepository;
import com.easys.repository.MentoringReservationRepository;
import com.easys.repository.MentoringReviewRepository;
import com.easys.repository.PaymentRepository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MentorProfileService {

    private final MentorProfileRepository mentorProfileRepository;
    private final MentoringOfferingRepository mentoringOfferingRepository;
    private final MentoringReservationRepository mentoringReservationRepository;
    private final MentoringReviewRepository mentoringReviewRepository;
    private final PaymentRepository paymentRepository;

    // =====================================================
    // 멘토 등록
    // =====================================================

    public MentorProfileResponseDto createMentorProfile(
            Member member,
            MentorProfileCreateDto request
    ) {

        if (member == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        if (request == null) {
            throw new IllegalArgumentException("멘토 등록 정보가 없습니다.");
        }

        if (mentorProfileRepository.existsByMember(member)) {
            throw new IllegalArgumentException("이미 멘토 등록을 하셨습니다.");
        }

        validate(request);

        MentorProfile mentorProfile =
                MentorProfile.builder()
                        .member(member)
                        .title(request.getTitle().trim())
                        .introduction(request.getIntroduction().trim())
                        .career(request.getCareer().trim())
                        .careerDetail(trim(request.getCareerDetail()))
                        .certificates(trim(request.getCertificates()))
                        .skills(trim(request.getSkills()))
                        .price(request.getPrice())
                        .mentoringType(request.getMentoringType().trim())
                        .consultationFields(request.getConsultationFields().trim())
                        .github(normalizeLink(request.getGithub(), "github"))
                        .velog(normalizeLink(request.getVelog(), "velog"))
                        .portfolio(normalizeLink(request.getPortfolio(), "portfolio"))
                        .availableDays(trim(request.getAvailableDays()))
                        .availableDates(trim(request.getAvailableDates()))
                        .availableStart(trim(request.getAvailableStart()))
                        .availableEnd(trim(request.getAvailableEnd()))
                        .availableSchedules(trim(request.getAvailableSchedules()))
                        .build();

        MentorProfile saved =
                mentorProfileRepository.save(mentorProfile);

        return toResponse(saved);
    }

    // =====================================================
    // 내 멘토 정보 조회
    // =====================================================

    @Transactional(readOnly = true)
    public MentorProfileResponseDto getMyMentorProfile(
            Member member
    ) {

        MentorProfile mentorProfile =
                mentorProfileRepository
                        .findByMember(member)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "멘토 등록 정보를 찾을 수 없습니다."
                                )
                        );

        return toResponse(mentorProfile);
    }

    // =====================================================
    // 멘토 정보 수정
    // =====================================================

    public MentorProfileResponseDto updateMentorProfile(
            Member member,
            MentorProfileCreateDto request
    ) {

        MentorProfile mentorProfile =
                mentorProfileRepository
                        .findByMember(member)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "본인의 멘토 등록 정보를 찾을 수 없습니다."
                                )
                        );

        validate(request);

        mentorProfile.update(
                request.getTitle().trim(),
                request.getIntroduction().trim(),
                request.getCareer().trim(),
                trim(request.getCareerDetail()),
                trim(request.getCertificates()),
                trim(request.getSkills()),
                request.getPrice(),
                request.getMentoringType().trim(),
                request.getConsultationFields().trim(),
                normalizeLink(request.getGithub(), "github"),
                normalizeLink(request.getVelog(), "velog"),
                normalizeLink(request.getPortfolio(), "portfolio"),
                trim(request.getAvailableDays()),
                trim(request.getAvailableDates()),
                trim(request.getAvailableStart()),
                trim(request.getAvailableEnd()),
                trim(request.getAvailableSchedules())
        );

        return toResponse(mentorProfile);
    }

    // =====================================================
    // 내 멘토 정보 삭제
    // DELETE /mentor/me
    // =====================================================

    public void deleteMyMentorProfile(
            Member member
    ) {

        MentorProfile mentorProfile =
                mentorProfileRepository
                        .findByMember(member)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "본인의 멘토 등록 정보를 찾을 수 없습니다."
                                )
                        );

        List<MentoringReservation> reservations =
                mentoringReservationRepository.findByMentorOrderByCreatedAtDesc(mentorProfile);
        List<Long> reservationIds = reservations.stream()
                .map(MentoringReservation::getId)
                .toList();

        if (!reservationIds.isEmpty()) {
            mentoringReviewRepository.deleteByReservationIdIn(reservationIds);
            paymentRepository.deleteByProductTypeAndTargetIdIn(
                    PaymentProductType.MENTORING,
                    reservationIds
            );
            mentoringReservationRepository.deleteAll(reservations);
        }

        // 이 멘토가 등록한 멘토링(여러 개)도 함께 정리해야
        // mentor_profile 삭제 시 외래키 제약에 걸리지 않는다.
        mentoringOfferingRepository.deleteByMentor(mentorProfile);

        mentorProfileRepository.delete(mentorProfile);
    }

    // =====================================================
    // 멘토 상세보기
    // =====================================================

    @Transactional(readOnly = true)
    public MentorProfileResponseDto getMentorProfile(
            Long mentorId
    ) {

        MentorProfile mentorProfile =
                mentorProfileRepository
                        .findById(mentorId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "멘토 정보를 찾을 수 없습니다."
                                )
                        );

        return toResponse(mentorProfile);
    }

    // =====================================================
    // 승인된 멘토 목록
    // =====================================================

    @Transactional(readOnly = true)
    public List<MentorProfileResponseDto> getApprovedMentors() {

        Map<Long, double[]> ratingStats = getMentorRatingStats();

        return mentorProfileRepository
                .findByStatus(MentorStatus.APPROVED)
                .stream()
                .map(mentor -> {
                    double[] stats = ratingStats.getOrDefault(mentor.getId(), new double[]{0.0, 0.0});
                    return new MentorProfileResponseDto(
                            mentor,
                            Math.round(stats[0] * 10) / 10.0,
                            (long) stats[1]
                    );
                })
                .collect(Collectors.toList());
    }

    private MentorProfileResponseDto toResponse(MentorProfile mentorProfile) {
        double[] stats = getMentorRatingStats().getOrDefault(mentorProfile.getId(), new double[]{0.0, 0.0});
        return new MentorProfileResponseDto(
                mentorProfile,
                Math.round(stats[0] * 10) / 10.0,
                (long) stats[1]
        );
    }

    private Map<Long, double[]> getMentorRatingStats() {
        Map<Long, double[]> ratingStats = new HashMap<>();
        for (Object[] row : mentoringReviewRepository.findRatingStatsGroupedByMentorId()) {
            ratingStats.put(
                    ((Number) row[0]).longValue(),
                    new double[]{
                            row[1] == null ? 0.0 : ((Number) row[1]).doubleValue(),
                            row[2] == null ? 0.0 : ((Number) row[2]).doubleValue()
                    }
            );
        }
        return ratingStats;
    }

    // =====================================================
    // 입력값 검증
    // =====================================================

    private void validate(
            MentorProfileCreateDto request
    ) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "멘토 등록 정보가 없습니다."
            );
        }

        if (request.getTitle() == null ||
                request.getTitle().isBlank()) {

            throw new IllegalArgumentException(
                    "멘토링 제목을 입력해주세요."
            );
        }

        if (request.getIntroduction() == null ||
                request.getIntroduction().isBlank()) {

            throw new IllegalArgumentException(
                    "멘토링 소개를 입력해주세요."
            );
        }

        if (request.getCareer() == null ||
                request.getCareer().isBlank()) {

            throw new IllegalArgumentException(
                    "경력을 입력해주세요."
            );
        }

        if (request.getPrice() == null ||
                request.getPrice() < 0) {

            throw new IllegalArgumentException(
                    "멘토링 가격을 입력해주세요."
            );
        }

        if (request.getMentoringType() == null ||
                request.getMentoringType().isBlank()) {

            throw new IllegalArgumentException(
                    "상담 방식을 선택해주세요."
            );
        }

        if (request.getConsultationFields() == null ||
                request.getConsultationFields().isBlank()) {

            throw new IllegalArgumentException(
                    "상담 가능한 분야를 선택해주세요."
            );
        }

        validateLink(request.getGithub(), "github");
        validateLink(request.getVelog(), "velog");
        validateLink(request.getPortfolio(), "portfolio");

        if (request.getAvailableSchedules() != null && !request.getAvailableSchedules().isBlank()) {
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
    }

    private String trim(String value) {

        if (value == null) {
            return "";
        }

        return value.trim();
    }

    private void validateLink(String value, String service) {
        if (!trim(value).isEmpty() && normalizeLink(value, service).isEmpty()) {
            throw new IllegalArgumentException("올바른 형식의 링크를 입력해주세요.");
        }
    }

    private String normalizeLink(String value, String service) {
        String trimmedValue = trim(value);
        if (trimmedValue.isEmpty()) {
            return "";
        }

        String candidate = trimmedValue.matches("(?i)^https?://.*")
                ? trimmedValue
                : "https://" + trimmedValue;

        try {
            URI uri = URI.create(candidate);
            String scheme = uri.getScheme();
            String host = uri.getHost();
            if ((!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme))
                    || host == null || !host.contains(".")) {
                return "";
            }

            String normalizedHost = host.toLowerCase();
            String path = uri.getPath() == null ? "" : uri.getPath();
            if ("github".equals(service)
                    && (!("github.com".equals(normalizedHost) || "www.github.com".equals(normalizedHost))
                    || path.replace("/", "").isBlank())) {
                return "";
            }
            if ("velog".equals(service)
                    && (!("velog.io".equals(normalizedHost) || "www.velog.io".equals(normalizedHost))
                    || !path.startsWith("/@") || path.length() <= 2)) {
                return "";
            }
            return uri.toString();
        } catch (IllegalArgumentException e) {
            return "";
        }
    }
}
