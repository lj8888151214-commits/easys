package com.easys.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@ToString
@Table(name = "member")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 생년월일
    @Column(nullable = false, length = 6)
    private String birthday;

    // 이메일
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    // 비밀번호
    @Column(nullable = false)
    private String password;

    // 닉네임
    @Column(nullable = false, unique = true, length = 10)
    private String nickname;

    // 가입일
    @Column(nullable = false)
    private LocalDateTime createdAt;

    // 자기소개
    @Column(length = 500)
    private String bio;

    // 프로필 이미지 경로
    @Column
    private String profileImageUrl;

    // 권한 (일반 회원 / 관리자)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "varchar(20) default 'USER'")
    private MemberRole role;

    // 가입 경로 (일반 가입 / 구글 소셜 로그인)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "varchar(20) default 'LOCAL'")
    private MemberProvider provider;

    // 관리자 전용 카카오톡 알림("나에게 보내기") 연동 토큰.
    // 일반 회원가입/로그인과는 무관하며, 관리자가 예약 알림을 카카오톡으로도
    // 받기 위해 별도로 카카오 계정을 연결했을 때만 값이 채워진다.
    @Column(length = 500)
    private String kakaoAccessToken;

    @Column(length = 500)
    private String kakaoRefreshToken;

    @Column
    private LocalDateTime kakaoTokenExpiresAt;

    @Builder
    public Member(
            String birthday,
            String email,
            String password,
            String nickname,
            String bio,
            MemberProvider provider
    ) {
        this.birthday = birthday;
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.createdAt = LocalDateTime.now();
        this.bio = bio;
        this.profileImageUrl = null;
        this.role = MemberRole.USER;
        this.provider = (provider != null) ? provider : MemberProvider.LOCAL;
    }

    // 관리자로 승격
    public void promoteToAdmin() {
        this.role = MemberRole.ADMIN;
    }

    // 프로필 수정
    public void updateProfile(
            String nickname,
            String birthday,
            String bio
    ) {
        this.nickname = nickname;
        this.birthday = birthday;
        this.bio = bio;
    }

    // 프로필 이미지 변경
    public void updateProfileImage(
            String profileImageUrl
    ) {
        this.profileImageUrl = profileImageUrl;
    }

    // 비밀번호 변경
    public void updatePassword(
            String password
    ) {
        this.password = password;
    }

    // 카카오톡 알림 연동 (관리자가 "나에게 보내기" 권한을 허용했을 때)
    public void linkKakaoNotification(
            String accessToken,
            String refreshToken,
            LocalDateTime expiresAt
    ) {
        this.kakaoAccessToken = accessToken;
        this.kakaoRefreshToken = refreshToken;
        this.kakaoTokenExpiresAt = expiresAt;
    }

    // 카카오톡 알림 연동 해제
    public void unlinkKakaoNotification() {
        this.kakaoAccessToken = null;
        this.kakaoRefreshToken = null;
        this.kakaoTokenExpiresAt = null;
    }

    public boolean isKakaoNotificationLinked() {
        return kakaoAccessToken != null;
    }
}