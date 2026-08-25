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
}