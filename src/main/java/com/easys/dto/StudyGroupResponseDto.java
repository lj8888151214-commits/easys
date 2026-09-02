package com.easys.dto;

import com.easys.entity.StudyGroup;

import java.time.LocalDateTime;

public record StudyGroupResponseDto(

        Long id,

        String title,

        // 프론트 Calendar.jsx가 기대하는 필드명에 맞춘다 (content = description)
        String content,

        String type,

        LocalDateTime startAt,

        LocalDateTime endAt,

        // 사람이 읽기 좋은 참여 인원 요약 (예: "3명 참여", "1:1 멘토링", "개인 등록")
        String members,

        // 스터디룸 예약으로 자동 생성된 일정이면 연결된 스터디 id (없으면 null).
        // 프론트에서 캘린더 일정 클릭 시 /study/{studyId}로 이동하는 데 사용한다.
        Long studyId
) {

    public static StudyGroupResponseDto from(StudyGroup group) {

        String members;

        if (group.getStudy() != null) {
            members = group.getStudy().getCurrentMembers() + "명 참여";
        } else if ("MENTORING".equals(group.getType())) {
            members = "1:1 멘토링";
        } else {
            members = "개인 등록";
        }

        return new StudyGroupResponseDto(
                group.getId(),
                group.getTitle(),
                group.getDescription(),
                group.getType(),
                group.getStartAt(),
                group.getEndAt(),
                members,
                group.getStudy() != null ? group.getStudy().getId() : null
        );
    }
}
