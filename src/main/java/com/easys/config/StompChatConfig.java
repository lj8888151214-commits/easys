package com.easys.config;

import com.easys.security.CustomUserDetails;
import com.easys.service.MentoringChatService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// =====================================================
// 멘토링 1:1 채팅의 실시간 전달(broadcast) 전용 STOMP 설정.
//
// 기존 스트리밍/스터디 채팅이 쓰는 원시 WebSocketHandler(WebSocketConfig의 /signal)는
// 여러 기능(WebRTC 시그널링, 스터디 채팅 릴레이)이 이미 하나의 공유 상태(rooms 맵 등)에
// 얽혀 있어, 여기에 멘토링 채팅까지 얹으면 서로 영향을 줄 위험이 있다.
// 그래서 완전히 별도의 엔드포인트(/ws-chat)와 메시지 브로커를 사용해 /signal과
// 전혀 겹치지 않게 분리했다 - /signal 쪽 코드는 이번 작업에서 전혀 수정하지 않았다.
//
// 인증 방식은 /signal의 HttpSessionHandshakeInterceptor와 동일하게, HttpSession에
// 저장된 SPRING_SECURITY_CONTEXT를 직접 읽는 방식을 그대로 재사용한다.
//
// 실제 메시지 "전송"은 여전히 기존 REST API(POST .../chat/messages)가 담당한다
// (권한 검사 + DB 저장 로직을 한 곳(MentoringChatService)에만 두기 위해).
// 이 설정은 그 저장 결과를 같은 reservationId를 구독 중인 상대방에게
// "/topic/mentoring/{reservationId}"로 즉시 밀어주는 역할만 한다.
// =====================================================

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class StompChatConfig implements WebSocketMessageBrokerConfigurer {

    private final MentoringChatService mentoringChatService;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns("*")
                .setHandshakeHandler(new MemberHandshakeHandler())
                .addInterceptors(new HttpSessionEmailInterceptor());
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    // 다른 사람의 reservationId로는 애초에 "/topic/mentoring/{reservationId}"를
    // 구독조차 할 수 없도록, SUBSCRIBE 프레임 단계에서 REST와 동일한 권한 검사를 수행한다.
    // 검사에 실패하면 예외가 발생해 해당 SUBSCRIBE는 거부된다(프론트에는 버튼 노출과
    // 무관하게 서버가 최종적으로 막아준다).
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new SubscribeAuthInterceptor(mentoringChatService));
    }

    // =====================================================
    // 핸드셰이크 시점에 로그인 회원의 이메일을 attributes에 담는다.
    // (WebSocketConfig.HttpSessionHandshakeInterceptor와 같은 방식이지만,
    //  /signal 쪽 클래스를 그대로 재사용하면 서로 무관한 두 기능이 한 클래스에
    //  얽히게 되므로, 같은 방식을 별도 클래스로 다시 구현했다.)
    // =====================================================
    static class HttpSessionEmailInterceptor implements HandshakeInterceptor {

        @Override
        public boolean beforeHandshake(
                ServerHttpRequest request,
                ServerHttpResponse response,
                WebSocketHandler wsHandler,
                Map<String, Object> attributes
        ) {
            if (request instanceof ServletServerHttpRequest servletRequest) {
                HttpSession session = servletRequest.getServletRequest().getSession(false);
                if (session != null) {
                    SecurityContext context = (SecurityContext) session.getAttribute("SPRING_SECURITY_CONTEXT");
                    if (context != null && context.getAuthentication() != null
                            && context.getAuthentication().getPrincipal() instanceof CustomUserDetails userDetails) {
                        attributes.put("email", userDetails.getMember().getEmail());
                    }
                }
            }
            return true;
        }

        @Override
        public void afterHandshake(
                ServerHttpRequest request,
                ServerHttpResponse response,
                WebSocketHandler wsHandler,
                Exception exception
        ) {
        }
    }

    // 핸드셰이크 attributes에 담긴 이메일을 STOMP 세션의 Principal로 연결한다.
    // 로그인하지 않은 상태로 연결을 시도하면 Principal이 null이 되고, 이후
    // SubscribeAuthInterceptor가 SUBSCRIBE를 거부한다.
    static class MemberHandshakeHandler extends DefaultHandshakeHandler {

        @Override
        protected Principal determineUser(
                ServerHttpRequest request,
                WebSocketHandler wsHandler,
                Map<String, Object> attributes
        ) {
            Object email = attributes.get("email");
            if (email == null) {
                return null;
            }

            String emailValue = (String) email;
            return () -> emailValue;
        }
    }

    // =====================================================
    // "/topic/mentoring/{reservationId}" 구독 요청을 가로채, 해당 예약의
    // 멘토 또는 신청자 본인 + 결제 완료(PAID) 조건을 REST와 동일하게 검사한다.
    // =====================================================
    static class SubscribeAuthInterceptor implements ChannelInterceptor {

        private static final Pattern MENTORING_TOPIC = Pattern.compile("^/topic/mentoring/(\\d+)$");

        private final MentoringChatService mentoringChatService;

        SubscribeAuthInterceptor(MentoringChatService mentoringChatService) {
            this.mentoringChatService = mentoringChatService;
        }

        @Override
        public Message<?> preSend(Message<?> message, MessageChannel channel) {
            StompHeaderAccessor accessor =
                    StompHeaderAccessor.wrap(message);

            if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                String destination = accessor.getDestination();
                Matcher matcher = destination == null ? null : MENTORING_TOPIC.matcher(destination);

                if (matcher == null || !matcher.matches()) {
                    throw new IllegalArgumentException("허용되지 않은 구독 경로입니다.");
                }

                Principal user = accessor.getUser();
                if (user == null || user.getName() == null || user.getName().isBlank()) {
                    throw new IllegalArgumentException("로그인이 필요합니다.");
                }

                Long reservationId = Long.valueOf(matcher.group(1));

                // 예약이 없거나, 본인의 멘토/신청자 관계가 아니거나, 결제가 완료되지
                // 않았으면 예외가 발생해 이 SUBSCRIBE 프레임은 거부된다.
                mentoringChatService.assertParticipant(reservationId, user.getName());
            }

            return message;
        }
    }
}
