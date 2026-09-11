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

    // 18단계: "방금 등록한 일정"을 물었을 때 startAt(일정 자체의 날짜/시간)이 아니라
    // 실제로 언제 "생성"됐는지(createdAt)로 판단해야 한다 - 과거 날짜로 등록한
    // 일정이라도 방금 만들었다면 그게 "방금 등록한 일정"이다.
    List<PersonalSchedule> findByMemberOrderByCreatedAtDesc(Member member);
}