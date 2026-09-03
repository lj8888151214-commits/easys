package com.easys.dto;

import com.easys.entity.Notification;

import java.time.LocalDateTime;

public record NotificationResponseDto(
        Long id,
        String title,
        String content,
        String type,
        Long targetId,
        Long studyId,
        boolean read,
        LocalDateTime createdAt
) {

    public static NotificationResponseDto from(Notification notification) {

        return new NotificationResponseDto(
                notification.getId(),
                notification.getTitle(),
                notification.getContent(),
                notification.getType(),
                notification.getTargetId(),
                notification.getStudyId(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
