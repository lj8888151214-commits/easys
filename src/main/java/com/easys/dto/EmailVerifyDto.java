package com.easys.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmailVerifyDto {

    private String email;
    private String verificationCode;
}