package com.easys.dto;

import com.easys.entity.StudyRoom;
import com.easys.entity.StudyRoomStatus;

import java.math.BigDecimal;

// 관리자 화면 전용 응답 DTO.
// ownerEmail(카페 사장님 이메일)은 관리자만 볼 수 있어야 하므로
// 일반 사용자에게 노출되는 StudyRoomResponseDto와 분리한다.
public record StudyRoomAdminResponseDto(
        Long id,
        String name,
        String location,
        String description,
        int minCapacity,
        int maxCapacity,
        BigDecimal pricePerHour,
        BigDecimal rating,
        String imageUrl,
        StudyRoomStatus status,
        String ownerEmail
) {

    public static StudyRoomAdminResponseDto from(StudyRoom studyRoom) {

        return new StudyRoomAdminResponseDto(
                studyRoom.getId(),
                studyRoom.getName(),
                studyRoom.getLocation(),
                studyRoom.getDescription(),
                studyRoom.getMinCapacity(),
                studyRoom.getMaxCapacity(),
                studyRoom.getPricePerHour(),
                studyRoom.getRating(),
                studyRoom.getImageUrl(),
                studyRoom.getStatus(),
                studyRoom.getOwnerEmail()
        );
    }
}
