package com.easys.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class StudyGroupDto {
    private String title;
    private String category;
    private LocalDate targetDate;
    private String meetingTime;
    private int memberCount;
    private String description;
}