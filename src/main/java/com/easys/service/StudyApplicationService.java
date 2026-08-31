package com.easys.service;

import com.easys.dto.StudyApplicationResponseDto;
import com.easys.entity.Member;
import com.easys.entity.Study;
import com.easys.entity.StudyApplication;
import com.easys.entity.StudyApplicationStatus;
import com.easys.repository.MemberRepository;
import com.easys.repository.StudyApplicationRepository;
import com.easys.repository.StudyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudyApplicationService {

    private final StudyApplicationRepository applicationRepository;
    private final StudyRepository studyRepository;
    private final MemberRepository memberRepository;


    // =====================================================
    // 스터디 신청
    // =====================================================

    @Transactional
    public StudyApplicationResponseDto applyStudy(
            Long studyId,
            String email
    ) {

        Member member = findMember(email);

        Study study = findStudy(studyId);


        // 방장은 자신의 스터디에 신청할 수 없음
        if (study.getMember()
                .getId()
                .equals(member.getId())) {

            throw new IllegalArgumentException(
                    "스터디 방장은 자신의 스터디에 신청할 수 없습니다."
            );
        }


        // 모집 상태 확인
        if ("CLOSED".equals(study.getStatus())) {

            throw new IllegalArgumentException(
                    "모집이 종료된 스터디입니다."
            );
        }


        // 모집 인원 확인
        if (study.getCurrentMembers()
                >= study.getMaxMembers()) {

            throw new IllegalArgumentException(
                    "모집 인원이 가득 찼습니다."
            );
        }


        // 이미 신청했는지 확인
        if (applicationRepository
                .findByStudyIdAndMemberId(
                        studyId,
                        member.getId()
                )
                .isPresent()) {

            throw new IllegalArgumentException(
                    "이미 신청한 스터디입니다."
            );
        }


        StudyApplication application =
                new StudyApplication(
                        study,
                        member
                );


        StudyApplication savedApplication =
                applicationRepository.save(application);


        return new StudyApplicationResponseDto(
                savedApplication
        );
    }


    // =====================================================
    // 신청 취소
    // =====================================================

    @Transactional
    public void cancelApplication(
            Long applicationId,
            String email
    ) {

        StudyApplication application =
                findApplication(applicationId);


        // 본인의 신청인지 확인
        if (!application
                .getMember()
                .getEmail()
                .equals(email)) {

            throw new IllegalArgumentException(
                    "본인의 신청만 취소할 수 있습니다."
            );
        }


        // 대기중인 신청만 취소 가능
        if (application.getStatus()
                != StudyApplicationStatus.PENDING) {

            throw new IllegalArgumentException(
                    "대기중인 신청만 취소할 수 있습니다."
            );
        }


        applicationRepository.delete(application);
    }


    // =====================================================
    // 신청자 목록 조회
    // =====================================================

    @Transactional(readOnly = true)
    public List<StudyApplicationResponseDto> getApplications(
            Long studyId,
            String email
    ) {

        Study study = findStudy(studyId);


        // 방장만 신청자 목록 확인 가능
        checkOwner(study, email);


        return applicationRepository
                .findByStudyId(studyId)
                .stream()
                .map(StudyApplicationResponseDto::new)
                .toList();
    }


    // =====================================================
    // 신청 승인
    // =====================================================

    @Transactional
    public StudyApplicationResponseDto approveApplication(
            Long applicationId,
            String email
    ) {

        StudyApplication application =
                findApplication(applicationId);


        Study study =
                application.getStudy();


        // 방장 확인
        checkOwner(study, email);


        // 대기중인 신청만 승인 가능
        if (application.getStatus()
                != StudyApplicationStatus.PENDING) {

            throw new IllegalArgumentException(
                    "대기중인 신청만 승인할 수 있습니다."
            );
        }


        // 모집 상태 확인
        if ("CLOSED".equals(study.getStatus())) {

            throw new IllegalArgumentException(
                    "모집이 종료된 스터디입니다."
            );
        }


        // 현재 인원 확인
        if (study.getCurrentMembers()
                >= study.getMaxMembers()) {

            throw new IllegalArgumentException(
                    "모집 인원이 가득 찼습니다."
            );
        }


        // 승인
        application.approve();


        // 스터디 인원 증가
        study.increaseCurrentMembers();


        return new StudyApplicationResponseDto(
                application
        );
    }


    // =====================================================
    // 신청 거절
    // =====================================================

    @Transactional
    public StudyApplicationResponseDto rejectApplication(
            Long applicationId,
            String email
    ) {

        StudyApplication application =
                findApplication(applicationId);


        Study study =
                application.getStudy();


        // 방장 확인
        checkOwner(study, email);


        // 대기중인 신청만 거절 가능
        if (application.getStatus()
                != StudyApplicationStatus.PENDING) {

            throw new IllegalArgumentException(
                    "대기중인 신청만 거절할 수 있습니다."
            );
        }


        application.reject();


        return new StudyApplicationResponseDto(
                application
        );
    }


    // =====================================================
    // 내가 신청한 스터디 조회
    // =====================================================

    @Transactional(readOnly = true)
    public List<StudyApplicationResponseDto>
    getMyApplications(String email) {

        Member member =
                findMember(email);


        return applicationRepository
                .findByMemberId(member.getId())
                .stream()
                .map(StudyApplicationResponseDto::new)
                .toList();
    }


    // =====================================================
    // 스터디 탈퇴
    // =====================================================

    @Transactional
    public void leaveStudy(
            Long studyId,
            String email
    ) {

        Member member =
                findMember(email);


        Study study =
                findStudy(studyId);


        // 방장은 탈퇴할 수 없음
        if (study.getMember()
                .getId()
                .equals(member.getId())) {

            throw new IllegalArgumentException(
                    "스터디 방장은 스터디에서 탈퇴할 수 없습니다."
            );
        }


        StudyApplication application =
                applicationRepository
                        .findByStudyIdAndMemberId(
                                studyId,
                                member.getId()
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "스터디 참여 정보가 없습니다."
                                )
                        );


        // 승인된 회원만 탈퇴 가능
        if (application.getStatus()
                != StudyApplicationStatus.APPROVED) {

            throw new IllegalArgumentException(
                    "현재 스터디에 참여하고 있지 않습니다."
            );
        }


        // 현재 인원 감소
        study.decreaseCurrentMembers();


        // 신청 정보 삭제
        applicationRepository.delete(application);
    }


    // =====================================================
    // 회원 조회
    // =====================================================

    private Member findMember(String email) {

        return memberRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "회원을 찾을 수 없습니다."
                        )
                );
    }


    // =====================================================
    // 스터디 조회
    // =====================================================

    private Study findStudy(Long studyId) {

        return studyRepository
                .findById(studyId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "스터디를 찾을 수 없습니다."
                        )
                );
    }


    // =====================================================
    // 신청 조회
    // =====================================================

    private StudyApplication findApplication(
            Long applicationId
    ) {

        return applicationRepository
                .findById(applicationId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "스터디 신청 정보를 찾을 수 없습니다."
                        )
                );
    }


    // =====================================================
    // 방장 확인
    // =====================================================

    private void checkOwner(
            Study study,
            String email
    ) {

        if (!study.getMember()
                .getEmail()
                .equals(email)) {

            throw new IllegalArgumentException(
                    "스터디 방장만 이 작업을 할 수 있습니다."
            );
        }
    }
}