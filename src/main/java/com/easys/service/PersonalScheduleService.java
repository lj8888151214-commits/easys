package com.easys.service;

import com.easys.entity.Member;
import com.easys.entity.PersonalSchedule;
import com.easys.entity.StreamingStudio;
import com.easys.repository.PersonalScheduleRepository;
import com.easys.repository.StreamingStudioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PersonalScheduleService {

    private final PersonalScheduleRepository personalScheduleRepository;
    private final StreamingStudioRepository streamingStudioRepository;

    public PersonalSchedule createSchedule(Member member, String title, String content,
                                           LocalDateTime startAt, LocalDateTime endAt) {
        if (startAt.isAfter(endAt)) {
            throw new IllegalArgumentException("시작 시간은 종료 시간보다 늦을 수 없습니다.");
        }

        PersonalSchedule schedule = new PersonalSchedule(
                member, title, content, startAt, endAt
        );

        return personalScheduleRepository.save(schedule);
    }

    // 스트리밍 방송 일정 등록/추가용. streamingRoomId가 채워져 있으면(방장이 방
    // 안에서 방송 일정을 등록하는 경우) 요청자가 그 방의 실제 방장(닉네임 일치)인지
    // 서버에서 검증한 뒤에만 저장한다. 시청자가 "내 캘린더에 추가"할 때는
    // streamingRoomId 없이 호출되어 일반 개인 일정과 동일하게 저장된다.
    public PersonalSchedule createSchedule(Member member, String title, String content,
                                           LocalDateTime startAt, LocalDateTime endAt,
                                           Long streamingRoomId) {
        if (startAt.isAfter(endAt)) {
            throw new IllegalArgumentException("시작 시간은 종료 시간보다 늦을 수 없습니다.");
        }

        if (streamingRoomId != null) {
            StreamingStudio studio = streamingStudioRepository.findById(streamingRoomId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 스트리밍 방입니다."));

            String host = studio.getHost() != null ? studio.getHost().trim() : "";
            String nickname = member.getNickname() != null ? member.getNickname().trim() : "";

            if (host.isEmpty() || !host.equals(nickname)) {
                throw new IllegalArgumentException("방장만 이 방의 일정을 등록할 수 있습니다.");
            }
        }

        PersonalSchedule schedule = new PersonalSchedule(
                member, title, content, startAt, endAt, streamingRoomId
        );

        return personalScheduleRepository.save(schedule);
    }

    // 특정 스트리밍 방에 등록된 방송 일정만 조회한다 (미니 달력용).
    // 로그인 여부와 무관하게 방 안의 누구에게나 동일하게 보여주는 목록이다.
    @Transactional(readOnly = true)
    public List<PersonalSchedule> getByStreamingRoom(Long streamingRoomId) {
        return personalScheduleRepository.findByStreamingRoomIdOrderByStartAtAsc(streamingRoomId);
    }

    @Transactional(readOnly = true)
    public List<PersonalSchedule> getMySchedules(Member member) {
        return personalScheduleRepository.findByMemberOrderByStartAtAsc(member);
    }

    @Transactional(readOnly = true)
    public List<PersonalSchedule> getMySchedules(Member member,
                                                 LocalDateTime startAt,
                                                 LocalDateTime endAt) {
        return personalScheduleRepository
                .findByMemberAndStartAtBetweenOrderByStartAtAsc(
                        member, startAt, endAt
                );
    }

    public PersonalSchedule updateSchedule(Long scheduleId, Member member,
                                           String title, String content,
                                           LocalDateTime startAt, LocalDateTime endAt) {
        PersonalSchedule schedule = personalScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 일정입니다."));

        if (!schedule.getMember().getId().equals(member.getId())) {
            throw new IllegalArgumentException("본인의 일정만 수정할 수 있습니다.");
        }

        if (startAt.isAfter(endAt)) {
            throw new IllegalArgumentException("시작 시간은 종료 시간보다 늦을 수 없습니다.");
        }

        schedule.update(title, content, startAt, endAt);
        return schedule;
    }

    public void deleteSchedule(Long scheduleId, Member member) {
        PersonalSchedule schedule = personalScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 일정입니다."));

        if (!schedule.getMember().getId().equals(member.getId())) {
            throw new IllegalArgumentException("본인의 일정만 삭제할 수 있습니다.");
        }

        personalScheduleRepository.delete(schedule);
    }

    // 멘토링 예약이 거절/취소될 때, 이전에 자동 생성된 일정을 정리하기 위한 용도.
    // 이미 지워졌거나 소유자가 다르면 조용히 무시한다(호출부에서 별도 예외 처리가 필요 없도록).
    public void deleteScheduleIfOwnedBy(Long scheduleId, Member member) {
        if (scheduleId == null) {
            return;
        }

        personalScheduleRepository.findById(scheduleId).ifPresent(schedule -> {
            if (schedule.getMember().getId().equals(member.getId())) {
                personalScheduleRepository.delete(schedule);
            }
        });
    }
}