package com.easys.service;

import com.easys.dto.MentorScheduleDto;
import com.easys.dto.MentoringOfferingCreateDto;
import com.easys.dto.MentoringOfferingResponseDto;
import com.easys.entity.Member;
import com.easys.entity.MentorProfile;
import com.easys.entity.MentoringOffering;
import com.easys.repository.MentorProfileRepository;
import com.easys.repository.MentoringOfferingRepository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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

    private final MentoringOfferingRepository mentoringOfferingRepository;
    private final MentorProfileRepository mentorProfileRepository;

    // =====================================================
    // 새로운 멘토링 등록 (기존 멘토링에는 영향 없음)
    // =====================================================

    public MentoringOfferingResponseDto createOffering(
            Member member,
            MentoringOfferingCreateDto request
    ) {
        MentorProfile mentor = getMentorOfMember(member);
        validate(request);

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

        return new MentoringOfferingResponseDto(mentoringOfferingRepository.save(offering));
    }

    // =====================================================
    // 내가 등록한 멘토링 목록 (본인 관리 화면)
    // =====================================================

    @Transactional(readOnly = true)
    public List<MentoringOfferingResponseDto> getMyOfferings(Member member) {
        MentorProfile mentor = getMentorOfMember(member);
        return mentoringOfferingRepository.findByMentorOrderByCreatedAtDesc(mentor)
                .stream()
                .map(MentoringOfferingResponseDto::new)
                .toList();
    }

    // =====================================================
    // 특정 멘토가 등록한 멘토링 목록 (다른 사용자의 멘토 찾기 화면)
    // =====================================================

    @Transactional(readOnly = true)
    public List<MentoringOfferingResponseDto> getOfferingsByMentor(Long mentorId) {
        return mentoringOfferingRepository.findByMentorIdOrderByCreatedAtDesc(mentorId)
                .stream()
                .map(MentoringOfferingResponseDto::new)
                .toList();
    }

    // =====================================================
    // 멘토링 수정 (해당 멘토링 하나만 수정, 다른 멘토링은 그대로 유지)
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

        return new MentoringOfferingResponseDto(offering);
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
