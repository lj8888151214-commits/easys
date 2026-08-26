package com.easys.repository;

import com.easys.entity.Member;
import com.easys.entity.MentorProfile;
import com.easys.entity.MentorStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MentorProfileRepository
        extends JpaRepository<MentorProfile, Long> {

    Optional<MentorProfile> findByMember(Member member);

    Optional<MentorProfile> findByMemberId(Long memberId);

    boolean existsByMember(Member member);

    List<MentorProfile> findByStatus(MentorStatus status);
}