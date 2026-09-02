package com.easys.dto;

import com.easys.entity.Study;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
public class StudyResponseDto {
    private Long id;
    private String title;
    private String content;
    private String category;
    private String topic;
    private LocalDate studyDate;
    private LocalTime startTime;
    private LocalTime endTime;
    // 결제 마감(스터디 시작 12시간 전). 일정이 없는 레거시 스터디는 null.
    private LocalDateTime paymentDeadline;
    private int maxMembers;
    private int currentMembers;
    private String status;
    private Long memberId;
    private String nickname;
    private LocalDateTime createdAt;

    public StudyResponseDto(Study study) {
        this.id = study.getId();
        this.title = study.getTitle();
        this.content = study.getContent();
        this.category = study.getCategory();
        this.topic = study.getTopic();
        this.studyDate = study.getStudyDate();
        this.startTime = study.getStartTime();
        this.endTime = study.getEndTime();
        this.paymentDeadline = (study.getStudyDate() != null && study.getStartTime() != null)
                ? study.getStudyDate().atTime(study.getStartTime()).minusHours(12)
                : null;
        this.maxMembers = study.getMaxMembers();
        this.currentMembers = study.getCurrentMembers();
        this.status = study.getStatus();
        this.memberId = study.getMember().getId();
        this.nickname = study.getMember().getNickname();
        this.createdAt = study.getCreatedAt();
    }
}