package com.easys.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResetPasswordRequestDto {

    // 비밀번호를 재설정할 이메일 (이메일 인증을 완료한 이메일)
    private String email;

    // 새 비밀번호
    private String newPassword;

    // 새 비밀번호 확인
    private String newPasswordConfirm;
}
