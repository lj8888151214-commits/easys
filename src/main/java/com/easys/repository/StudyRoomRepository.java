package com.easys.repository;

import com.easys.entity.StudyRoom;
import com.easys.entity.StudyRoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudyRoomRepository extends JpaRepository<StudyRoom, Long> {
    // 운영 중인 스터디룸 전체 조회
    List<StudyRoom> findByStatusOrderByNameAsc (StudyRoomStatus status);

    // 관리자용: 상태 상관없이 전체 조회 (최근 등록순)
    List<StudyRoom> findAllByOrderByCreatedAtDesc();
    // 이름 또는 위치로 검색
    List<StudyRoom> findByStatusAndNameContainingIgnoreCaseOrStatusAndLocationContainingIgnoreCase(
            StudyRoomStatus status1,
            String name,
            StudyRoomStatus status2,
            String location
    );
}
