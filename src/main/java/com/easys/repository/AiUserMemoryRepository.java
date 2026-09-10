package com.easys.repository;

import com.easys.entity.AiUserMemory;
import com.easys.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AiUserMemoryRepository extends JpaRepository<AiUserMemory, Long> {

    Optional<AiUserMemory> findByMemberAndMemoryKey(Member member, String memoryKey);

    List<AiUserMemory> findByMemberOrderByCreatedAtDesc(Member member);

    void deleteByMemberAndMemoryKey(Member member, String memoryKey);
}
