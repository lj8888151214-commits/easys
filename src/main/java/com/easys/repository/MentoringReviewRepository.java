package com.easys.repository;

import com.easys.entity.MentoringReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface MentoringReviewRepository extends JpaRepository<MentoringReview, Long> {

    boolean existsByReservationId(Long reservationId);

    List<MentoringReview> findByReservationMentorIdOrderByCreatedAtDesc(Long mentorId);

    void deleteByReservationIdIn(Collection<Long> reservationIds);

    @Query("""
            SELECT r.reservation.mentor.id, AVG(r.rating), COUNT(r)
            FROM MentoringReview r
            GROUP BY r.reservation.mentor.id
            """)
    List<Object[]> findRatingStatsGroupedByMentorId();
}
