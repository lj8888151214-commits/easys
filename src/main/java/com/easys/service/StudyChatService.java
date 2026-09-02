package com.easys.service;

import com.easys.dto.StudyChatMessageResponseDto;
import com.easys.entity.Member;
import com.easys.entity.Study;
import com.easys.entity.StudyApplicationStatus;
import com.easys.entity.StudyChatMessage;
import com.easys.repository.MemberRepository;
import com.easys.repository.StudyApplicationRepository;
import com.easys.repository.StudyChatMessageRepository;
import com.easys.repository.StudyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// =====================================================
// 스터디 상세 페이지 실시간 채팅의 저장/조회를 담당한다.
//
// 실시간 중계 자체는 기존 WebSocketConfig(/signal)가 그대로 담당하고,
// 이 서비스는 "메시지를 DB에 저장" + "해당 스터디 참여자만 조회 가능"
// (방장 또는 승인된 StudyApplication 보유자)을 책임진다.
// =====================================================

@Service
@RequiredArgsConstructor
public class StudyChatService {

    private final StudyChatMessageRepository chatMessageRepository;
    private final StudyRepository studyRepository;
    private final StudyApplicationRepository studyApplicationRepository;
    private final MemberRepository memberRepository;
    private final NotificationService notificationService;

    // 채팅 기록 조회 (참여자만)
    @Transactional(readOnly = true)
    public List<StudyChatMessageResponseDto> getMessages(Long studyId, String email) {

        Study study = findStudy(studyId);
        Member member = findMember(email);

        checkParticipant(study, member);

        return chatMessageRepository
                .findByStudyIdOrderByCreatedAtAsc(studyId)
                .stream()
                .map(StudyChatMessageResponseDto::from)
                .toList();
    }

    // 메시지 저장 + 본인을 제외한 다른 참여자 전원에게 알림 발송
    @Transactional
    public StudyChatMessageResponseDto saveMessage(Long studyId, String email, String content) {

        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("메시지 내용을 입력해주세요.");
        }

        if (content.length() > 1000) {
            throw new IllegalArgumentException("메시지는 1000자 이하로 입력해주세요.");
        }

        Study study = findStudy(studyId);
        Member sender = findMember(email);

        checkParticipant(study, sender);

        StudyChatMessage saved =
                chatMessageRepository.save(
                        new StudyChatMessage(study, sender, content.trim())
                );

        notifyOtherParticipants(study, sender);

        return StudyChatMessageResponseDto.from(saved);
    }

    // 방장 + 승인된 참여자 중 메시지 작성자 본인을 제외한 전원에게 알림
    private void notifyOtherParticipants(Study study, Member sender) {

        Map<Long, Member> recipients = new LinkedHashMap<>();

        recipients.put(study.getMember().getId(), study.getMember());

        studyApplicationRepository
                .findByStudyIdAndStatus(study.getId(), StudyApplicationStatus.APPROVED)
                .forEach(application ->
                        recipients.put(application.getMember().getId(), application.getMember())
                );

        recipients.remove(sender.getId());

        for (Member recipient : recipients.values()) {
            notificationService.notify(
                    recipient,
                    "스터디 채팅에 새 메시지가 도착했습니다",
                    "스터디 모임에서 새로운 메시지가 도착했습니다.",
                    "STUDY_CHAT_MESSAGE",
                    study.getId(),
                    study.getId()
            );
        }
    }

    // 방장이거나 승인된(APPROVED) 신청자만 채팅에 접근할 수 있다
    private void checkParticipant(Study study, Member member) {

        boolean isOwner = study.getMember().getId().equals(member.getId());

        if (isOwner) {
            return;
        }

        boolean isApprovedParticipant =
                studyApplicationRepository
                        .findByStudyIdAndMemberId(study.getId(), member.getId())
                        .map(application -> application.getStatus() == StudyApplicationStatus.APPROVED)
                        .orElse(false);

        if (!isApprovedParticipant) {
            throw new IllegalArgumentException("스터디 참여자만 채팅을 이용할 수 있습니다.");
        }
    }

    private Study findStudy(Long studyId) {
        return studyRepository.findById(studyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 스터디입니다."));
    }

    private Member findMember(String email) {
        return memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));
    }
}
