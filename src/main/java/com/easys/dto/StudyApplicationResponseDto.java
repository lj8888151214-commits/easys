package com.easys.dto;

import com.easys.entity.StudyApplication;
import com.easys.entity.StudyApplicationStatus;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class StudyApplicationResponseDto {

    // 신청 번호
    private Long id;

    // 스터디 번호
    private Long studyId;

    // 신청한 회원 번호
    private Long memberId;

    // 신청한 회원 닉네임
    private String nickname;

    // 신청한 회원 프로필 이미지 (없으면 null - 프론트에서 기본 이미지 처리)
    private String profileImageUrl;

    // 신청한 회원 이메일
    private String email;

    // 신청 상태
    private StudyApplicationStatus status;

    // 신청 날짜
    private LocalDateTime createdAt;


    // =====================================================
    // 생성자
    // =====================================================

    public StudyApplicationResponseDto(
            StudyApplication application
    ) {

        this.id = application.getId();

        this.studyId =
                application
                        .getStudy()
                        .getId();

        this.memberId =
                application
                        .getMember()
                        .getId();

        this.nickname =
                application
                        .getMember()
                        .getNickname();

        this.profileImageUrl =
                application
                        .getMember()
                        .getProfileImageUrl();

        this.email =
                application
                        .getMember()
                        .getEmail();

        this.status =
                application.getStatus();

        this.createdAt =
                application.getCreatedAt();
    }
}