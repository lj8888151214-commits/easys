package com.easys.dto;

import com.easys.entity.Member;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class MemberResponseDto {

    private Long id;
    private String birthday;
    private String email;
    private String nickname;
    private String bio;
    private LocalDateTime createdAt;
    private String profileImageUrl;

    public MemberResponseDto(Member member) {
        this.id = member.getId();
        this.birthday = member.getBirthday();
        this.email = member.getEmail();
        this.nickname = member.getNickname();
        this.bio = member.getBio();
        this.createdAt = member.getCreatedAt();
        this.profileImageUrl = member.getProfileImageUrl();
    }
}