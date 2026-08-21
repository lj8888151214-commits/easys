package com.easys.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PasswordUpdateDto {
    // 현재 사용 중인 비밀번호
    private String currentPassword;
    // 새 비밀번호
    private String newPassword;
    // 새 비밀번호 확인
    private String newPasswordConfirm;
}
