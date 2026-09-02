package com.easys.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
@Table(
        name = "study_room_review",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"member_id", "study_room_id"}
        )
)
public class StudyRoomReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 리뷰 작성자
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 리뷰 대상 스터디룸
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_room_id", nullable = false)
    private StudyRoom studyRoom;

    // 평점 (1~5)
    @Column(nullable = false)
    private int rating;

    // 리뷰 내용
    @Column(nullable = false, length = 1000)
    private String content;

    // 생성일
    @Column(nullable = false)
    private LocalDateTime createdAt;

    // 수정일
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public StudyRoomReview(
            Member member,
            StudyRoom studyRoom,
            int rating,
            String content
    ) {
        this.member = member;
        this.studyRoom = studyRoom;
        this.rating = rating;
        this.content = content;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // 리뷰 수정
    public void update(int rating, String content) {
        this.rating = rating;
        this.content = content;
        this.updatedAt = LocalDateTime.now();
    }
}
