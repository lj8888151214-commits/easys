package com.easys.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class StudyRoomMapResponseDto {
    private Long studyRoomId;
    private String name;
    private String address;
    private String description;
    private BigDecimal pricePerHour; // StudyRoom 엔티티 필드명과 일치
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String imageUrl;
}