package com.easys.security;

import com.easys.repository.MemberRepository;
import com.easys.dto.StudyCreateDto;
import com.easys.dto.StudyResponseDto;
import com.easys.entity.Member;
import com.easys.entity.Study;
import com.easys.repository.StudyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StudyService {
    private final StudyRepository studyRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public StudyResponseDto createStudy(StudyCreateDto request, String email){
        // 현재 로그인한 회원 찾기
        Member member = memberRepository
                .findByEmail(email)
                .orElseThrow(() -> new RuntimeException("회원을 찾을 수 없습니다"));
        // 스터디 생성
        Study study = new Study(
                request.getTitle(),
                request.getContent(),
                request.getCategory(),
                request.getMaxMembers(),
                member);
//        studyRepository.save(study);
        studyRepository.save(study);

        return new StudyResponseDto(study);
    }

    // 스터디 하나 조회
    @Transactional(readOnly = true)
    public StudyResponseDto getStudy(Long id){
        Study study = studyRepository
                .findById(id)
                .orElseThrow(() -> new RuntimeException("스터디를 찾을 수 없습니다"));
        return new StudyResponseDto(study);
    }

    @Transactional
    public StudyResponseDto updateStudy(Long id, StudyCreateDto request, String email){
    Study study = studyRepository
            .findById(id)
            .orElseThrow(() -> new RuntimeException("스터디를 찾을 수 없습니다."));

    // 작성자 확인
        if (!study.getAuthor()
                .getEmail()
                .equals(email)){
            throw new RuntimeException("작성자만 수정이 가능합니다.");
        }
        study.update(
                request.getTitle(),
                request.getContent(),
                request.getCategory(),
                request.getMaxMembers()
        );
        return new StudyResponseDto(study);
    }

    // 스터디 삭제

    @Transactional
    public void deleteStudy(long id, String emil){
        Study study = studyRepository
                .findById(id)
                .orElseThrow(() -> new RuntimeException("스터디를 찾을 수 없습니다"));

        // 작성자 확인
        if (!study.getAuthor()
                .getEmail()
                .equals(emil)){
            throw new RuntimeException("작성자만 삭제가 가능합니다");
        }

        studyRepository.delete(study);
    }



}
