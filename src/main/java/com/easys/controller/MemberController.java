package com.easys.controller;

import com.easys.dto.MemberCreateDto;
import com.easys.dto.MemberResponseDto;
import com.easys.dto.MemberUpdateDto;
import com.easys.dto.PasswordUpdateDto;
import com.easys.entity.Member;
import com.easys.security.CustomUserDetails;
import com.easys.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
// 이 클래스가 REST API를 담당하는 Controller라는 뜻
@RestController
// final로 선언된 필드의 생성자를 자동으로 만들어준다.
@RequiredArgsConstructor
// 이 Controller의 기본 주소 여기서부터 시작하는 URL은 /member
@RequestMapping("/member")
public class MemberController {

    // 회원 관련 비즈니스 로직을 담당하는 Service
    private final MemberService memberService;

    @PostMapping
    public ResponseEntity<MemberResponseDto> createMember(
            // HTML에서 보낸 JSON을 MemberCreateDto 객체로 변환한다
            @RequestBody MemberCreateDto request
    ) {

        // 실제 회원가입 작업은 Service에게 맡긴다.
        MemberResponseDto response = memberService.createMember(request);

        // 회원가입 결과를 JSON으로 응답한다.
        return ResponseEntity.ok(response);
    }



    @GetMapping("/me") // 또는 @GetMapping("")
    public ResponseEntity<?> getMyInfo(@AuthenticationPrincipal CustomUserDetails userDetails) {
        // 비로그인 상태일 때 500 NPE 방지
        if (userDetails == null) {
            return ResponseEntity.ok(null); // 또는 ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Member member = userDetails.getMember();
        return ResponseEntity.ok(new MemberResponseDto(member));
    }


    @PutMapping("/me")
    public ResponseEntity<MemberResponseDto> updateMyInfo(

            // 현제 접속한 회워
            @AuthenticationPrincipal
            CustomUserDetails userDetails,

            // HTML에서 보낸 수정 정보
            @RequestBody
            MemberUpdateDto request
    ) {
        // Service에게 수정 요청
        MemberResponseDto response =
                memberService.updateMyInfo(
                        userDetails.getMember(),
                        request
                );


        return ResponseEntity.ok(response);
    }


    /*
     * =====================================================
     * 비밀번호 변경
     * PUT /member/me/password
     * =====================================================
     */
    @PutMapping("/me/password")
    public ResponseEntity<String> updatePassword(

            /*
             * 현재 로그인한 회원
             */
            @AuthenticationPrincipal
            CustomUserDetails userDetails,

            /*
             * 비밀번호 변경 정보
             */
            @RequestBody
            PasswordUpdateDto request
    ) {
        // Service에서 비밀번호 변경
        memberService.updatePassword(userDetails.getMember(), request);
        return ResponseEntity.ok("비밀번호가 변경되었습니다."
        );
    }


}
