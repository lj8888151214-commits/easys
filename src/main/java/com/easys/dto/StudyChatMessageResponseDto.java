package com.easys.dto;

import com.easys.entity.StudyChatMessage;

import java.time.LocalDateTime;

public record StudyChatMessageResponseDto(
        Long id,
        Long studyId,
        Long memberId,
        String nickname,
        String profileImageUrl,
        String content,
        LocalDateTime createdAt
) {

    public static StudyChatMessageResponseDto from(StudyChatMessage message) {

        return new StudyChatMessageResponseDto(
                message.getId(),
                message.getStudy().getId(),
                message.getMember().getId(),
                message.getMember().getNickname(),
                message.getMember().getProfileImageUrl(),
                message.getContent(),
                message.getCreatedAt()
        );
    }
}
