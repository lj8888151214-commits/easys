package com.easys.repository;

import com.easys.entity.Member;
import com.easys.entity.MentorProfile;
import com.easys.entity.MentoringReservation;
import com.easys.entity.MentoringReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MentoringReservationRepository
        extends JpaRepository<MentoringReservation, Long> {

    // 내가 신청한 멘토링 목록
    List<MentoringReservation> findByMemberOrderByCreatedAtDesc(
            Member member
    );

    // 여러 멘토링(offering)에 걸린 예약 중, 거절(REJECTED)이 아닌 것만 조회
    // (공개 목록/내 멘토링 관리 화면에서 "날짜별 슬롯 예약 여부"를 계산하기 위함)
    List<MentoringReservation> findByOfferingIdInAndStatusNot(
            List<Long> offeringIds,
            MentoringReservationStatus status
    );

    // 특정 멘토링(offering)에 걸린 예약 전체(상태 무관) — 삭제 가능 여부 확인 및
    // 완료/거절된 과거 기록의 offering 연결 해제(detach)에 사용한다.
    List<MentoringReservation> findByOfferingId(Long offeringId);

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