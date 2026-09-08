package com.easys.service;

import com.easys.dto.StudyGroupDto;
import com.easys.entity.Member;
import com.easys.entity.Reservation;
import com.easys.entity.StreamingStudio;
import com.easys.entity.StudyGroup;
import com.easys.repository.StreamingStudioRepository;
import com.easys.repository.StudyGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

// 모임 캘린더(StudyGroup) 관리 서비스.
// PersonalScheduleService와 동일한 역할/위치 - 나의 캘린더 쪽이 PersonalSchedule을
// 관리하듯, 모임 캘린더 쪽은 이 서비스가 StudyGroup을 관리한다.
@Service
@RequiredArgsConstructor
@Transactional
public class StudyGroupService {

    private final StudyGroupRepository studyGroupRepository;
    private final StreamingStudioRepository streamingStudioRepository;

    // 스터디룸 예약이 확정될 때 자동으로 모임 일정 1건을 생성한다.
    public StudyGroup createForStudyReservation(Reservation reservation, LocalDateTime startAt, LocalDateTime endAt) {

        StudyGroup group = StudyGroup.builder()
                .title(reservation.getStudy().getTitle() + " (" + reservation.getStudyRoom().getName() + ")")
                .description(reservation.getStudyRoom().getLocation() + " / " + reservation.getPeopleCount() + "명 예약")
                .type("STUDY")
                .study(reservation.getStudy())
                .startAt(startAt)
                .endAt(endAt)
                .build();

        return studyGroupRepository.save(group);
    }

    // 예약이 취소될 때 자동 생성됐던 모임 일정을 정리한다.
    // 예약 쪽에서만(내부적으로) 호출되므로 별도 소유자 검증 없이 존재하면 삭제한다.
    public void deleteIfLinkedToReservation(Long groupScheduleId) {
        if (groupScheduleId == null) {
            return;
        }
        studyGroupRepository.findById(groupScheduleId)
                .ifPresent(studyGroupRepository::delete);
    }

    // 사용자가 캘린더에서 수동으로 모임 일정을 등록한다.
    // dto.streamingRoomId가 채워져 있으면(스트리밍 방 미니 달력에서의 등록), 그 방의
    // 실제 방장(StreamingStudio.host)이 creator 본인인지 서버에서 반드시 검증한다.
    // 방장이 아니면 streamingRoomId를 무시하는 게 아니라 등록 자체를 거부한다.
    public StudyGroup createManual(Member creator, StudyGroupDto dto) {

        if (dto.getTitle() == null || dto.getTitle().isBlank()) {
            throw new IllegalArgumentException("일정 제목을 입력해주세요.");
        }
        if (dto.getStartAt() == null || dto.getEndAt() == null) {
            throw new IllegalArgumentException("시작/종료 시간을 입력해주세요.");
        }
        if (dto.getStartAt().isAfter(dto.getEndAt())) {
            throw new IllegalArgumentException("시작 시간은 종료 시간보다 늦을 수 없습니다.");
        }

        Long streamingRoomId = dto.getStreamingRoomId();
        if (streamingRoomId != null) {
            StreamingStudio studio = streamingStudioRepository.findById(streamingRoomId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 스트리밍 방입니다."));

            String host = studio.getHost() != null ? studio.getHost().trim() : "";
            String nickname = creator.getNickname() != null ? creator.getNickname().trim() : "";

            if (host.isEmpty() || !host.equals(nickname)) {
                throw new IllegalArgumentException("방장만 이 방의 일정을 등록할 수 있습니다.");
            }
        }

        StudyGroup group = StudyGroup.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .type(dto.getType() != null && !dto.getType().isBlank() ? dto.getType() : "GENERAL")
                .createdBy(creator)
                .streamingRoomId(streamingRoomId)
                .startAt(dto.getStartAt())
                .endAt(dto.getEndAt())
                .build();

        return studyGroupRepository.save(group);
    }

    // 수동 등록한 모임 일정을 삭제한다. 본인이 등록한 것만 삭제 가능.
    public void deleteManual(Long id, Member member) {

        StudyGroup group = studyGroupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 일정입니다."));

        if (group.getCreatedBy() == null || !group.getCreatedBy().getId().equals(member.getId())) {
            throw new IllegalArgumentException("본인이 등록한 일정만 삭제할 수 있습니다.");
        }

        studyGroupRepository.delete(group);
    }

    @Transactional(readOnly = true)
    public List<StudyGroup> getVisibleForMember(Member member, LocalDateTime start, LocalDateTime end) {
        return studyGroupRepository.findVisibleForMember(member, start, end);
    }

    @Transactional(readOnly = true)
    public List<StudyGroup> getUpcomingVisibleForMember(Member member) {
        return studyGroupRepository.findUpcomingVisibleForMember(member, LocalDateTime.now());
    }

    // 특정 스트리밍 방에서 방장이 등록한 원본 일정만 조회한다 (미니 달력용).
    // 로그인 여부와 무관하게 방 안의 누구에게나 동일하게 보여주는 목록이다.
    @Transactional(readOnly = true)
    public List<StudyGroup> getByStreamingRoom(Long streamingRoomId) {
        return studyGroupRepository.findByStreamingRoomIdOrderByStartAtAsc(streamingRoomId);
    }
}
