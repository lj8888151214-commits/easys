package com.easys.repository;

import com.easys.entity.Member;
import com.easys.entity.Reservation;
import com.easys.entity.ReservationStatus;
import com.easys.entity.StudyRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface ReservationRepository
        extends JpaRepository<Reservation, Long> {

    // 내가 예약한 목록 (신청한 시간 최신순)
    List<Reservation> findByMemberOrderByCreatedAtDesc(
            Member member
    );

    // 관리자 페이지: 전체 예약 목록 (최근 생성 순)
    List<Reservation> findAllByOrderByCreatedAtDesc();

    // 특정 스터디룸 + 특정 날짜의 예약 목록
    List<Reservation> findByStudyRoomAndReservationDateAndStatusInOrderByStartTimeAsc(
            StudyRoom studyRoom,
            LocalDate reservationDate,
            List<ReservationStatus> statuses
    );

    // 리뷰 작성 자격 확인용: 결제까지 완료해 실제로 이용한 예약이 있는지 확인
    boolean existsByMemberAndStudyRoomAndStatus(
            Member member,
            StudyRoom studyRoom,
            ReservationStatus status
    );

    // 관리자 삭제 시 하드 삭제 가능 여부 판단용 (예약 이력이 있으면 FK 때문에 하드 삭제 불가)
    boolean existsByStudyRoom(StudyRoom studyRoom);


//      시간 중복 검사
//
//      기존 예약:
//      19:00 ~ 21:00
//
//      새로운 예약:
//      20:00 ~ 22:00
//      두 시간이 겹치므로 true
//
//      조건:
//      기존 시작시간 < 새로운 종료시간
//      AND
//      기존 종료시간 > 새로운 시작시간
//
//      스터디룸은 방을 통째로 빌리는 게 아니라 정원(maxCapacity)까지
//      서로 다른 사람들이 같은 시간대를 나눠 쓸 수 있어야 하므로,
//      "예약 건수"가 아니라 겹치는 예약들의 "누적 인원수"를 구한다.
    @Query("""
        SELECT COALESCE(SUM(r.peopleCount), 0)
        FROM Reservation r
        WHERE r.studyRoom = :studyRoom
          AND r.reservationDate = :reservationDate
          AND r.status IN :statuses
          AND r.startTime < :endTime
          AND r.endTime > :startTime
    """)
    int sumOverlappingPeopleCount(
            @Param("studyRoom") StudyRoom studyRoom,
            @Param("reservationDate") LocalDate reservationDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("statuses") List<ReservationStatus> statuses
    );
}