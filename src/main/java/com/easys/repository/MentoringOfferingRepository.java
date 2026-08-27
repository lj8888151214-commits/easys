package com.easys.repository;

import com.easys.entity.MentorProfile;
import com.easys.entity.MentoringOffering;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MentoringOfferingRepository
        extends JpaRepository<MentoringOffering, Long> {

    // 특정 멘토가 등록한 멘토링 목록 (본인 관리 화면 / 다른 사용자의 멘토 찾기 화면 공용)
    List<MentoringOffering> findByMentorOrderByCreatedAtDesc(MentorProfile mentor);

    List<MentoringOffering> findByMentorIdOrderByCreatedAtDesc(Long mentorId);

    // 본인이 등록한 멘토링인지 확인 후 조회 (수정 권한 검증용)
    Optional<MentoringOffering> findByIdAndMentor(Long id, MentorProfile mentor);

    // 멘토 등록 정보 삭제 시 함께 정리 (FK 제약 위반 방지)
    void deleteByMentor(MentorProfile mentor);
}
