package com.easys.repository;

import com.easys.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {

    // 조회가 자동으로 처리
    Optional<Member> findByEmail(String email);

    //  이메일이 이미 존재 하는지 체크
    boolean existsByEmail(String email);

    // 닉네임이 이미 존재 하는지 체크
    boolean existsByNickname (String nickname);
}
