package com.easys.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CommunityPostUpdateRequest {

    // 수정할 제목
    private String title;

    // 수정할 내용
    private String content;
}