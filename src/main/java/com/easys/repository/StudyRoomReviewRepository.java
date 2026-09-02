package com.easys.repository;

import com.easys.entity.Member;
import com.easys.entity.StudyRoom;
import com.easys.entity.StudyRoomReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudyRoomReviewRepository
        extends JpaRepository<StudyRoomReview, Long> {

    // 특정 스터디룸의 리뷰 목록 (최신순)
    List<StudyRoomReview> findByStudyRoomOrderByCreatedAtDesc(
            StudyRoom studyRoom
    );

    // 관리자 삭제 시 하드 삭제 가능 여부 판단용 (리뷰 이력이 있으면 FK 때문에 하드 삭제 불가)
    boolean existsByStudyRoom(StudyRoom studyRoom);

    // 특정 회원이 특정 스터디룸에 남긴 리뷰 (한 룸당 하나만 허용)
    Optional<StudyRoomReview> findByStudyRoomAndMember(
            StudyRoom studyRoom,
            Member member
    );

    // 스터디룸 평균 평점
    @Query("""
        SELECT AVG(r.rating)
        FROM StudyRoomReview r
        WHERE r.studyRoom = :studyRoom
    """)
    Double findAverageRatingByStudyRoom(
            @Param("studyRoom") StudyRoom studyRoom
    );
}
