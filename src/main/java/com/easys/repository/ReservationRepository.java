package com.easys.repository;

import com.easys.entity.Member;
import com.easys.entity.Reservation;
import com.easys.entity.ReservationStatus;
import com.easys.entity.Study;
import com.easys.entity.StudyRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface ReservationRepository
        extends JpaRepository<Reservation, Long> {

    // 내가 예약한 목록
    List<Reservation> findByMemberOrderByReservationDateDescStartTimeDesc(
            Member member
    );

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

    // 같은 스터디에 대해 이미 진행 중/확정된 예약이 있는지 확인 (중복 예약 방지)
    boolean existsByStudyAndStatusIn(Study study, List<ReservationStatus> statuses);

    // 스터디 삭제 시, 그 스터디를 참조하고 있는 예약을 전부 조회 (참조 해제용)
    List<Reservation> findByStudy(Study study);

    // 스터디 멤버 전체가 볼 수 있는 그 스터디의 예약 목록 (최근 생성 순)
    List<Reservation> findByStudyOrderByCreatedAtDesc(Study study);



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
    @Query("""
        SELECT COUNT(r)
        FROM Reservation r
        WHERE r.studyRoom = :studyRoom
          AND r.reservationDate = :reservationDate
          AND r.status IN :statuses
          AND r.startTime < :endTime
          AND r.endTime > :startTime
    """)
    long countOverlappingReservations(
            @Param("studyRoom") StudyRoom studyRoom,
            @Param("reservationDate") LocalDate reservationDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("statuses") List<ReservationStatus> statuses
    );
}