package com.easys.repository;

import com.easys.entity.MentoringChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MentoringChatMessageRepository extends JpaRepository<MentoringChatMessage, Long> {

    List<MentoringChatMessage> findByReservationIdOrderByCreatedAtAsc(Long reservationId);
}
