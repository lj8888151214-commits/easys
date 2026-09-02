package com.easys.service;

import com.easys.dto.NotificationResponseDto;
import com.easys.entity.Member;
import com.easys.entity.Notification;
import com.easys.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// =====================================================
// 사이트 내 알림(웹 알림) 공통 서비스.
//
// 이메일과 별개로, 로그인한 회원이 헤더의 알림 아이콘에서
// 바로 확인할 수 있는 알림을 저장/조회한다.
// =====================================================

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;

    // 알림 생성. 다른 도메인 서비스(예약 승인 등)가 이 메서드만 호출하면 된다.
    public void notify(Member member, String title, String content, String type, Long targetId) {
        notificationRepository.save(
                new Notification(member, title, content, type, targetId)
        );
    }

    @Transactional(readOnly = true)
    public List<NotificationResponseDto> getMyNotifications(Member member) {
        return notificationRepository
                .findByMemberOrderByCreatedAtDesc(member)
                .stream()
                .map(NotificationResponseDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Member member) {
        return notificationRepository.countByMemberAndReadFalse(member);
    }

    public void markAsRead(Long notificationId, Member member) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 알림입니다."));

        if (!notification.getMember().getId().equals(member.getId())) {
            throw new IllegalArgumentException("본인의 알림만 확인할 수 있습니다.");
        }

        notification.markRead();
    }

    public void markAllAsRead(Member member) {
        notificationRepository.findByMemberOrderByCreatedAtDesc(member)
                .forEach(Notification::markRead);
    }
}
