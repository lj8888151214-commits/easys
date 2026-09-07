package com.easys.repository;

import com.easys.entity.StudyRoomLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StudyRoomLocationRepository extends JpaRepository<StudyRoomLocation, Long> {
}