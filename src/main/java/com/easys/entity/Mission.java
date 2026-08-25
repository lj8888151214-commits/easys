package com.easys.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "missions")
public class Mission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDate targetDate;

    private String category; // CODING, NETWORK, DATABASE, PROJECT

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // 👈 1. 메인 완료 필드 (Lombok이 get/set 생성)
    @Column(name = "completed")
    @Builder.Default
    private boolean completed = false;

    // 👈 2. DB 컬럼 동기화용 필드 (Lombok 메서드 중복 생성 방지)
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    @Column(name = "is_completed")
    @Builder.Default
    private boolean isCompleted = false;

    @PrePersist
    @PreUpdate
    public void syncData() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        // DB의 is_completed 컬럼에도 동일한 값 전달
        this.isCompleted = this.completed;
    }
}