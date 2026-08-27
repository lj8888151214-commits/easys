package com.easys.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class CommunityPostCreateRequest {

    // 게시글 제목
    private String title;

    // 게시글 내용
    private String content;

    private String category;

    // 첨부 이미지
    private List<MultipartFile> images;
}
