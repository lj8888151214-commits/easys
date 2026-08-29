package com.easys.service;

import com.easys.entity.Member;
import com.easys.entity.PersonalSchedule;
import com.easys.repository.PersonalScheduleRepository;
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