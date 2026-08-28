package com.easys.dto;

import com.easys.entity.StudyRoom;
import com.easys.entity.StudyRoomStatus;

import java.math.BigDecimal;

public record StudyRoomResponseDto(
        Long id,
        String name,
        String location,
        String description,
        int minCapacity,
        int maxCapacity,
        BigDecimal pricePerHour,
        BigDecimal rating,
        String imageUrl,
        StudyRoomStatus status
) {

    public static StudyRoomResponseDto from(StudyRoom studyRoom) {

        return new StudyRoomResponseDto(
                studyRoom.getId(),
                studyRoom.getName(),
                studyRoom.getLocation(),
                studyRoom.getDescription(),
                studyRoom.getMinCapacity(),
                studyRoom.getMaxCapacity(),
                studyRoom.getPricePerHour(),
                studyRoom.getRating(),
                studyRoom.getImageUrl(),
                studyRoom.getStatus()
        );
    }
}