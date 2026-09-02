package com.easys.dto;

import java.math.BigDecimal;

public record StudyRoomAdminRequestDto(

        String name,

        String location,

        String description,

        int minCapacity,

        int maxCapacity,

        BigDecimal pricePerHour,

        String imageUrl,

        // 카페(스터디룸) 사장님 이메일. 결제 완료 알림을 받을 주소.
        String ownerEmail
) {
}
