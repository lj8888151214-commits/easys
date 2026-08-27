package com.easys.dto;

import com.easys.entity.MentorProfile;
import lombok.Getter;

@Getter
public class MentorProfileResponseDto {

    private Long id;
    private Long memberId;
    private String nickname;
    private String profileImageUrl;

    private String title;
    private String introduction;
    private String career;
    private String careerDetail;
    private String certificates;
    private String skills;
    private Integer price;
    private String mentoringType;
    private String consultationFields;
    private String github;
    private String velog;
    private String portfolio;

    // 기존 상담 가능 요일
    private String availableDays;

    // 실제 상담 가능 날짜
    private String availableDates;

    private String availableStart;
    private String availableEnd;

    private String status;

    public MentorProfileResponseDto(MentorProfile mentorProfile) {

        this.id = mentorProfile.getId();

        this.memberId =
                mentorProfile.getMember().getId();

        this.nickname =
                mentorProfile.getMember().getNickname();

        this.profileImageUrl =
                mentorProfile.getMember().getProfileImageUrl();

        this.title =
                mentorProfile.getTitle();

        this.introduction =
                mentorProfile.getIntroduction();

        this.career =
                mentorProfile.getCareer();

        this.careerDetail =
                mentorProfile.getCareerDetail();

        this.certificates =
                mentorProfile.getCertificates();

        this.skills =
                mentorProfile.getSkills();

        this.price =
                mentorProfile.getPrice();

        this.mentoringType =
                mentorProfile.getMentoringType();

        this.consultationFields =
                mentorProfile.getConsultationFields();

        this.github =
                mentorProfile.getGithub();

        this.velog =
                mentorProfile.getVelog();

        this.portfolio =
                mentorProfile.getPortfolio();

        this.availableDays =
                mentorProfile.getAvailableDays();

        this.availableDates =
                mentorProfile.getAvailableDates();

        this.availableStart =
                mentorProfile.getAvailableStart();

        this.availableEnd =
                mentorProfile.getAvailableEnd();

        this.status =
                mentorProfile.getStatus().name();
    }
}

