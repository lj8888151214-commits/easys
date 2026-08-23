package com.easys.dto;

import lombok.Getter;
import com.easys.entity.Member;
import java.time.LocalDateTime;

@Getter
public class MemberResponseDto {
    private Long id;
    private String birthday;
    private String email;
    private String nickname;
    private String bio; // 추가
    private LocalDateTime createdAt;

    public MemberResponseDto(Member member) {
        this.id = member.getId();
        this.birthday = member.getBirthday();
        this.email = member.getEmail();
        this.nickname = member.getNickname();
        this.bio = member.getBio(); // 추가
        this.createdAt = member.getCreatedAt();
    }
}