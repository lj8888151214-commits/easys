package com.easys.service;

import com.easys.dto.StudyCreateDto;
import com.easys.dto.StudyResponseDto;
import com.easys.entity.Member;
import com.easys.entity.MemberRole;
import com.easys.entity.Study;
import com.easys.repository.MemberRepository;
import com.easys.repository.StudyApplicationRepository;
import com.easys.repository.StudyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudyService {

    private final StudyRepository studyRepository;

    private final StudyApplicationRepository applicationRepository;

    private final MemberRepository memberRepository;


    // =====================================================
    // 스터디 생성
    // =====================================================

    @Transactional
    public StudyResponseDto createStudy(
            StudyCreateDto request,
            String email
    ) {

        if (request == null) {

            throw new IllegalArgumentException(
                    "스터디 정보를 입력해주세요."
            );
        }


        Member member =
                memberRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "회원을 찾을 수 없습니다."
                                )
                        );


        Study study =
                new Study(
                        request.getTitle(),
                        request.getContent(),
                        request.getCategory(),
                        request.getMaxMembers(),
                        member
                );


        Study savedStudy =
                studyRepository.save(study);


        return new StudyResponseDto(
                savedStudy
        );
    }


    // =====================================================
    // 스터디 전체 조회
    // =====================================================

    @Transactional(readOnly = true)
    public List<StudyResponseDto> getStudies() {

        return studyRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(StudyResponseDto::new)
                .toList();
    }


    // =====================================================
    // 스터디 상세 조회
    // =====================================================

    @Transactional(readOnly = true)
    public StudyResponseDto getStudy(
            Long id
    ) {

        Study study =
                studyRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "스터디를 찾을 수 없습니다."
                                )
                        );


        return new StudyResponseDto(
                study
        );
    }


    // =====================================================
    // 스터디 수정
    // =====================================================

    @Transactional
    public StudyResponseDto updateStudy(
            Long id,
            StudyCreateDto request,
            String email
    ) {

        if (request == null) {

            throw new IllegalArgumentException(
                    "스터디 정보를 입력해주세요."
            );
        }


        Study study =
                studyRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "스터디를 찾을 수 없습니다."
                                )
                        );


        // 작성자 확인
        checkOwner(
                study,
                email
        );


        study.update(
                request.getTitle(),
                request.getContent(),
                request.getCategory(),
                request.getMaxMembers()
        );


        return new StudyResponseDto(
                study
        );
    }


    // =====================================================
    // 스터디 삭제
    // =====================================================

    @Transactional
    public void deleteStudy(
            Long id,
            String email
    ) {

        Study study =
                studyRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "스터디를 찾을 수 없습니다."
                                )
                        );


        // 작성자 본인이거나 관리자만 삭제 가능
        checkOwnerOrAdmin(
                study,
                email
        );


        /*
         * StudyApplication이 Study를 참조하고 있으므로
         * 신청 정보를 먼저 삭제한다.
         */
        applicationRepository.deleteByStudyId(id);


        // 스터디 삭제
        studyRepository.delete(study);
    }


    // =====================================================
    // 스터디 검색
    // =====================================================

    @Transactional(readOnly = true)
    public List<StudyResponseDto> searchStudy(
            String keyword,
            String category
    ) {

        boolean hasKeyword =
                keyword != null &&
                        !keyword.isBlank();


        boolean hasCategory =
                category != null &&
                        !category.isBlank();


        List<Study> studies;


        // 검색 조건 없음
        if (!hasKeyword && !hasCategory) {

            studies =
                    studyRepository
                            .findAllByOrderByCreatedAtDesc();
        }


        // 제목 검색
        else if (hasKeyword && !hasCategory) {

            studies =
                    studyRepository
                            .findByTitleContainingIgnoreCase(
                                    keyword.trim()
                            );
        }


        // 카테고리 검색
        else if (!hasKeyword && hasCategory) {

            studies =
                    studyRepository
                            .findByCategory(
                                    category.trim()
                            );
        }


        // 제목 + 카테고리 검색
        else {

            studies =
                    studyRepository
                            .findByTitleContainingIgnoreCaseAndCategory(
                                    keyword.trim(),
                                    category.trim()
                            );
        }


        return studies
                .stream()
                .map(StudyResponseDto::new)
                .toList();
    }


    // =====================================================
    // 작성자 확인
    // =====================================================

    private void checkOwner(
            Study study,
            String email
    ) {

        if (!study.getMember()
                .getEmail()
                .equals(email)) {

            throw new IllegalArgumentException(
                    "스터디 작성자만 수정하거나 삭제할 수 있습니다."
            );
        }
    }


    // 삭제 전용: 작성자 본인이거나 관리자면 통과
    private void checkOwnerOrAdmin(
            Study study,
            String email
    ) {

        if (study.getMember().getEmail().equals(email)) {
            return;
        }

        Member requester =
                memberRepository.findByEmail(email)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "회원을 찾을 수 없습니다."
                                )
                        );

        if (requester.getRole() != MemberRole.ADMIN) {

            throw new IllegalArgumentException(
                    "스터디 작성자만 수정하거나 삭제할 수 있습니다."
            );
        }
    }
}