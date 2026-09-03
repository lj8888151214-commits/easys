package com.easys.dto;

import com.easys.entity.Study;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class StudyResponseDto {
    private Long id;
    private String title;
    private String content;
    private String category;
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
        this.maxMembers = study.getMaxMembers();
        this.currentMembers = study.getCurrentMembers();
        this.status = study.getStatus();
        this.memberId = study.getMember().getId();
        this.nickname = study.getMember().getNickname();
        this.createdAt = study.getCreatedAt();
    }
}
