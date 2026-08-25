package com.easys.controller;

import com.easys.entity.Member;
import com.easys.entity.PersonalSchedule;
import com.easys.security.CustomUserDetails;
import com.easys.service.PersonalScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/calendar/personal")
@RequiredArgsConstructor
public class PersonalScheduleController {

    private final PersonalScheduleService personalScheduleService;

    @GetMapping
    public ResponseEntity<List<PersonalSchedule>> getMySchedules(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Member member = userDetails.getMember();

        return ResponseEntity.ok(
                personalScheduleService.getMySchedules(member)
        );
    }

    @PostMapping
    public ResponseEntity<PersonalSchedule> createSchedule(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody ScheduleRequest request) {

        Member member = userDetails.getMember();

        PersonalSchedule schedule = personalScheduleService.createSchedule(
                member,
                request.title(),
                request.content(),
                request.startAt(),
                request.endAt()
        );

        return ResponseEntity.ok(schedule);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PersonalSchedule> updateSchedule(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestBody ScheduleRequest request) {

        Member member = userDetails.getMember();

        PersonalSchedule schedule = personalScheduleService.updateSchedule(
                id,
                member,
                request.title(),
                request.content(),
                request.startAt(),
                request.endAt()
        );

        return ResponseEntity.ok(schedule);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {

        Member member = userDetails.getMember();

        personalScheduleService.deleteSchedule(id, member);

        return ResponseEntity.noContent().build();
    }

    public record ScheduleRequest(
            String title,
            String content,
            LocalDateTime startAt,
            LocalDateTime endAt
    ) {
    }
}