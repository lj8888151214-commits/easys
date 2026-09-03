package com.easys.service;

import com.easys.dto.StudyRoomMapResponseDto;
import com.easys.entity.StudyRoomLocation;
import com.easys.repository.StudyRoomLocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudyRoomLocationService {

    private final StudyRoomLocationRepository studyRoomLocationRepository;

    public List<StudyRoomMapResponseDto> getAllStudyRoomLocations() {
        List<StudyRoomLocation> locations = studyRoomLocationRepository.findAll();

        return locations.stream().map(loc -> new StudyRoomMapResponseDto(
                loc.getStudyRoom().getId(),
                loc.getStudyRoom().getName(),
                loc.getStudyRoom().getLocation(),     // 🌟 loc.getStudyRoom().getAddress() -> location으로 변경
                loc.getStudyRoom().getDescription(),
                loc.getStudyRoom().getPricePerHour(), // 🌟 loc.getStudyRoom().getPrice() -> pricePerHour로 변경
                loc.getLatitude(),
                loc.getLongitude(),
                loc.getStudyRoom().getImageUrl()
        )).collect(Collectors.toList());
    }
}