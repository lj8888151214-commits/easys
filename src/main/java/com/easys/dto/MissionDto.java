package com.easys.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class MissionDto {
    private Long memberId; // 👈 회원 식별자 추가
    private String title;
    private String description;
    private LocalDate targetDate;
    private String category;
}