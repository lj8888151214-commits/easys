package com.easys.controller;

import com.easys.dto.CommunityPostDto;
import com.easys.entity.StudyGroup;
import com.easys.service.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class CommunityApiController {

    private final CommunityService communityService;

    @GetMapping("/posts")
    public ResponseEntity<List<CommunityPostDto.Response>> getPosts(
            @RequestParam(required = false, defaultValue = "ALL") String category,
            @RequestParam(required = false, defaultValue = "latest") String sort) {
        return ResponseEntity.ok(communityService.getPosts(category, sort));
    }

    @GetMapping("/trending")
    public ResponseEntity<List<CommunityPostDto.Response>> getTrendingPosts() {
        return ResponseEntity.ok(communityService.getTrendingPosts());
    }

    @PostMapping("/posts")
    public ResponseEntity<CommunityPostDto.Response> createPost(@RequestBody CommunityPostDto.Request req) {
        return ResponseEntity.ok(communityService.createPost(req));
    }

    @PostMapping("/posts/{id}/like")
    public ResponseEntity<Void> likePost(@PathVariable Long id) {
        communityService.likePost(id);
        return ResponseEntity.ok().build();
    }

    // 댓글 조회
    @GetMapping("/posts/{id}/comments")
    public ResponseEntity<List<CommunityPostDto.CommentResponse>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(communityService.getComments(id));
    }

    // 댓글 등록
    @PostMapping("/posts/{id}/comments")
    public ResponseEntity<CommunityPostDto.CommentResponse> addComment(
            @PathVariable Long id,
            @RequestBody CommunityPostDto.CommentRequest req) {
        return ResponseEntity.ok(communityService.addComment(id, req));
    }

    // 모임 캘린더 등록
    @PostMapping("/posts/{id}/add-to-calendar")
    public ResponseEntity<StudyGroup> addToCalendar(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate targetDate,
            @RequestParam(required = false, defaultValue = "19:00") String meetingTime) {
        return ResponseEntity.ok(communityService.addPostToCalendar(id, targetDate, meetingTime));
    }
}