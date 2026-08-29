package com.easys.repository;

import com.easys.entity.Member;
import com.easys.entity.MemberRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {

    // 조회가 자동으로 처리
    Optional<Member> findByEmail(String email);

    //  이메일이 이미 존재 하는지 체크
    boolean existsByEmail(String email);

    // 닉네임이 이미 존재 하는지 체크
    boolean existsByNickname (String nickname);

    // 해당 권한을 가진 회원이 존재하는지 체크 (관리자 부트스트랩용)
    boolean existsByRole(MemberRole role);
}
