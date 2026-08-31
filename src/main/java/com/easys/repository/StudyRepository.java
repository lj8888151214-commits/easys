package com.easys.repository;

import com.easys.entity.Study;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudyRepository
        extends JpaRepository<Study, Long> {

    // 최신 스터디부터 조회
    List<Study> findAllByOrderByCreatedAtDesc();
    // 제목으로 검색
    List<Study> findByTitleContainingIgnoreCase(String keyword);
    // 분야로 검색
    List<Study> findByCategory(String category);

    // 제목 + 분야 검색
    List<Study> findByTitleContainingIgnoreCaseAndCategory(
            String keyword,
            String category
    );

    /*
     * 승인할 때 사용하는 조회
     *
     * 동시에 여러 명을 승인하려고 할 경우
     * currentMembers가 꼬이는 것을 방지한다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Study s where s.id = :id")
    Optional<Study> findByIdForUpdate(@Param("id") Long id);
}