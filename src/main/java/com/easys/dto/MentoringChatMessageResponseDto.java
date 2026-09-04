package com.easys.dto;

import com.easys.entity.MentoringChatMessage;

import java.time.LocalDateTime;

public record MentoringChatMessageResponseDto(
        Long id,
        Long reservationId,
        Long senderId,
        String senderNickname,
        String senderProfileImageUrl,
        String content,
        LocalDateTime createdAt
) {

    public static MentoringChatMessageResponseDto from(MentoringChatMessage message) {

        return new MentoringChatMessageResponseDto(
                message.getId(),
                message.getReservation().getId(),
                message.getSender().getId(),
                message.getSender().getNickname(),
                message.getSender().getProfileImageUrl(),
                message.getContent(),
                message.getCreatedAt()
        );
    }
}
