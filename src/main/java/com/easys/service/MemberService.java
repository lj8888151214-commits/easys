
        package com.easys.service;

import com.easys.dto.MemberCreateDto;
import com.easys.dto.MemberResponseDto;
import com.easys.dto.MemberUpdateDto;
import com.easys.dto.PasswordUpdateDto;
import com.easys.entity.EmailVerification;
import com.easys.entity.Member;
import com.easys.repository.EmailVerificationRepository;
import com.easys.repository.MemberRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationRepository emailVerificationRepository;

    // 표준 특수문자를 모두 지원하는 안전한 정규식으로 교체
    private static final Pattern PASSWORD_PATTERN =
            Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[~!@#$%^&*()_+`=\\-\\[\\]{}|;':\",./<>?]).{8,}$");

    /*
     * =====================================================
     * 회원가입
     * POST /member
     * =====================================================
     */
    @Transactional
    public MemberResponseDto createMember(
            MemberCreateDto request
    ) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "회원가입 정보가 없습니다."
            );
        }


        // 이메일
        if (request.getEmail() == null ||
                request.getEmail().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "이메일을 입력해주세요."
            );
        }

        String email =
                request.getEmail().trim();


        // 생년월일
        if (request.getBirthday() == null ||
                request.getBirthday().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "생년월일을 입력해주세요."
            );
        }


        // 닉네임
        if (request.getNickname() == null ||
                request.getNickname().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "닉네임을 입력해주세요."
            );
        }

        String nickname =
                request.getNickname().trim();


        // =================================================
        // 이메일 인증 확인
        // =================================================

        EmailVerification verification =
                emailVerificationRepository
                        .findTopByEmailOrderByCreatedAtDesc(email)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "이메일 인증을 먼저 완료해주세요."
                                )
                        );

        if (!verification.isVerified()) {

            throw new IllegalArgumentException(
                    "이메일 인증을 먼저 완료해주세요."
            );
        }


        // =================================================
        // 비밀번호 확인
        // =================================================

        if (request.getPassword() == null ||
                request.getPassword().isBlank()) {

            throw new IllegalArgumentException(
                    "비밀번호를 입력해주세요."
            );
        }

        if (request.getPasswordConfirm() == null ||
                request.getPasswordConfirm().isBlank()) {

            throw new IllegalArgumentException(
                    "비밀번호 확인을 입력해주세요."
            );
        }


        if (!request.getPassword()
                .equals(request.getPasswordConfirm())) {

            throw new IllegalArgumentException(
                    "비밀번호가 일치하지 않습니다."
            );
        }


        // =================================================
        // 비밀번호 형식 확인
        // =================================================

        if (!PASSWORD_PATTERN
                .matcher(request.getPassword())
                .matches()) {

            throw new IllegalArgumentException(
                    "비밀번호는 영어 + 숫자 + 특수문자를 포함하여 8자 이상이어야 합니다."
            );
        }


        // =================================================
        // 이메일 중복 확인
        // =================================================

        if (memberRepository.existsByEmail(email)) {

            throw new IllegalArgumentException(
                    "이미 존재하는 이메일입니다."
            );
        }


        // =================================================
        // 닉네임 중복 확인
        // =================================================

        if (memberRepository.existsByNickname(nickname)) {

            throw new IllegalArgumentException(
                    "이미 존재하는 닉네임입니다."
            );
        }


        // =================================================
        // 회원 생성
        // =================================================

        Member member =
                Member.builder()
                        .birthday(
                                request.getBirthday().trim()
                        )
                        .email(email)
                        .password(
                                passwordEncoder.encode(
                                        request.getPassword()
                                )
                        )
                        .nickname(nickname)
                        .build();


        // =================================================
        // DB 저장
        // =================================================

        Member savedMember =
                memberRepository.save(member);


        return new MemberResponseDto(
                savedMember
        );
    }


    /*
     * =====================================================
     * 회원정보 수정
     * =====================================================
     */
    @Transactional
    public MemberResponseDto updateMyInfo(
            Member member,
            MemberUpdateDto request
    ) {

        if (request.getNickname() == null ||
                request.getNickname().isBlank()) {

            throw new IllegalArgumentException(
                    "닉네임을 입력해주세요."
            );
        }

        String nickname =
                request.getNickname().trim();


        if (!member.getNickname().equals(nickname)
                && memberRepository
                .existsByNickname(nickname)) {

            throw new IllegalArgumentException(
                    "이미 사용 중인 닉네임입니다."
            );
        }


        member.updateProfile(
                nickname,
                request.getBirthday(),
                request.getBio()
        );


        return new MemberResponseDto(
                memberRepository.save(member)
        );
    }


    /*
     * =====================================================
     * 비밀번호 변경
     * =====================================================
     */
    @Transactional
    public void updatePassword(
            Member member,
            PasswordUpdateDto request
    ) {

        if (!passwordEncoder.matches(
                request.getCurrentPassword(),
                member.getPassword()
        )) {

            throw new IllegalArgumentException(
                    "현재 비밀번호가 올바르지 않습니다."
            );
        }


        if (!request.getNewPassword()
                .equals(request.getNewPasswordConfirm())) {

            throw new IllegalArgumentException(
                    "새 비밀번호가 일치하지 않습니다."
            );
        }


        String password =
                request.getNewPassword();


        if (!PASSWORD_PATTERN
                .matcher(password)
                .matches()) {

            throw new IllegalArgumentException(
                    "비밀번호는 영어, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다."
            );
        }


        String encodedPassword =
                passwordEncoder.encode(password);


        member.updatePassword(
                encodedPassword
        );


        memberRepository.save(member);
    }
}

