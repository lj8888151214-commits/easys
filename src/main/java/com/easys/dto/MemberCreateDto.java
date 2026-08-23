package com.easys.dto;


import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MemberCreateDto {

private String birthday;
private String email;
private String password;
private String passwordConfirm;
private String nickname;
}
