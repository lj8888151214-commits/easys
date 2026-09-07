package com.easys.repository;

import com.easys.entity.Member;
import com.easys.entity.PersonalSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface PersonalScheduleRepository extends JpaRepository<PersonalSchedule, Long> {

    List<PersonalSchedule> findByMemberOrderByStartAtAsc(Member member);

    List<PersonalSchedule> findByMemberAndStartAtBetweenOrderByStartAtAsc(
            Member member,
            LocalDateTime startAt,
            LocalDateTime endAt
    );

    // 특정 스트리밍 방에 연결된 방송 일정만 조회한다 (미니 달력용, 소유자 무관 전체 공개).
    List<PersonalSchedule> findByStreamingRoomIdOrderByStartAtAsc(Long streamingRoomId);
}