package com.easys.service;

import com.easys.dto.MentorProfileCreateDto;
import com.easys.dto.MentorProfileResponseDto;
import com.easys.entity.Member;
import com.easys.entity.MentorProfile;
import com.easys.entity.MentorStatus;
import com.easys.repository.MentorProfileRepository;
import com.easys.repository.MentoringReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MentorProfileService {

    private final MentorProfileRepository mentorProfileRepository;
    private final MentoringReservationRepository mentoringReservationRepository;

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
                        .github(trim(request.getGithub()))
                        .velog(trim(request.getVelog()))
                        .portfolio(trim(request.getPortfolio()))
                        .availableDays(trim(request.getAvailableDays()))
                        .availableDates(trim(request.getAvailableDates()))
                        .availableStart(trim(request.getAvailableStart()))
                        .availableEnd(trim(request.getAvailableEnd()))
                        .build();

        MentorProfile saved =
                mentorProfileRepository.save(mentorProfile);

        return new MentorProfileResponseDto(saved);
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

        return new MentorProfileResponseDto(mentorProfile);
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
                trim(request.getGithub()),
                trim(request.getVelog()),
                trim(request.getPortfolio()),
                trim(request.getAvailableDays()),
                trim(request.getAvailableDates()),
                trim(request.getAvailableStart()),
                trim(request.getAvailableEnd())
        );

        return new MentorProfileResponseDto(mentorProfile);
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

        // 해당 멘토에게 들어온 예약이 있다면 먼저 삭제
        mentoringReservationRepository
                .deleteAll(
                        mentoringReservationRepository
                                .findByMentorOrderByCreatedAtDesc(
                                        mentorProfile
                                )
                );

        // 예약 삭제 후 멘토 프로필 삭제
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

        return new MentorProfileResponseDto(mentorProfile);
    }

    // =====================================================
    // 승인된 멘토 목록
    // =====================================================

    @Transactional(readOnly = true)
    public List<MentorProfileResponseDto> getApprovedMentors() {

        return mentorProfileRepository
                .findByStatus(MentorStatus.APPROVED)
                .stream()
                .map(MentorProfileResponseDto::new)
                .collect(Collectors.toList());
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
    }

    private String trim(String value) {

        if (value == null) {
            return "";
        }

        return value.trim();
    }
}