package com.easys.entity;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
public class Study {

    // 스터디 번호
    @Id
    @GeneratedValue(strategy =  GenerationType.IDENTITY)
    private Long id;
    // 스터디 제목
    @Column(nullable = false, length = 100)
    private String title;
    //스터디 내용
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    //스터디 분야
    @Column(nullable = false)
    private String category;
    // 최대 모집 인원
    @Column(nullable = false)
    private int maxMembers;
    // 현재 참여 인원
    private int currentMembers = 1;
    // 모집 상태   RECRUITING = 모집중 / CLOSED = 모집완료
    @Column(nullable = false)
    private String status = "RECRUITING";
    // 스터디 작성자 Member와 연결
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private Member author;
    // 작성일
    private LocalDateTime createdAt;
    // 수정일
    private LocalDateTime updatedAt;

    // 모집 생성
     public Study (String title, String content, String category, int maxMembers, Member author){
         this.title = title;
         this.content = content;
         this.category = category;
         this.maxMembers = maxMembers;
         this.currentMembers = 1;
         this.status = "RECRUITING";
         this.author = author;
         this.createdAt = LocalDateTime.now();
         this.updatedAt = LocalDateTime.now();
     }
    // 모집 수정
    public void update(String title, String content, String category, int maxMembers) {
        this.title = title;
        this.content = content;
        this.category = category;
        this.maxMembers = maxMembers;
        this.updatedAt = LocalDateTime.now();
    }
    // 모집 완료
    public void closeRecruitment() {

        this.status = "CLOSED";
    }
}
