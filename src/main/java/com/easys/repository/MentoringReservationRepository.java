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