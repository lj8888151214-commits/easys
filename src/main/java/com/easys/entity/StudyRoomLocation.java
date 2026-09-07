package com.easys.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "study_room_location")
public class StudyRoomLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "study_room_id", nullable = false)
    private StudyRoom studyRoom;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;  // 위도

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude; // 경도

    public StudyRoomLocation(StudyRoom studyRoom, BigDecimal latitude, BigDecimal longitude) {
        this.studyRoom = studyRoom;
        this.latitude = latitude;
        this.longitude = longitude;
    }
}