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
    // 1. 스터디 신청
    // =====================================================

    @Transactional
    public StudyApplicationResponseDto apply(
            Long studyId,
            String email
    ) {

        // -------------------------------------------------
        // 신청하려는 스터디 찾기
        // -------------------------------------------------

        Study study = studyRepository
                .findById(studyId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "존재하지 않는 스터디입니다."
                        )
                );


        // -------------------------------------------------
        // 신청하는 회원 찾기
        // -------------------------------------------------

        Member member = memberRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "존재하지 않는 회원입니다."
                        )
                );


        // -------------------------------------------------
        // 방장은 자기 스터디에 신청할 수 없음
        // -------------------------------------------------

        if (
                study.getMember()
                        .getId()
                        .equals(member.getId())
        ) {

            throw new IllegalArgumentException(
                    "자신이 만든 스터디에는 신청할 수 없습니다."
            );
        }


        // -------------------------------------------------
        // 모집중인지 확인
        // -------------------------------------------------

        if (
                !"RECRUITING".equals(study.getStatus())
        ) {

            throw new IllegalArgumentException(
                    "현재 모집중인 스터디가 아닙니다."
            );
        }


        // -------------------------------------------------
        // 현재 인원이 가득 찼는지 확인
        //
        // currentMembers에는 방장도 포함되어 있음
        // -------------------------------------------------

        if (
                study.getCurrentMembers()
                        >= study.getMaxMembers()
        ) {

            throw new IllegalArgumentException(
                    "모집 인원이 가득 찼습니다."
            );
        }


        // -------------------------------------------------
        // 이미 신청했는지 확인
        // -------------------------------------------------

        applicationRepository
                .findByStudyIdAndMemberId(
                        studyId,
                        member.getId()
                )
                .ifPresent(application -> {

                    throw new IllegalArgumentException(
                            "이미 신청한 스터디입니다."
                    );

                });


        // -------------------------------------------------
        // 신청 생성
        //
        // 바로 인원을 증가시키지 않는다.
        //
        // 신청 = PENDING
        //
        // 방장이 승인했을 때
        // currentMembers가 증가한다.
        // -------------------------------------------------

        StudyApplication application =
                new StudyApplication(
                        study,
                        member
                );


        // -------------------------------------------------
        // DB 저장
        // -------------------------------------------------

        StudyApplication saved =
                applicationRepository.save(
                        application
                );


        return new StudyApplicationResponseDto(
                saved
        );
    }


    // =====================================================
    // 2. 신청 취소
    // =====================================================

    @Transactional
    public void cancel(
            Long applicationId,
            String email
    ) {

        StudyApplication application =
                applicationRepository
                        .findById(applicationId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "신청 정보를 찾을 수 없습니다."
                                )
                        );


        // -------------------------------------------------
        // 신청한 본인인지 확인
        // -------------------------------------------------

        if (
                !application
                        .getMember()
                        .getEmail()
                        .equals(email)
        ) {

            throw new IllegalArgumentException(
                    "본인의 신청만 취소할 수 있습니다."
            );
        }


        // -------------------------------------------------
        // 승인된 신청은 취소할 수 없음
        // -------------------------------------------------

        if (
                application.getStatus()
                        == StudyApplicationStatus.APPROVED
        ) {

            throw new IllegalArgumentException(
                    "이미 승인된 신청은 취소할 수 없습니다."
            );
        }


        applicationRepository.delete(
                application
        );
    }


    // =====================================================
    // 3. 방장이 신청자 목록 확인
    // =====================================================

    @Transactional(readOnly = true)
    public List<StudyApplicationResponseDto>
    getApplications(
            Long studyId,
            String email
    ) {

        // -------------------------------------------------
        // 스터디 찾기
        // -------------------------------------------------

        Study study = studyRepository
                .findById(studyId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "스터디가 존재하지 않습니다."
                        )
                );


        // -------------------------------------------------
        // 현재 로그인한 사람이 방장인지 확인
        // -------------------------------------------------

        if (
                !study
                        .getMember()
                        .getEmail()
                        .equals(email)
        ) {

            throw new IllegalArgumentException(
                    "스터디 방장만 신청자를 확인할 수 있습니다."
            );
        }


        // -------------------------------------------------
        // 신청자 목록 반환
        // -------------------------------------------------

        return applicationRepository
                .findByStudyId(studyId)
                .stream()
                .map(
                        StudyApplicationResponseDto::new
                )
                .toList();
    }


    // =====================================================
    // 4. 신청 승인
    // =====================================================

    @Transactional
    public StudyApplicationResponseDto approve(
            Long applicationId,
            String email
    ) {

        // -------------------------------------------------
        // 신청 정보 찾기
        // -------------------------------------------------

        StudyApplication application =
                applicationRepository
                        .findById(applicationId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "신청 정보를 찾을 수 없습니다."
                                )
                        );


        // -------------------------------------------------
        // 해당 신청의 스터디 가져오기
        // -------------------------------------------------

        Study study =
                application.getStudy();


        // -------------------------------------------------
        // 방장인지 확인
        // -------------------------------------------------

        if (
                !study
                        .getMember()
                        .getEmail()
                        .equals(email)
        ) {

            throw new IllegalArgumentException(
                    "스터디 방장만 승인할 수 있습니다."
            );
        }


        // -------------------------------------------------
        // 이미 처리된 신청인지 확인
        // -------------------------------------------------

        if (
                application.getStatus()
                        != StudyApplicationStatus.PENDING
        ) {

            throw new IllegalArgumentException(
                    "이미 처리된 신청입니다."
            );
        }


        // -------------------------------------------------
        // 현재 인원 확인
        //
        // currentMembers에는 방장이 포함되어 있음
        // -------------------------------------------------

        if (
                study.getCurrentMembers()
                        >= study.getMaxMembers()
        ) {

            throw new IllegalArgumentException(
                    "모집 인원이 가득 찼습니다."
            );
        }


        // -------------------------------------------------
        // 신청 승인
        // -------------------------------------------------

        application.approve();


        // -------------------------------------------------
        // 실제 스터디 인원 증가
        // -------------------------------------------------

        study.increaseCurrentMembers();


        // -------------------------------------------------
        // 현재 인원이 최대 인원이 되면
        // Study의 increaseCurrentMembers()에서
        // 자동으로 CLOSED 처리됨
        // -------------------------------------------------

        return new StudyApplicationResponseDto(
                application
        );
    }


    // =====================================================
    // 5. 신청 거절
    // =====================================================

    @Transactional
    public StudyApplicationResponseDto reject(
            Long applicationId,
            String email
    ) {

        // -------------------------------------------------
        // 신청 정보 찾기
        // -------------------------------------------------

        StudyApplication application =
                applicationRepository
                        .findById(applicationId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "신청 정보를 찾을 수 없습니다."
                                )
                        );


        Study study =
                application.getStudy();


        // -------------------------------------------------
        // 방장인지 확인
        // -------------------------------------------------

        if (
                !study
                        .getMember()
                        .getEmail()
                        .equals(email)
        ) {

            throw new IllegalArgumentException(
                    "스터디 방장만 거절할 수 있습니다."
            );
        }


        // -------------------------------------------------
        // 이미 처리된 신청인지 확인
        // -------------------------------------------------

        if (
                application.getStatus()
                        != StudyApplicationStatus.PENDING
        ) {

            throw new IllegalArgumentException(
                    "이미 처리된 신청입니다."
            );
        }


        // -------------------------------------------------
        // 신청 거절
        // -------------------------------------------------

        application.reject();


        return new StudyApplicationResponseDto(
                application
        );
    }


    // =====================================================
    // 6. 내가 신청한 스터디
    // =====================================================

    @Transactional(readOnly = true)
    public List<StudyApplicationResponseDto>
    getMyApplications(
            String email
    ) {

        // -------------------------------------------------
        // 현재 로그인한 회원 찾기
        // -------------------------------------------------

        Member member =
                memberRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "존재하지 않는 회원입니다."
                                )
                        );


        // -------------------------------------------------
        // 내가 신청한 스터디 조회
        // -------------------------------------------------

        return applicationRepository
                .findByMemberId(
                        member.getId()
                )
                .stream()
                .map(
                        StudyApplicationResponseDto::new
                )
                .toList();
    }
}