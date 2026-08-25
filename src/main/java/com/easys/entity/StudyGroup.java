package com.easys.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "study_groups")
public class StudyGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title; // 예: Spring Boot 스터디

    private String category; // SPRING BOOT, JAVA, SQL, REACT 등

    @Column(nullable = false)
    private LocalDate targetDate; // 모임 날짜

    private String meetingTime; // 예: "19:00", "20:00"

    private int memberCount; // 참여 인원 수

    @Column(columnDefinition = "TEXT")
    private String description;
}