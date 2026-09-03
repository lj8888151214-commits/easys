package com.easys.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "study_room")
public class StudyRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 스터디룸 이름
    @Column(nullable = false, length = 100)
    private String name;

    // 위치
    @Column(nullable = false, length = 200)
    private String location;

    // 스터디룸 설명
    @Column(columnDefinition = "TEXT")
    private String description;

    // 최소 수용 인원
    @Column(nullable = false)
    private int minCapacity;

    // 최대 수용 인원
    @Column(nullable = false)
    private  int maxCapacity;

    // 시간당 가격
    // 금액은 Double보다 BigDecimal을 사용하는 것이 안전
    // 전체 자릿수를 최대 12자리까지 허용 소수점 2자리까지 허용
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerHour;

    // 평점
    @Column(precision = 3, scale = 2)
    private BigDecimal rating;

    // 이미지 URL
    @Column(length = 1000)
    private String imageUrl;

    // 운영 상태
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StudyRoomStatus status;

    // 생성일
    @Column(nullable = false)
    private LocalDateTime createdAt;

    // 수정일
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public StudyRoom(String name, String location, String description, int minCapacity,
            int maxCapacity, BigDecimal pricePerHour, BigDecimal rating, String imageUrl) {
        this.name = name;
        this.location = location;
        this.description = description;
        this.minCapacity = minCapacity;
        this.maxCapacity = maxCapacity;
        this.pricePerHour = pricePerHour;
        this.rating = rating;
        this.imageUrl = imageUrl;
        // 새로 등록된 스터디룸은 기본적으로 예약 가능으로 설정
        this.status = StudyRoomStatus.ACTIVE;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void update(String name, String location, String description, int minCapacity,
                       int maxCapacity, BigDecimal pricePerHour, BigDecimal rating, String imageUrl){
        this.name = name;
        this.location = location;
        this.description = description;
        this.minCapacity = minCapacity;
        this.maxCapacity = maxCapacity;
        this.pricePerHour = pricePerHour;
        this.rating = rating;
        this.imageUrl = imageUrl;
        this.updatedAt = LocalDateTime.now();
    }
    // 리뷰 평점 반영 (리뷰 등록/수정/삭제 시 평균 평점 재계산 결과를 반영)
    public void applyReviewRating(BigDecimal rating) {
        this.rating = rating;
        this.updatedAt = LocalDateTime.now();
    }

    // 스터디룸 비활성화
    public void deactivate() {
        this.status = StudyRoomStatus.INACTIVE;
        this.updatedAt = LocalDateTime.now();
    }

    // 스터디룸 활성화
    public void activate() {
        this.status = StudyRoomStatus.ACTIVE;
        this.updatedAt = LocalDateTime.now();
    }
}




