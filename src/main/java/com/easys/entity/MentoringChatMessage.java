package com.easys.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 멘토링 예약 1건당 멘토-신청자 사이의 1:1 채팅 메시지.
//
// 별도의 ChatRoom 엔티티를 두지 않고 MentoringReservation 자체를 "방"으로
// 사용한다 - 예약 1건 = 멘토/신청자 두 명만 참여하는 대화방 하나이므로
// reservationId만으로 참여자(멘토/신청자)와 방을 동시에 특정할 수 있다.
// (StudyChatMessage가 studyId로 스터디 채팅을 구분하는 것과 동일한 방식)
@Entity
@Getter
@NoArgsConstructor
@Table(name = "mentoring_chat_message")
public class MentoringChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false)
    private MentoringReservation reservation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private Member sender;

    @Column(nullable = false, length = 1000)
    private String content;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public MentoringChatMessage(MentoringReservation reservation, Member sender, String content) {
        this.reservation = reservation;
        this.sender = sender;
        this.content = content;
        this.createdAt = LocalDateTime.now();
    }
}
