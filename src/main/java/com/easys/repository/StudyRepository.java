package com.easys.repository;

import com.easys.entity.Study;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudyRepository
        extends JpaRepository<Study, Long> {

    // 최신 스터디부터 조회
    List<Study> findAllByOrderByCreatedAtDesc();
    // 제목으로 검색
    List<Study> findByTitleContainingIgnoreCase(String keyword);
    // 분야로 검색
    List<Study> findByCategory(String category);

}