package com.easys.service;

import com.easys.entity.Member;
import com.easys.entity.MemberRole;
import com.easys.entity.Reservation;
import com.easys.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

// =====================================================
// 관리자 전용 카카오톡 "나에게 보내기" 알림.
//
// 일반 회원 로그인/가입과는 완전히 별개의 기능이다. 관리자가 관리자
// 페이지에서 자신의 카카오 계정을 한 번 연결해두면, 이후 예약 결제
// 알림 등을 이메일과 함께 카카오톡으로도 받을 수 있다.
//
// 특정 회원에게 보내는 것이 아니라 "연결한 그 관리자 본인"에게만
// 전송되는 API(카카오톡 나에게 보내기)라서, 여러 명의 실제 회원에게
// 알림톡을 보내려면 별도의 비즈니스 인증(카카오 채널 + 알림톡 템플릿
// 승인)이 필요하다 — 이 서비스는 그 범위를 다루지 않는다.
// =====================================================

@Slf4j
@Service
@RequiredArgsConstructor
public class KakaoNotificationService {

    private static final String TOKEN_URL = "https://kauth.kakao.com/oauth/token";
    private static final String MEMO_SEND_URL = "https://kapi.kakao.com/v2/api/talk/memo/default/send";

    private final MemberRepository memberRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${kakao.rest-api-key}")
    private String kakaoRestApiKey;

    // 앱의 "카카오 로그인 > 보안"에서 Client Secret을 켠 경우에만 필요.
    // 꺼져 있으면 비워두면 된다.
    @Value("${kakao.client-secret:}")
    private String kakaoClientSecret;

    @Value("${kakao.redirect-uri}")
    private String kakaoRedirectUri;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    // =====================================================
    // 카카오 로그인 인가 코드를 토큰으로 교환해 관리자 계정에 연결한다.
    // =====================================================

    @Transactional
    public void linkAdminAccount(Member admin, String code) {

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", kakaoRestApiKey);
        params.add("redirect_uri", kakaoRedirectUri);
        params.add("code", code);
        addClientSecretIfConfigured(params);

        Map<String, Object> body = requestToken(params);

        String accessToken = (String) body.get("access_token");
        String refreshToken = (String) body.get("refresh_token");
        int expiresIn = ((Number) body.get("expires_in")).intValue();

        admin.linkKakaoNotification(
                accessToken,
                refreshToken,
                LocalDateTime.now().plusSeconds(expiresIn)
        );

        memberRepository.save(admin);
    }

    @Transactional
    public void unlinkAdminAccount(Member admin) {
        admin.unlinkKakaoNotification();
        memberRepository.save(admin);
    }

    // =====================================================
    // 스터디룸 예약 결제 완료 알림을, 카카오톡 알림을 연결해둔
    // 모든 관리자에게 보낸다. (이메일 알림과 함께 호출되는 보조 채널이라
    // 여기서 발생하는 실패가 결제 확정 자체를 막으면 안 된다.)
    // =====================================================

    public void notifyAdminsOfPaidReservation(Reservation reservation) {

        List<Member> admins = memberRepository.findByRole(MemberRole.ADMIN);

        String text = reservation.getMember().getNickname()
                + "님이 \"" + reservation.getStudyRoom().getName() + "\" 예약 결제를 완료했어요.\n"
                + reservation.getReservationDate() + " "
                + reservation.getStartTime() + "~" + reservation.getEndTime()
                + " · " + reservation.getPeopleCount() + "명\n\n"
                + "관리자 페이지에서 승인해주세요.";

        for (Member admin : admins) {

            if (!admin.isKakaoNotificationLinked()) {
                continue;
            }

            try {
                sendMemo(admin, text);
            } catch (Exception e) {
                log.warn("카카오톡 예약 알림 발송 실패 (adminId={}, reservationId={})",
                        admin.getId(), reservation.getId(), e);
            }
        }
    }

    // =====================================================
    // 카카오톡 "나에게 보내기" (기본 텍스트 템플릿) 전송
    // =====================================================

    private void sendMemo(Member admin, String text) {

        String accessToken = ensureValidAccessToken(admin);
        String adminPageUrl = frontendBaseUrl + "/admin";

        ObjectMapper objectMapper = new ObjectMapper();

        String templateObjectJson = objectMapper.writeValueAsString(
                Map.of(
                        "object_type", "text",
                        "text", text,
                        "link", Map.of(
                                "web_url", adminPageUrl,
                                "mobile_web_url", adminPageUrl
                        ),
                        "button_title", "관리자 페이지 확인"
                )
        );

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("template_object", templateObjectJson);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setBearerAuth(accessToken);

        restTemplate.postForEntity(MEMO_SEND_URL, new HttpEntity<>(params, headers), String.class);
    }

    // 액세스 토큰이 곧 만료되면 리프레시 토큰으로 갱신하고, 아니면 그대로 쓴다.
    private String ensureValidAccessToken(Member admin) {

        LocalDateTime expiresAt = admin.getKakaoTokenExpiresAt();

        if (expiresAt != null && expiresAt.isAfter(LocalDateTime.now().plusMinutes(1))) {
            return admin.getKakaoAccessToken();
        }

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "refresh_token");
        params.add("client_id", kakaoRestApiKey);
        params.add("refresh_token", admin.getKakaoRefreshToken());
        addClientSecretIfConfigured(params);

        Map<String, Object> body = requestToken(params);

        String newAccessToken = (String) body.get("access_token");
        int expiresIn = ((Number) body.get("expires_in")).intValue();
        // 카카오는 리프레시 토큰이 갱신되지 않으면 응답에 포함하지 않는다.
        String newRefreshToken = body.containsKey("refresh_token")
                ? (String) body.get("refresh_token")
                : admin.getKakaoRefreshToken();

        admin.linkKakaoNotification(newAccessToken, newRefreshToken, LocalDateTime.now().plusSeconds(expiresIn));
        memberRepository.save(admin);

        return newAccessToken;
    }

    private void addClientSecretIfConfigured(MultiValueMap<String, String> params) {
        if (kakaoClientSecret != null && !kakaoClientSecret.isBlank()) {
            params.add("client_secret", kakaoClientSecret);
        }
    }

    private Map<String, Object> requestToken(MultiValueMap<String, String> params) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        String responseBody;

        try {
            responseBody = restTemplate.postForEntity(
                    TOKEN_URL,
                    new HttpEntity<>(params, headers),
                    String.class
            ).getBody();
        } catch (HttpClientErrorException e) {
            log.error(
                    "카카오 토큰 교환 실패. status={}, headers={}, body={}, sentParams={}",
                    e.getStatusCode(),
                    e.getResponseHeaders(),
                    e.getResponseBodyAsString(),
                    params
            );
            throw e;
        }

        return new ObjectMapper().readValue(responseBody, new TypeReference<Map<String, Object>>() {});
    }

    // 관리자가 "카카오톡 알림 연결하기"를 누르면 이동할 카카오 인가 URL
    public String buildAuthorizeUrl() {
        return "https://kauth.kakao.com/oauth/authorize"
                + "?client_id=" + kakaoRestApiKey
                + "&redirect_uri=" + URLEncoder.encode(kakaoRedirectUri, StandardCharsets.UTF_8)
                + "&response_type=code"
                + "&scope=talk_message";
    }
}
