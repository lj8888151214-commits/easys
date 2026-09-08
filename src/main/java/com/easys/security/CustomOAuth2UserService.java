package com.easys.security;

import com.easys.entity.Member;
import com.easys.entity.MemberProvider;
import com.easys.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.UUID;

// =====================================================
// 구글 로그인 시 사용자 정보를 가져온 뒤,
// 처음 로그인하는 이메일이면 Member를 새로 생성해 연결한다.
// (실제 인증 주체를 CustomUserDetails로 바꿔치기하는 작업은
//  OAuth2LoginSuccessHandler에서 이어서 처리한다.)
// =====================================================

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    // 소셜 가입은 생년월일을 받지 않으므로 임시값을 넣어두고,
    // 이후 프로필 수정 화면에서 채우도록 한다.
    private static final String PLACEHOLDER_BIRTHDAY = "000000";

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {

        OAuth2User oAuth2User = super.loadUser(userRequest);

        String email = oAuth2User.getAttribute("email");
        Boolean emailVerified = oAuth2User.getAttribute("email_verified");

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException("구글 계정에서 이메일 정보를 가져올 수 없습니다.");
        }

        if (Boolean.FALSE.equals(emailVerified)) {
            throw new OAuth2AuthenticationException("이메일 인증이 완료된 구글 계정만 사용할 수 있습니다.");
        }

        memberRepository.findByEmail(email)
                .orElseGet(() -> memberRepository.save(createMember(email)));

        return oAuth2User;
    }

    private Member createMember(String email) {

        return Member.builder()
                .birthday(PLACEHOLDER_BIRTHDAY)
                .email(email)
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .nickname(generateUniqueNickname(email))
                .provider(MemberProvider.GOOGLE)
                .build();
    }

    // 닉네임은 유니크해야 하므로, 이메일 앞부분을 기반으로 충돌 시 숫자를 붙여 만든다.
    private String generateUniqueNickname(String email) {

        String base = email.substring(0, email.indexOf('@'));

        if (base.length() > 10) {
            base = base.substring(0, 10);
        }

        if (!memberRepository.existsByNickname(base)) {
            return base;
        }

        int suffix = 1;

        while (true) {

            String suffixText = String.valueOf(suffix);
            int cut = Math.max(0, Math.min(base.length(), 10 - suffixText.length()));
            String candidate = base.substring(0, cut) + suffixText;

            if (!memberRepository.existsByNickname(candidate)) {
                return candidate;
            }

            suffix++;
        }
    }
}
