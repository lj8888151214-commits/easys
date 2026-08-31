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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationRepository emailVerificationRepository;

    // =====================================================
    // 비밀번호 정규식
    // 영어 + 숫자 + 특수문자 + 8자 이상
    // =====================================================

    private static final Pattern PASSWORD_PATTERN =
            Pattern.compile(
                    "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[~!@#$%^&*()_+`=\\-\\[\\]{}|;':\",./<>?]).{8,}$"
            );

    // =====================================================
    // 프로필 이미지 저장 위치
    // =====================================================

    private static final String PROFILE_IMAGE_DIR =
            "uploads/profile-images";


    // =====================================================
    // 회원가입
    // POST /member
    // =====================================================

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

        String birthday =
                request.getBirthday().trim();


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
                        .birthday(birthday)
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


    // =====================================================
    // 내 프로필 수정
    // PUT /member/me
    // =====================================================

    @Transactional
    public MemberResponseDto updateMyInfo(
            Member member,
            MemberUpdateDto request
    ) {

        if (request == null) {

            throw new IllegalArgumentException(
                    "프로필 정보가 없습니다."
            );
        }


        // =================================================
        // 닉네임
        // =================================================

        if (request.getNickname() == null ||
                request.getNickname().isBlank()) {

            throw new IllegalArgumentException(
                    "닉네임을 입력해주세요."
            );
        }


        String nickname =
                request.getNickname().trim();


        // =================================================
        // 닉네임 중복
        // =================================================

        if (!member.getNickname().equals(nickname)
                &&
                memberRepository.existsByNickname(nickname)) {

            throw new IllegalArgumentException(
                    "이미 사용 중인 닉네임입니다."
            );
        }


        // =================================================
        // 생년월일
        // =================================================

        if (request.getBirthday() == null ||
                request.getBirthday().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "생년월일을 입력해주세요."
            );
        }


        String birthday =
                request.getBirthday().trim();


        if (!birthday.matches("\\d{6}")) {

            throw new IllegalArgumentException(
                    "생년월일은 숫자 6자리로 입력해주세요."
            );
        }


        // =================================================
        // Entity 수정
        // =================================================

        member.updateProfile(
                nickname,
                birthday,
                request.getBio()
        );


        // =================================================
        // DB 저장
        // =================================================

        Member savedMember =
                memberRepository.save(member);


        return new MemberResponseDto(
                savedMember
        );
    }


    // =====================================================
    // 프로필 이미지 업로드
    // POST /member/me/profile-image
    // =====================================================

    @Transactional
    public MemberResponseDto updateProfileImage(
            Member member,
            MultipartFile file
    ) {

        // 파일 확인
        if (file == null || file.isEmpty()) {

            throw new IllegalArgumentException(
                    "프로필 이미지를 선택해주세요."
            );
        }


        // 이미지 파일 확인
        String contentType =
                file.getContentType();

        if (contentType == null ||
                !contentType.startsWith("image/")) {

            throw new IllegalArgumentException(
                    "이미지 파일만 업로드할 수 있습니다."
            );
        }


        // 5MB 제한
        if (file.getSize() > 5 * 1024 * 1024) {

            throw new IllegalArgumentException(
                    "프로필 이미지는 5MB 이하만 가능합니다."
            );
        }


        try {

            // =================================================
            // 업로드 폴더 생성
            // =================================================

            Path uploadPath =
                    Paths.get(PROFILE_IMAGE_DIR)
                            .toAbsolutePath()
                            .normalize();

            Files.createDirectories(uploadPath);


            // =================================================
            // 기존 이미지 삭제
            // =================================================

            String oldImageUrl =
                    member.getProfileImageUrl();

            if (oldImageUrl != null &&
                    !oldImageUrl.isBlank()) {

                try {

                    String oldFileName =
                            Paths.get(oldImageUrl)
                                    .getFileName()
                                    .toString();

                    Path oldFile =
                            uploadPath.resolve(oldFileName);

                    Files.deleteIfExists(oldFile);

                } catch (Exception ignored) {
                    // 기존 이미지 삭제 실패는
                    // 새 이미지 업로드를 막지 않는다.
                }
            }


            // =================================================
            // 확장자 추출
            // =================================================

            String originalFilename =
                    file.getOriginalFilename();

            String extension = "";

            if (originalFilename != null &&
                    originalFilename.contains(".")) {

                extension =
                        originalFilename
                                .substring(
                                        originalFilename.lastIndexOf(".")
                                )
                                .toLowerCase();
            }


            // =================================================
            // UUID 파일명 생성
            // =================================================

            String savedFilename =
                    UUID.randomUUID()
                            .toString()
                            .replace("-", "")
                            + extension;


            // =================================================
            // 실제 파일 저장
            // =================================================

            Path targetPath =
                    uploadPath.resolve(savedFilename);

            Files.copy(
                    file.getInputStream(),
                    targetPath,
                    StandardCopyOption.REPLACE_EXISTING
            );


            // =================================================
            // DB에 저장할 URL
            // =================================================

            String profileImageUrl =
                    "/profile-images/" + savedFilename;


            // =================================================
            // Member Entity 수정
            // =================================================

            member.updateProfileImage(
                    profileImageUrl
            );


            // =================================================
            // DB 저장
            // =================================================

            Member savedMember =
                    memberRepository.save(member);


            return new MemberResponseDto(
                    savedMember
            );

        } catch (IOException e) {

            throw new IllegalArgumentException(
                    "프로필 이미지 저장에 실패했습니다.",
                    e
            );
        }
    }


    // =====================================================
    // 비밀번호 변경
    // PUT /member/me/password
    // =====================================================

    @Transactional
    public void updatePassword(
            Member member,
            PasswordUpdateDto request
    ) {

        if (request == null) {

            throw new IllegalArgumentException(
                    "비밀번호 변경 정보가 없습니다."
            );
        }


        // 현재 비밀번호
        if (request.getCurrentPassword() == null ||
                request.getCurrentPassword().isBlank()) {

            throw new IllegalArgumentException(
                    "현재 비밀번호를 입력해주세요."
            );
        }


        // 현재 비밀번호 확인
        if (!passwordEncoder.matches(
                request.getCurrentPassword(),
                member.getPassword()
        )) {

            throw new IllegalArgumentException(
                    "현재 비밀번호가 올바르지 않습니다."
            );
        }


        // 새 비밀번호
        if (request.getNewPassword() == null ||
                request.getNewPassword().isBlank()) {

            throw new IllegalArgumentException(
                    "새 비밀번호를 입력해주세요."
            );
        }


        // 새 비밀번호 확인
        if (request.getNewPasswordConfirm() == null ||
                request.getNewPasswordConfirm().isBlank()) {

            throw new IllegalArgumentException(
                    "새 비밀번호 확인을 입력해주세요."
            );
        }


        // 새 비밀번호 일치
        if (!request.getNewPassword()
                .equals(
                        request.getNewPasswordConfirm()
                )) {

            throw new IllegalArgumentException(
                    "새 비밀번호가 일치하지 않습니다."
            );
        }


        // 비밀번호 형식
        if (!PASSWORD_PATTERN
                .matcher(request.getNewPassword())
                .matches()) {

            throw new IllegalArgumentException(
                    "비밀번호는 영어 + 숫자 + 특수문자를 포함하여 8자 이상이어야 합니다."
            );
        }


        // 기존 비밀번호와 동일한지 확인
        if (passwordEncoder.matches(
                request.getNewPassword(),
                member.getPassword()
        )) {

            throw new IllegalArgumentException(
                    "현재 비밀번호와 다른 비밀번호를 입력해주세요."
            );
        }


        // 새 비밀번호 암호화
        String encodedPassword =
                passwordEncoder.encode(
                        request.getNewPassword()
                );


        // Entity 수정
        member.updatePassword(
                encodedPassword
        );


        // DB 저장
        memberRepository.save(member);
    }
}