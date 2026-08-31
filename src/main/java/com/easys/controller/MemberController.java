package com.easys.controller;

import com.easys.dto.MemberCreateDto;
import com.easys.dto.MemberResponseDto;
import com.easys.dto.MemberUpdateDto;
import com.easys.dto.PasswordUpdateDto;
import com.easys.entity.Member;
import com.easys.repository.MemberRepository;
import com.easys.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/member")
@RequiredArgsConstructor
public class MemberController {

    private final MemberRepository memberRepository;
    private final MemberService memberService;


    // =====================================================
    // 회원가입
    // POST /member
    // =====================================================

    @PostMapping
    public ResponseEntity<MemberResponseDto> createMember(
            @RequestBody MemberCreateDto request
    ) {

        MemberResponseDto response =
                memberService.createMember(request);

        return ResponseEntity.ok(response);
    }


    // =====================================================
    // 현재 로그인한 회원 가져오기
    // =====================================================

    private Member getCurrentMember(
            Authentication authentication
    ) {

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new IllegalArgumentException(
                    "로그인이 필요합니다."
            );
        }


        String email =
                authentication.getName();


        return memberRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "회원 정보를 찾을 수 없습니다."
                        )
                );
    }


    // =====================================================
    // 내 프로필 조회
    // GET /member/me
    // =====================================================

    @GetMapping("/me")
    public ResponseEntity<MemberResponseDto> getMyInfo(
            Authentication authentication
    ) {

        Member member =
                getCurrentMember(authentication);


        return ResponseEntity.ok(
                new MemberResponseDto(member)
        );
    }


    // =====================================================
    // 내 프로필 수정
    // PUT /member/me
    // =====================================================

    @PutMapping("/me")
    public ResponseEntity<MemberResponseDto> updateMyInfo(
            Authentication authentication,
            @RequestBody MemberUpdateDto request
    ) {

        Member member =
                getCurrentMember(authentication);


        MemberResponseDto response =
                memberService.updateMyInfo(
                        member,
                        request
                );


        return ResponseEntity.ok(response);
    }


    // =====================================================
    // 프로필 이미지 업로드
    // POST /member/me/profile-image
    // =====================================================

    @PostMapping("/me/profile-image")
    public ResponseEntity<?> uploadProfileImage(
            Authentication authentication,
            @RequestParam("file") MultipartFile file
    ) {

        try {

            Member member =
                    getCurrentMember(authentication);


            MemberResponseDto response =
                    memberService.updateProfileImage(
                            member,
                            file
                    );


            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "message",
                            e.getMessage()
                    )
            );
        }
    }


    // =====================================================
    // 비밀번호 변경
    // PUT /member/me/password
    // =====================================================

    @PutMapping("/me/password")
    public ResponseEntity<?> updatePassword(
            Authentication authentication,
            @RequestBody PasswordUpdateDto request
    ) {

        try {

            Member member =
                    getCurrentMember(authentication);


            memberService.updatePassword(
                    member,
                    request
            );


            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "비밀번호가 변경되었습니다."
                    )
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "message",
                            e.getMessage()
                    )
            );
        }
    }
}