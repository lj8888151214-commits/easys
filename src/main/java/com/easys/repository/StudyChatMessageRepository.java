package com.easys.repository;

import com.easys.entity.StudyChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudyChatMessageRepository extends JpaRepository<StudyChatMessage, Long> {

    List<StudyChatMessage> findByStudyIdOrderByCreatedAtAsc(Long studyId);

    // 스터디 삭제 전에 해당 스터디의 채팅 기록을 모두 삭제한다 (StudyService.deleteStudy에서 사용)
    void deleteByStudyId(Long studyId);
}
