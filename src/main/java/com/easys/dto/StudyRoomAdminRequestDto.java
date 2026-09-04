package com.easys.dto;

import java.math.BigDecimal;

public record StudyRoomAdminRequestDto(

        String name,

        String location,

        String description,

        int minCapacity,

        int maxCapacity,

        BigDecimal pricePerHour,

        String imageUrl
) {
}
