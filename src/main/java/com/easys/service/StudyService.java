package com.easys.service;

import com.easys.dto.StudyCreateDto;
import com.easys.dto.StudyResponseDto;
import com.easys.entity.Member;
import com.easys.entity.Study;
import com.easys.repository.MemberRepository;
import com.easys.repository.StudyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudyService {

    private final StudyRepository studyRepository;

    private final MemberRepository memberRepository;


    // =====================================================
    // 스터디 생성
    // =====================================================

    @Transactional
    public StudyResponseDto createStudy(StudyCreateDto request, String email) {

        // 현재 로그인한 회원 찾기
        Member member = memberRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException("회원을 찾을 수 없습니다."));
        // 스터디 생성
        Study study = new Study(
                request.getTitle(),
                request.getContent(),
                request.getCategory(),
                request.getMaxMembers(),
                member
        );


        // DB 저장
        studyRepository.save(study);


        // 저장된 스터디를 DTO로 변환해서 반환
        return new StudyResponseDto(study);
    }


    // =====================================================
    // 스터디 전체 조회
    // =====================================================

    @Transactional(readOnly = true)
    public List<StudyResponseDto> getStudies() {

        /*
         * 스터디를 최신순으로 가져온다.
         */

        List<Study> studies = studyRepository
                        .findAllByOrderByCreatedAtDesc();


        /*
         * Entity
         *    ↓
         * DTO
         */

        return studies
                .stream()
                .map(StudyResponseDto::new)
                .toList();
    }


    // =====================================================
    // 스터디 상세 조회
    // =====================================================

    @Transactional(readOnly = true)
    public StudyResponseDto getStudy(Long id) {

        Study study = studyRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException("스터디를 찾을 수 없습니다."));


        return new StudyResponseDto(study);
    }


    // =====================================================
    // 스터디 수정
    // =====================================================

    @Transactional
    public StudyResponseDto updateStudy(Long id, StudyCreateDto request, String email) {

        // 수정할 스터디 찾기
        Study study = studyRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException("스터디를 찾을 수 없습니다."));


        // =================================================
        // 작성자 확인
        // =================================================

        /*
         * Study.java에서 작성자를
         *
         * private Member member;
         *
         * 로 만들었기 때문에
         *
         * study.getMember()
         *
         * 를 사용해야 한다.
         */

        if (!study.getMember()
                .getEmail()
                .equals(email)) {
            throw new RuntimeException("작성자만 수정이 가능합니다.");
        }

        // 스터디 내용 수정
        study.update(
                request.getTitle(),
                request.getContent(),
                request.getCategory(),
                request.getMaxMembers()
        );
        return new StudyResponseDto(study);
    }


    // =====================================================
    // 스터디 삭제
    // =====================================================

    @Transactional
    public void deleteStudy(Long id, String email) {

        // 삭제할 스터디 찾기
        Study study = studyRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException("스터디를 찾을 수 없습니다.")
                        );


        // =================================================
        // 작성자 확인
        // =================================================

        if (!study.getMember().getEmail().equals(email)) {
            throw new RuntimeException("작성자만 삭제가 가능합니다.");
        }
        // 삭제
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

        List<Study> studies;


        // =================================================
        // 1. 검색어 X + 카테고리 X
        // =================================================

        if ((keyword == null || keyword.isBlank()) && (category == null || category.isBlank())
        ) {studies = studyRepository
                            .findAllByOrderByCreatedAtDesc();
        }


        // =================================================
        // 2. 제목 검색만
        // =================================================

        else if (category == null || category.isBlank()) {
            studies = studyRepository
                            .findByTitleContainingIgnoreCase(keyword);
        }

        // =================================================
        // 3. 카테고리 검색만
        // =================================================

        else if (keyword == null || keyword.isBlank()) {
            studies = studyRepository.findByCategory(category);
        }
        // =================================================
        // 4. 제목 + 카테고리 검색
        // =================================================
        else {
            studies = studyRepository
                            .findByTitleContainingIgnoreCase(keyword)
                            .stream()
                            .filter(study -> study.getCategory()
                                    .equals(category))
                            .toList();
        }
        // Entity → DTO
        return studies
                .stream()
                .map(StudyResponseDto::new)
                .toList();
    }
}