package com.easys.repository;

import com.easys.entity.AiChatMessage;
import com.easys.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiChatMessageRepository extends JpaRepository<AiChatMessage, Long> {

    // 18단계: 항상 member 기준으로만 조회한다 - 다른 사용자의 채팅이 절대 섞이면
    // 안 되므로, member를 받지 않는 조회 메서드는 만들지 않는다.
    List<AiChatMessage> findByMemberOrderByCreatedAtAsc(Member member);

    // 19단계: "지금까지 대화 다 지워줘" 실행 시 사용. 여기서도 member 기준으로만
    // 지운다 - 다른 사용자의 기록은 절대 건드리지 않는다.
    void deleteByMember(Member member);
}
