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

    public PersonalScheduleResponseDto(PersonalSchedule schedule) {
        this.id = schedule.getId();
        this.title = schedule.getTitle();
        this.content = schedule.getContent();
        this.startAt = schedule.getStartAt();
        this.endAt = schedule.getEndAt();
    }
}
