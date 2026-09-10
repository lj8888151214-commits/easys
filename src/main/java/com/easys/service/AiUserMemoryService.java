package com.easys.service;

import com.easys.entity.AiUserMemory;
import com.easys.entity.Member;
import com.easys.repository.AiUserMemoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

// 18단계: 로그인 사용자가 AI에게 "기억해달라"고 명시적으로 요청한 정보만 DB에
// 남긴다. 일반 대화 전체를 여기에 저장하지 않는다 - 그건 AiChatMessage(영구 채팅
// 기록)의 역할이고, 여기는 "사실/선호 정보" 같은 키-값 기억만 담당한다.
@Service
@RequiredArgsConstructor
public class AiUserMemoryService {

    public static final String KEY_PREFERRED_NAME = "preferred_name";

    private final AiUserMemoryRepository aiUserMemoryRepository;

    @Transactional(readOnly = true)
    public Optional<String> find(Member member, String memoryKey) {
        return aiUserMemoryRepository.findByMemberAndMemoryKey(member, memoryKey)
                .map(AiUserMemory::getMemoryValue);
    }

    // 같은 key가 이미 있으면 값만 최신으로 덮어쓰고, 없으면 새로 만든다
    // (예: "0ho야 기억해" 다음에 "이제부터 영호라고 불러줘"라고 하면 preferred_name이
    // "0ho"에서 "영호"로 바뀐다 - 중복으로 쌓이지 않는다).
    @Transactional
    public void remember(Member member, String memoryKey, String memoryValue) {
        aiUserMemoryRepository.findByMemberAndMemoryKey(member, memoryKey)
                .ifPresentOrElse(
                        existing -> existing.updateValue(memoryValue),
                        () -> aiUserMemoryRepository.save(new AiUserMemory(member, memoryKey, memoryValue))
                );
    }

    // "그거 잊어줘"처럼 어떤 key인지 특정하지 않은 요청을 위해, 가장 최근에 저장된
    // 기억 하나를 찾는다.
    @Transactional(readOnly = true)
    public Optional<String> findMostRecentKey(Member member) {
        return aiUserMemoryRepository.findByMemberOrderByCreatedAtDesc(member)
                .stream()
                .findFirst()
                .map(AiUserMemory::getMemoryKey);
    }

    @Transactional
    public boolean forget(Member member, String memoryKey) {
        boolean existed = aiUserMemoryRepository.findByMemberAndMemoryKey(member, memoryKey).isPresent();
        if (existed) {
            aiUserMemoryRepository.deleteByMemberAndMemoryKey(member, memoryKey);
        }
        return existed;
    }
}
