package com.easys.controller;

import com.easys.dto.PersonalScheduleResponseDto;
import com.easys.entity.Member;
import com.easys.entity.PersonalSchedule;
import com.easys.security.CustomUserDetails;
import com.easys.service.PersonalScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/calendar/personal")
@RequiredArgsConstructor
public class PersonalScheduleController {

    private final PersonalScheduleService personalScheduleService;

    @GetMapping
    public ResponseEntity<?> getMySchedules(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("로그인 정보가 없습니다.");
        }

        Member member = userDetails.getMember();

        return ResponseEntity.ok(
                personalScheduleService.getMySchedules(member)
                        .stream()
                        .map(PersonalScheduleResponseDto::new)
                        .toList()
        );
    }

    @PostMapping
    public ResponseEntity<?> createSchedule(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody ScheduleRequest request) {

        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("로그인 정보가 없습니다.");
        }

        Member member = userDetails.getMember();

        PersonalSchedule schedule =
                personalScheduleService.createSchedule(
                        member,
                        request.title(),
                        request.content(),
                        request.startAt(),
                        request.endAt()
                );

        return ResponseEntity.ok(new PersonalScheduleResponseDto(schedule));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSchedule(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestBody ScheduleRequest request) {

        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("로그인 정보가 없습니다.");
        }

        Member member = userDetails.getMember();

        PersonalSchedule schedule =
                personalScheduleService.updateSchedule(
                        id,
                        member,
                        request.title(),
                        request.content(),
                        request.startAt(),
                        request.endAt()
                );

        return ResponseEntity.ok(new PersonalScheduleResponseDto(schedule));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSchedule(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {

        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("로그인 정보가 없습니다.");
        }

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