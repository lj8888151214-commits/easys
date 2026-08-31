package com.easys.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "streaming_studio")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StreamingStudio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    private String category;

    private String host;

    private int viewers;
}