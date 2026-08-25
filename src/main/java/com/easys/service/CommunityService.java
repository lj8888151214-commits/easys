package com.easys.service;

import com.easys.dto.CommunityPostDto;
import com.easys.entity.CommunityPost;
import com.easys.entity.StudyGroup;
import com.easys.repository.CommunityPostRepository;
import com.easys.repository.StudyGroupRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommunityService {

    private final CommunityPostRepository communityPostRepository;
    private final StudyGroupRepository studyGroupRepository;

    @PostConstruct
    public void initData() {
        if (communityPostRepository.count() == 0) {
            CommunityPost post1 = CommunityPost.builder()
                    .author("김개발").authorAvatar("김").category("QUESTION")
                    .title("Spring Security 로그인 부분이 이해가 안됩니다.")
                    .content("SecurityFilterChain을 공부하고 있는데 인증 과정이 생각보다 어렵네요. 혹시 쉽게 이해할 수 있는 방법이 있을까요?")
                    .tags("#Spring,#SpringSecurity,#Java").likeCount(12).commentCount(0).viewCount(142).build();

            post1.addComment(CommunityPost.Comment.builder()
                    .author("이코딩").content("공식 문서의 Security Filter Flow 다이어그램을 먼저 보시면 흐름 파악에 큰 도움이 됩니다!").build());
            communityPostRepository.save(post1);

            CommunityPost post2 = CommunityPost.builder()
                    .author("박스터디").authorAvatar("박").category("RECRUIT")
                    .title("Spring Boot 같이 공부하실 분 모집합니다.")
                    .content("Spring Boot를 처음부터 공부하면서 간단한 프로젝트까지 같이 만들어보려고 합니다. 초보자분들도 환영합니다.")
                    .studySchedule("매주 월요일 19:00").studyMembers("6 / 10명")
                    .tags("#스터디모집,#SpringBoot").likeCount(21).commentCount(0).viewCount(203).build();

            post2.addComment(CommunityPost.Comment.builder()
                    .author("김개발").content("저도 참여하고 싶습니다! 기초부터 진행하나요?").build());
            post2.addComment(CommunityPost.Comment.builder()
                    .author("박스터디").content("네! 완전 기초 MVC부터 시작해서 캘린더/채팅 프로젝트까지 진행합니다.").build());
            communityPostRepository.save(post2);
        }
    }

    // 게시글 목록 조회
    @Transactional(readOnly = true)
    public List<CommunityPostDto.Response> getPosts(String category, String sort) {
        List<CommunityPost> posts;
        if (category != null && !category.isEmpty() && !category.equals("ALL")) {
            posts = communityPostRepository.findByCategoryOrderByCreatedAtDesc(category);
        } else {
            if ("like".equals(sort)) {
                posts = communityPostRepository.findAllByOrderByLikeCountDesc();
            } else {
                posts = communityPostRepository.findAllByOrderByCreatedAtDesc();
            }
        }
        return posts.stream().map(CommunityPostDto.Response::fromEntity).collect(Collectors.toList());
    }

    // 트렌딩(인기 Top 4)
    @Transactional(readOnly = true)
    public List<CommunityPostDto.Response> getTrendingPosts() {
        return communityPostRepository.findTop4ByOrderByLikeCountDesc().stream()
                .map(CommunityPostDto.Response::fromEntity)
                .collect(Collectors.toList());
    }

    // 글 등록
    @Transactional
    public CommunityPostDto.Response createPost(CommunityPostDto.Request req) {
        CommunityPost post = CommunityPost.builder()
                .author(req.getAuthor() != null ? req.getAuthor() : "익명 개발자")
                .authorAvatar(req.getAuthorAvatar())
                .category(req.getCategory() != null ? req.getCategory() : "QUESTION")
                .title(req.getTitle())
                .content(req.getContent())
                .tags(req.getTags())
                .studySchedule(req.getStudySchedule())
                .studyMembers(req.getStudyMembers())
                .build();
        return CommunityPostDto.Response.fromEntity(communityPostRepository.save(post));
    }

    // 좋아요
    @Transactional
    public void likePost(Long id) {
        communityPostRepository.findById(id).ifPresent(post -> post.setLikeCount(post.getLikeCount() + 1));
    }

    // 댓글 목록 조회
    @Transactional(readOnly = true)
    public List<CommunityPostDto.CommentResponse> getComments(Long postId) {
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다. ID: " + postId));

        return post.getComments().stream()
                .map(CommunityPostDto.CommentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // 댓글 등록 & 모임 캘린더 자동 연동
    @Transactional
    public CommunityPostDto.CommentResponse addComment(Long postId, CommunityPostDto.CommentRequest req) {
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다. ID: " + postId));

        String authorName = (req.getAuthor() != null && !req.getAuthor().trim().isEmpty())
                ? req.getAuthor() : "익명 개발자";

        CommunityPost.Comment comment = CommunityPost.Comment.builder()
                .author(authorName)
                .content(req.getContent())
                .build();

        post.addComment(comment);
        CommunityPost savedPost = communityPostRepository.saveAndFlush(post);

        // 🗓️ 댓글 등록 시 모임 캘린더 자동 생성 (StudyGroup 기본 필드 안전 매핑)
        try {
            StudyGroup autoGroup = StudyGroup.builder()
                    .title("[" + (post.getCategory() != null ? post.getCategory() : "STUDY") + "] " + post.getTitle())
                    .category(post.getCategory() != null ? post.getCategory() : "STUDY")
                    .targetDate(LocalDate.now().plusDays(1))
                    .meetingTime("19:00")
                    .memberCount(savedPost.getComments().size() + 1)
                    .description("커뮤니티 댓글 참여: " + req.getContent())
                    .build();

            studyGroupRepository.save(autoGroup);
        } catch (Exception e) {
            System.err.println("캘린더 자동 등록 건너뜀: " + e.getMessage());
        }

        CommunityPost.Comment lastComment = savedPost.getComments().get(savedPost.getComments().size() - 1);
        return CommunityPostDto.CommentResponse.fromEntity(lastComment);
    }

    // 모임 캘린더 수동 등록
    @Transactional
    public StudyGroup addPostToCalendar(Long postId, LocalDate targetDate, String meetingTime) {
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다."));

        StudyGroup group = StudyGroup.builder()
                .title(post.getTitle())
                .category(post.getCategory() != null ? post.getCategory() : "STUDY")
                .targetDate(targetDate != null ? targetDate : LocalDate.now())
                .meetingTime(meetingTime != null ? meetingTime : "19:00")
                .memberCount(post.getComments().size() + 1)
                .description("커뮤니티 연동 모임: " + post.getContent())
                .build();

        return studyGroupRepository.save(group);
    }
}