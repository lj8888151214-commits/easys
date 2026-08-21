package com.easys.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MemberUpdateDto {
    // 변경할 닉네임
    private String nickname;
    // 변경할 생년월일
    private String birthday;
    // 변경할 자기소개
    private String bio;
}
