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
import java.util.List;

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
                        request.endAt(),
                        request.streamingRoomId()
                );

        return ResponseEntity.ok(new PersonalScheduleResponseDto(schedule));
    }

    // 특정 스트리밍 방에 등록된 방송 일정만 조회 (미니 달력용).
    // 방장/시청자 모두 같은 응답을 받는다 - 접근 제어는 "생성" 시점에서만 한다.
    @GetMapping("/room/{roomId}")
    public ResponseEntity<?> getRoomSchedules(@PathVariable Long roomId) {

        List<PersonalScheduleResponseDto> list = personalScheduleService
                .getByStreamingRoom(roomId)
                .stream()
                .map(PersonalScheduleResponseDto::new)
                .toList();

        return ResponseEntity.ok(list);
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
            LocalDateTime endAt,
            // 스트리밍 방장이 방 안에서 일정을 등록할 때만 전송(StreamingStudio.id).
            // 서버가 요청자가 그 방의 실제 방장인지 검증한 뒤에만 저장된다.
            Long streamingRoomId
    ) {
    }
}