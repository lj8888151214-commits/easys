package com.easys.repository;

import com.easys.entity.Member;
import com.easys.entity.StudyGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface StudyGroupRepository extends JpaRepository<StudyGroup, Long> {

    /*
     * 특정 회원이 볼 수 있는 모임 일정만 조회한다.
     *
     * - 본인이 수동으로 등록한 일정(createdBy = member)
     * - 본인이 방장이거나 승인된 신청자로 참여 중인 스터디에 연결된 일정
     */
    @Query("""
        SELECT g FROM StudyGroup g
        WHERE g.startAt BETWEEN :start AND :end
          AND ( g.createdBy = :member
                OR ( g.study IS NOT NULL AND (
                      g.study.member = :member
                      OR EXISTS (SELECT 1 FROM StudyApplication a
                                 WHERE a.study = g.study AND a.member = :member
                                   AND a.status = com.easys.entity.StudyApplicationStatus.APPROVED) ) ) )
        ORDER BY g.startAt ASC
    """)
    List<StudyGroup> findVisibleForMember(
            @Param("member") Member member,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("""
        SELECT g FROM StudyGroup g
        WHERE g.startAt >= :from
          AND ( g.createdBy = :member
                OR ( g.study IS NOT NULL AND (
                      g.study.member = :member
                      OR EXISTS (SELECT 1 FROM StudyApplication a
                                 WHERE a.study = g.study AND a.member = :member
                                   AND a.status = com.easys.entity.StudyApplicationStatus.APPROVED) ) ) )
        ORDER BY g.startAt ASC
    """)
    List<StudyGroup> findUpcomingVisibleForMember(
            @Param("member") Member member,
            @Param("from") LocalDateTime from
    );
}
