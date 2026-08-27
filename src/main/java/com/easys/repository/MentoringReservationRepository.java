package com.easys.repository;

import com.easys.entity.Member;
import com.easys.entity.MentorProfile;
import com.easys.entity.MentoringReservation;
import com.easys.entity.MentoringReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MentoringReservationRepository
        extends JpaRepository<MentoringReservation, Long> {

    // 내가 신청한 멘토링 목록
    List<MentoringReservation> findByMemberOrderByCreatedAtDesc(
            Member member
    );

    // 특정 멘토링(offering)에 거절(REJECTED)이 아닌 예약이 이미 있는지 확인
    // (있다면 그 멘토링은 공개 목록에서 숨기고, 추가 신청도 막는다)
    boolean existsByOfferingIdAndStatusNot(
            Long offeringId,
            MentoringReservationStatus status
    );

    // 여러 멘토링(offering) 중 거절이 아닌 예약이 걸려 있는 offering id만 조회
    // (공개 목록 조회 시 한 번의 쿼리로 예약된 멘토링을 걸러내기 위함)
    @Query("""
            SELECT DISTINCT r.offering.id
            FROM MentoringReservation r
            WHERE r.offering.id IN :offeringIds
              AND r.status <> :excludedStatus
            """)
    List<Long> findOfferingIdsWithActiveReservation(
            @Param("offeringIds") List<Long> offeringIds,
            @Param("excludedStatus") MentoringReservationStatus excludedStatus
    );

    // 특정 멘토에게 들어온 신청 목록
    List<MentoringReservation> findByMentorOrderByCreatedAtDesc(
            MentorProfile mentor
    );

    // 특정 멘토의 특정 날짜 예약 확인
    List<MentoringReservation> findByMentorAndReservationDate(
            MentorProfile mentor,
            String reservationDate
    );

    // 멘토 + 상태별 신청 목록
    List<MentoringReservation> findByMentorAndStatusOrderByCreatedAtDesc(
            MentorProfile mentor,
            MentoringReservationStatus status
    );
}