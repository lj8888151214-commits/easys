package com.easys.entity;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

// 멤버 테이블 생성
@Entity
@Getter
@Setter
@ToString
@Table (name = "member")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member {
    // 멤머ID (PK) 자동 생성
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 생년월일 6글자
    @Column(nullable = false, length = 6)
    private String birthday;

    // 이메일 테이블 생성
    // nullable = false -> (NOTNULL) unique = true -> (중복차단) length = 100 -> (100글자 제한)
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    // 비밀번호 테이블 생성
    @Column(nullable = false)
    private String password;

    // 닉네임 생성
    @Column(nullable = false, unique = true, length = 10)
    private String nickname;

    // 생성 날짜
    @Column(nullable = false, unique = false)
    private LocalDateTime createdAt;

    // 자기소개
    private String bio;

    // 빌더를 통해서 생성
    @Builder
    public Member (String birthday, String email, String password, String nickname, String bio){
        this.birthday = birthday;
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.createdAt = LocalDateTime.now();
        this.bio = bio;
    }

    // 프로필 수정
    public void updateProfile(String nickname, String birthday, String bio) {
        this.nickname = nickname;
        this.birthday = birthday;
        this.bio = bio;
    }
    // 비밀번호 변경
    public void updatePassword(String password) {
        this.password = password;
    }
}
