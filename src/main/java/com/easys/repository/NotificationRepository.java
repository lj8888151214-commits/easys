package com.easys.repository;

import com.easys.entity.Member;
import com.easys.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // 내 알림 목록 (최신순)
    List<Notification> findByMemberOrderByCreatedAtDesc(Member member);

    // 읽지 않은 알림 개수 (헤더 뱃지용)
    long countByMemberAndReadFalse(Member member);
}
