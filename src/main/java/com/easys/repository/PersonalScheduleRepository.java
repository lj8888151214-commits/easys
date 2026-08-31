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
}