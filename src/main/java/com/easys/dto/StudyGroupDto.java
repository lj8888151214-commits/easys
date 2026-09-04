package com.easys.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

// 모임 일정 수동 등록 요청 바디.
// study/createdBy는 서버가 로그인 사용자 기준으로 채우므로 클라이언트가 보내지 않는다.

@Getter
@Setter
@NoArgsConstructor
public class StudyGroupDto {
    private String title;
    private String description;
    private String type; // STUDY / MENTORING / GENERAL
    private LocalDateTime startAt;
    private LocalDateTime endAt;
}
