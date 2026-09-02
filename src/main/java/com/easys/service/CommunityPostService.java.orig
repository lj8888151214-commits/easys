package com.easys.service;

import com.easys.dto.CommunityPostCreateRequest;
import com.easys.dto.CommunityPostDetailResponse;
import com.easys.dto.CommunityPostResponse;
import com.easys.dto.CommunityPostUpdateRequest;
import com.easys.entity.CommunityImage;
import com.easys.entity.CommunityPost;
import com.easys.entity.Member;
import com.easys.repository.CommentRepository;
import com.easys.repository.CommunityPostRepository;
import com.easys.repository.PostLikeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CommunityPostService {

    private final CommunityPostRepository communityPostRepository;

    private final CommunityImageService communityImageService;

    private final PostLikeRepository postLikeRepository;

    private final CommentRepository commentRepository;


    // 게시글 작성
    public Long createPost(
            CommunityPostCreateRequest request,
            Member member
    ) {

        // 게시글 생성
        CommunityPost post =
                new CommunityPost(
                        request.getTitle(),
                        request.getContent(),
                        request.getCategory(),
                        member
                );


        // 이미지 처리
        if (request.getImages() != null) {

            for (MultipartFile file :
                    request.getImages()) {

                // 빈 파일은 건너뛰기
                if (file == null || file.isEmpty()) {
                    continue;
                }


                // 이미지 파일 저장
                String imageUrl =
                        communityImageService.saveImage(file);


                // 이미지 Entity 생성
                CommunityImage image =
                        new CommunityImage(
                                imageUrl,
                                file.getOriginalFilename()
                        );


                // 게시글과 이미지 연결
                post.addImage(image);
            }
        }


        // 게시글 저장
        communityPostRepository.save(post);


        // 생성된 게시글 ID 반환
        return post.getId();
    }


    // 게시글 목록 조회
    @Transactional(readOnly = true)
    public List<CommunityPostResponse> getPosts() {

        return communityPostRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(post -> {

                    // 댓글 개수 조회
                    long commentCount =
                            commentRepository
                                    .countByCommunityPost_Id(
                                            post.getId()
                                    );

                    // 좋아요 개수 조회
                    long likeCount =
                            postLikeRepository
                                    .countByCommunityPostId(
                                            post.getId()
                                    );


                    // 게시글 목록 Response 생성
                    return new CommunityPostResponse(
                            post,
                            likeCount,
                            commentCount
                    );
                })
                .toList();
    }


    // 게시글 상세 조회
    public CommunityPostDetailResponse getPost(
            Long postId
    ) {

        // 게시글 조회
        CommunityPost post =
                communityPostRepository
                        .findById(postId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "게시글을 찾을 수 없습니다."
                                )
                        );


        // 조회수 증가
        post.increaseViewCount();


        // 좋아요 개수 조회
        long likeCount =
                postLikeRepository
                        .countByCommunityPostId(postId);


        // 상세 Response 반환
        return new CommunityPostDetailResponse(
                post,
                likeCount,
                commentRepository.countByCommunityPost_Id(postId)
        );
    }


    // 게시글 수정
    public void updatePost(
            Long postId,
            CommunityPostUpdateRequest request,
            Member member
    ) {

        // 게시글 조회
        CommunityPost post =
                communityPostRepository
                        .findById(postId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "게시글을 찾을 수 없습니다."
                                )
                        );


        // 작성자 확인
        if (!post.getMember().getId().equals(member.getId())) {

            throw new IllegalArgumentException(
                    "게시글 작성자만 수정할 수 있습니다."
            );
        }


        // 게시글 수정
        post.update(
                request.getTitle(),
                request.getContent()
        );
    }


    // 게시글 삭제
    public void deletePost(
            Long postId,
            Member member
    ) {

        // 게시글 조회
        CommunityPost post =
                communityPostRepository
                        .findById(postId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "게시글을 찾을 수 없습니다."
                                )
                        );


        // 작성자 확인
        if (!post.getMember().getId().equals(member.getId())) {

            throw new IllegalArgumentException(
                    "게시글 작성자만 삭제할 수 있습니다."
            );
        }


        // 게시글 삭제
        // CascadeType.ALL + orphanRemoval 설정에 의해
        // 연결된 이미지도 함께 삭제됨
        communityPostRepository.delete(post);
    }
}
