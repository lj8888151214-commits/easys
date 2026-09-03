package com.easys.service;

import com.easys.dto.MentoringChatMessageResponseDto;
import com.easys.entity.Member;
import com.easys.entity.MentoringChatMessage;
import com.easys.entity.MentoringReservation;
import com.easys.entity.PaymentProductType;
import com.easys.entity.PaymentStatus;
import com.easys.repository.MemberRepository;
import com.easys.repository.MentoringChatMessageRepository;
import com.easys.repository.MentoringReservationRepository;
import com.easys.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// =====================================================
// 멘토링 예약 1건당 멘토-신청자 사이의 1:1 채팅 저장/조회를 담당한다.
//
// StudyChatService와 동일한 구조(메시지 저장 + 참여자만 조회 가능 + 알림 발송)를
// 따르되, "참여자" 조건이 스터디 멤버 전체가 아니라 해당 예약의 멘토/신청자
// 두 명뿐이고, 결제가 완료된(PAID) 예약이어야만 채팅을 이용할 수 있다는 점이 다르다.
//
// 별도의 ChatRoom 생성 절차가 없다 - MentoringReservation 자체가 방이므로
// "이미 존재하는 방을 중복 생성"할 여지 자체가 없다.
// =====================================================

@Service
@RequiredArgsConstructor
public class MentoringChatService {

    private final MentoringChatMessageRepository chatMessageRepository;
    private final MentoringReservationRepository mentoringReservationRepository;
    private final PaymentRepository paymentRepository;
    private final MemberRepository memberRepository;
    private final NotificationService notificationService;

    // 채팅 기록 조회 (해당 예약의 멘토/신청자 + 결제 완료 시에만)
    @Transactional(readOnly = true)
    public List<MentoringChatMessageResponseDto> getMessages(Long reservationId, String email) {

        MentoringReservation reservation = findReservation(reservationId);
        Member member = findMember(email);

        checkParticipant(reservation, member);

        return chatMessageRepository
                .findByReservationIdOrderByCreatedAtAsc(reservationId)
                .stream()
                .map(MentoringChatMessageResponseDto::from)
                .toList();
    }

    // 메시지 저장 + 상대방(멘토 또는 신청자)에게 알림 발송
    @Transactional
    public MentoringChatMessageResponseDto saveMessage(Long reservationId, String email, String content) {

        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("메시지 내용을 입력해주세요.");
        }

        if (content.length() > 1000) {
            throw new IllegalArgumentException("메시지는 1000자 이하로 입력해주세요.");
        }

        MentoringReservation reservation = findReservation(reservationId);
        Member sender = findMember(email);

        checkParticipant(reservation, sender);

        MentoringChatMessage saved =
                chatMessageRepository.save(
                        new MentoringChatMessage(reservation, sender, content.trim())
                );

        notifyOtherParticipant(reservation, sender);

        return MentoringChatMessageResponseDto.from(saved);
    }

    // 메시지 작성자를 제외한 나머지 한 명(멘토 또는 신청자)에게만 알림
    private void notifyOtherParticipant(MentoringReservation reservation, Member sender) {

        boolean senderIsMentor = reservation.getMentor().getMember().getId().equals(sender.getId());

        Member recipient = senderIsMentor
                ? reservation.getMember()
                : reservation.getMentor().getMember();

        notificationService.notify(
                recipient,
                "새로운 메시지가 도착했습니다",
                sender.getNickname() + "님이 메시지를 보냈습니다.",
                "MENTORING_CHAT_MESSAGE",
                reservation.getId()
        );
    }

    // STOMP 구독(SUBSCRIBE) 인가에서 재사용하는 공개 진입점.
    // REST(getMessages/saveMessage)와 완전히 동일한 규칙(멘토/신청자 본인 + 결제 완료)을
    // 그대로 적용해, 다른 사람의 reservationId로는 구독 자체가 거부되도록 한다.
    @Transactional(readOnly = true)
    public void assertParticipant(Long reservationId, String email) {
        MentoringReservation reservation = findReservation(reservationId);
        Member member = findMember(email);
        checkParticipant(reservation, member);
    }

    // =====================================================
    // 권한 검사 (서버 측 필수 검증)
    //
    // - 해당 예약의 멘토 본인 또는 신청자 본인만 접근 가능하다.
    // - 실제로 결제(PAID)가 완료된 예약이어야만 채팅을 이용할 수 있다
    //   (PENDING/APPROVED-미결제/REJECTED 상태는 결제가 PAID가 아니므로 자동으로 차단된다).
    // - 프론트에서 버튼을 숨기는 것과 무관하게, URL/API를 직접 호출해도
    //   이 검사를 통과하지 못하면 채팅을 조회/전송할 수 없다.
    // =====================================================

    private void checkParticipant(MentoringReservation reservation, Member member) {

        boolean isMentor = reservation.getMentor().getMember().getId().equals(member.getId());
        boolean isApplicant = reservation.getMember().getId().equals(member.getId());

        if (!isMentor && !isApplicant) {
            throw new IllegalArgumentException("해당 멘토링의 멘토 또는 신청자만 채팅을 이용할 수 있습니다.");
        }

        if (!isPaid(reservation.getId())) {
            throw new IllegalArgumentException("결제가 완료된 멘토링만 채팅을 이용할 수 있습니다.");
        }
    }

    private boolean isPaid(Long reservationId) {
        return paymentRepository
                .findByProductTypeAndTargetId(PaymentProductType.MENTORING, reservationId)
                .map(payment -> payment.getStatus() == PaymentStatus.PAID)
                .orElse(false);
    }

    private MentoringReservation findReservation(Long reservationId) {
        return mentoringReservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 멘토링 예약입니다."));
    }

    private Member findMember(String email) {
        return memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));
    }
}
