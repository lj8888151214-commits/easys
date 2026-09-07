package com.easys.dto;

import com.easys.entity.PersonalSchedule;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class PersonalScheduleResponseDto {

    private final Long id;
    private final String title;
    private final String content;
    private final LocalDateTime startAt;
    private final LocalDateTime endAt;

    // 스트리밍 방장이 방 안에서 등록한 방송 일정이면 그 방의 id (없으면 null).
    private final Long streamingRoomId;

    public PersonalScheduleResponseDto(PersonalSchedule schedule) {
        this.id = schedule.getId();
        this.title = schedule.getTitle();
        this.content = schedule.getContent();
        this.startAt = schedule.getStartAt();
        this.endAt = schedule.getEndAt();
        this.streamingRoomId = schedule.getStreamingRoomId();
    }
}
