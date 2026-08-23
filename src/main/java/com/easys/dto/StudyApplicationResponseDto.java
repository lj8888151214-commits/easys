package com.easys.dto;

import com.easys.entity.StudyApplication;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class StudyApplicationResponseDto {
    private Long id;
    private Long studyId;
    private String studyTitle;
    private Long memberId;
    private String nickname;
    private String email;
    private String status;
    private LocalDateTime createdAt;


public StudyApplicationResponseDto(StudyApplication application){
    this.id = application.getId();

    this.studyId = application
            .getStudy()
            .getId();

    this.studyTitle = application
                    .getStudy()
                    .getTitle();


    this.memberId = application
                    .getMember()
                    .getId();


    this.nickname = application
                    .getMember()
                    .getNickname();


    this.email = application
                    .getMember()
                    .getEmail();


    this.status = application
            .getStatus()
            .name();


    this.createdAt = application.getCreatedAt();




}
}
