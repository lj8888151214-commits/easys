package com.easys.service;

import com.easys.dto.StudyGroupDto;
import com.easys.entity.Member;
import com.easys.entity.Reservation;
import com.easys.entity.StudyGroup;
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

        StudyGroup group = StudyGroup.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .type(dto.getType() != null && !dto.getType().isBlank() ? dto.getType() : "GENERAL")
                .createdBy(creator)
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
}
