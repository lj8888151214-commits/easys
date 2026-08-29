package com.easys.config;

import com.easys.entity.Member;
import com.easys.entity.MemberRole;
import com.easys.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/*
 * 관리자 계정이 하나도 없을 때, 설정된 이메일(app.admin.bootstrap-email)로
 * 가입된 회원이 있으면 관리자로 승격시킨다.
 *
 * 이미 관리자가 한 명이라도 있으면 아무 것도 하지 않는다.
 * application.properties의 app.admin.bootstrap-email 값을
 * 본인 로그인 이메일로 바꾸면 다음 재시작 때 그 계정이 관리자가 된다.
 */
@Component
@RequiredArgsConstructor
public class AdminAccountInitializer implements CommandLineRunner {

    private final MemberRepository memberRepository;

    @Value("${app.admin.bootstrap-email:}")
    private String bootstrapEmail;

    @Override
    @Transactional
    public void run(String... args) {

        if (bootstrapEmail == null || bootstrapEmail.isBlank()) {
            return;
        }

        if (memberRepository.existsByRole(MemberRole.ADMIN)) {
            return;
        }

        memberRepository.findByEmail(bootstrapEmail)
                .ifPresent(Member::promoteToAdmin);
    }
}
