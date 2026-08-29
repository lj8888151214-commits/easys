package com.easys.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MentorScheduleDto {

    private String date;      // "2026-08-27"
    private String day;       // "목"
    private String startTime; // "10:00"
    private String endTime;   // "12:00"
}
