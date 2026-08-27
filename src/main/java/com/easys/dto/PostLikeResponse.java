package com.easys.dto;

import lombok.Getter;

@Getter
public class PostLikeResponse {

    private boolean liked;

    private long likeCount;


    public PostLikeResponse(boolean liked, long likeCount) {
        this.liked = liked;
        this.likeCount = likeCount;
    }
}