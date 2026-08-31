package com.easys.repository;

import com.easys.entity.StudyApplication;
import com.easys.entity.StudyApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudyApplicationRepository extends JpaRepository<StudyApplication, Long> {

    Optional<StudyApplication>findByStudyIdAndMemberId(Long studyId, Long memberId);

    List<StudyApplication>findByStudyId(Long studyId);

    List<StudyApplication>findByStudyIdAndStatus(Long studyId,StudyApplicationStatus status);

    List<StudyApplication>findByMemberId(Long memberId);

    // 스터디 삭제 전에 해당 스터디의 신청 정보를 모두 삭제한다
    void deleteByStudyId(Long studyId);
}
