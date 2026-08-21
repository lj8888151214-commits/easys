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


    // 영어 + 숫자 + 특수문자 + 8자 이상
    private static final Pattern PASSWORD_PATTERN =
            Pattern.compile(
                    "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{8,}$"
            );


    @Transactional
    public MemberResponseDto createMember(
            MemberCreateDto request
    ) {

        String email = request.getEmail().trim();


        // ==========================================
        // 1. 이메일 인증 여부 확인
        // ==========================================

        EmailVerification verification =
                emailVerificationRepository
                        .findTopByEmailOrderByCreatedAtDesc(email)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "이메일 인증을 먼저 해주세요."
                                )
                        );


        // 가장 최근 인증 기록이 인증 완료인지 확인
        if (!verification.isVerified()) {

            throw new IllegalArgumentException(
                    "이메일 인증을 먼저 완료해주세요."
            );
        }


        // ==========================================
        // 2. 비밀번호 존재 여부
        // ==========================================

 
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("비밀번호를 입력해주세요.");
        }


        // ==========================================
        // 3. 비밀번호 형식 확인
        // 영어 + 숫자 + 특수문자 + 8자 이상
        // ==========================================

        if (!PASSWORD_PATTERN.matcher(request
                .getPassword())
                .matches()) {
            throw new IllegalArgumentException("비밀번호는 영어 + 숫자 + 특수문자를 포함하여 8자 이상이어야 합니다.");
        }
        // ==========================================
        // 4. 비밀번호 확인
        // ==========================================
        if (!request.getPassword().equals(request.getPasswordConfirm())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }
        // ==========================================
        // 5. 이메일 중복 확인
        // ==========================================
        if (memberRepository.existsByEmail(email)) {throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        }
        // ==========================================
        // 6. 닉네임 중복 확인
        // ==========================================
        String nickname = request.getNickname().trim();
        if (memberRepository.existsByNickname(nickname)) {
            throw new IllegalArgumentException("이미 존재하는 닉네임입니다.");
        }


        // ==========================================
        // 7. 회원 생성
        // ==========================================

        Member member =
                Member.builder()
                        .birthday(
                                request.getBirthday()
                        )
                        .email(email)
                        .password(
                                passwordEncoder.encode(
                                        request.getPassword()
                                )
                        )
                        .nickname(nickname)
                        .build();


        // ==========================================
        // 8. DB 저장
        // ==========================================

        Member savedMember = memberRepository.save(member);
        return new MemberResponseDto(savedMember);
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

        // 닉네임 검사
        if (request.getNickname() == null
                || request.getNickname().isBlank()) {

            throw new IllegalArgumentException(
                    "닉네임을 입력해주세요."
            );
        }


        // 공백 제거
        String nickname =
                request.getNickname().trim();


        /*
         * 다른 회원이 같은 닉네임을 사용하는지 검사
         *
         * 단,
         * 현재 자기 자신의 닉네임은 허용해야 한다.
         */
        if (!member.getNickname()
                .equals(nickname)
                && memberRepository
                .existsByNickname(nickname)) {

            throw new IllegalArgumentException(
                    "이미 사용 중인 닉네임입니다."
            );
        }


        /*
         * Entity의 회원정보 수정
         */
        member.updateProfile(
                nickname,
                request.getBirthday(),
                request.getBio()
        );


        /*
         * @Transactional이 있기 때문에
         * 변경된 Entity가 DB에 반영된다.
         *
         * 명시적으로 save()를 해도 된다.
         */
        Member savedMember =
                memberRepository.save(member);


        // 수정된 회원정보 반환
        return new MemberResponseDto(
                savedMember
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

        /*
         * 현재 비밀번호가 맞는지 확인
         *
         * DB에는 암호화된 비밀번호가 있기 때문에
         *
         * equals()가 아니라
         *
         * passwordEncoder.matches()
         *
         * 를 사용해야 한다.
         */
        if (!passwordEncoder.matches(
                request.getCurrentPassword(),
                member.getPassword()
        )) {

            throw new IllegalArgumentException(
                    "현재 비밀번호가 올바르지 않습니다."
            );
        }


        /*
         * 새 비밀번호와 확인 비밀번호가
         * 동일한지 확인
         */
        if (!request.getNewPassword()
                .equals(
                        request.getNewPasswordConfirm()
                )) {

            throw new IllegalArgumentException(
                    "새 비밀번호가 일치하지 않습니다."
            );
        }


        /*
         * 비밀번호 조건 검사
         *
         * 영어 대문자/소문자
         * 숫자
         * 특수문자
         * 포함 + 8자리 이상
         */
        String password = request.getNewPassword();


        if (!password.matches(
                "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-={}\\[\\]:;\"'<>,.?/]).{8,}$"
        )) {

            throw new IllegalArgumentException(
                    "비밀번호는 영어, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다."
            );
        }


        /*
         * 새 비밀번호를 암호화
         * 절대로 평문 그대로 DB에 저장하면 안 된다.
         */
        String encodedPassword = passwordEncoder.encode(password);


        /*
         * Entity의 비밀번호 변경
         */
        member.updatePassword(encodedPassword
        );


        // DB 저장
        memberRepository.save(member);
    }
}