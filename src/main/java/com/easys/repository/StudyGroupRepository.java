package com.easys.repository;

import com.easys.entity.StudyGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StudyGroupRepository extends JpaRepository<StudyGroup, Long> {
    List<StudyGroup> findByTargetDateBetween(LocalDate startDate, LocalDate endDate);
    List<StudyGroup> findByTargetDateGreaterThanEqualOrderByTargetDateAsc(LocalDate date);
}