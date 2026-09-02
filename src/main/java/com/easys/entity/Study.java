package com.easys.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Getter
@NoArgsConstructor
public class Study {

    // =====================================================
    // 1. 스터디 기본 정보
    // =====================================================

    // 스터디 번호
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    // 스터디 제목
    @Column(nullable = false, length = 100)
    private String title;


    // 스터디 내용
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;


    // 스터디 분야
    @Column(nullable = false, length = 50)
    private String category;


    // 스터디 주제
    // 컬럼 자체는 nullable로 두어 기존(ddl-auto=update) 레거시 row가
    // 깨지지 않게 하고, 신규 생성/수정 시에는 validateTopic()에서 필수로 검증한다.
    @Column(length = 150)
    private String topic;


    // 스터디 진행 날짜 / 시작 시간 / 종료 시간
    // 이 일정이 그대로 스터디룸 예약 시간이 되므로 1시간 단위로만 허용한다
    // (ReservationService의 예약 시간 단위 규칙과 맞춰야 함).
    // 컬럼은 nullable(레거시 row 보호), 신규 생성/수정 시에는 validateSchedule()에서 필수로 검증한다.
    private LocalDate studyDate;

    private LocalTime startTime;

    private LocalTime endTime;


    // 최대 모집 인원
    @Column(nullable = false)
    private int maxMembers;


    // 현재 참여 인원
    // 스터디를 만든 방장 1명부터 시작
    @Column(nullable = false)
    private int currentMembers;


    // 모집/진행 상태
    // RECRUITING = 모집중
    // CLOSED = 모집완료 (정원이 찼지만 스터디는 아직 진행 중)
    // COMPLETED = 스터디 완료 (방장이 직접 종료 처리, 목록에서 제외)
    @Column(nullable = false)
    private String status;



    // 스터디 작성자

    //여러 개의 Study가 한 명의 Member를 작성자로 가질 수 있음
    // Study N : 1 Member

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private Member member;

    // 스터디 생성 날짜
    @Column(nullable = false)
    private LocalDateTime createdAt;

    // 스터디 수정 날짜
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    //  스터디 생성
    public Study(
            String title,
            String content,
            String category,
            String topic,
            LocalDate studyDate,
            LocalTime startTime,
            LocalTime endTime,
            int maxMembers,
            Member member
    ) {
        // 기본값 검증
        validateTitle(title);
        validateContent(content);
        validateCategory(category);
        validateTopic(topic);
        validateSchedule(studyDate, startTime, endTime);
        validateMaxMembers(maxMembers);

        // 실제 데이터 저장
        this.title = title;
        this.content = content;
        this.category = category;
        this.topic = topic;
        this.studyDate = studyDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.maxMembers = maxMembers;


        // 스터디 생성자는 방장이므로 처음 인원은 1명
        this.currentMembers = 1;


        // 처음에는 모집중
        this.status = "RECRUITING";


        // 작성자
        this.member = member;


        // 생성 시간
        this.createdAt = LocalDateTime.now();


        // 수정 시간
        this.updatedAt = LocalDateTime.now();
    }


    // 4. 스터디 수정
    public void update(
            String title,
            String content,
            String category,
            String topic,
            LocalDate studyDate,
            LocalTime startTime,
            LocalTime endTime,
            int maxMembers
    ) {

        // 수정할 데이터 검증
        validateTitle(title);
        validateContent(content);
        validateCategory(category);
        validateTopic(topic);
        validateSchedule(studyDate, startTime, endTime);
        validateMaxMembers(maxMembers);



        // 현재 참여 인원보다 최대 인원을 작게 만들 수 없음
        if (maxMembers < this.currentMembers) {
            throw new IllegalArgumentException(
                    "최대 모집 인원은 현재 참여 인원보다 적을 수 없습니다."
            );
        }

        // 데이터 수정
        this.title = title;
        this.content = content;
        this.category = category;
        this.topic = topic;
        this.studyDate = studyDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.maxMembers = maxMembers;


        // 최대 인원에 도달했다면 모집 종료
        if (this.currentMembers >= this.maxMembers) {
            this.status = "CLOSED";
        } else {
            this.status = "RECRUITING";
        }
        // 수정 시간 갱신
        this.updatedAt = LocalDateTime.now();
    }

    // 5. 모집 종료
    public void closeRecruitment() {
        this.status = "CLOSED";
        this.updatedAt = LocalDateTime.now();
    }



    // 6. 스터디 인원 증가
    public void increaseCurrentMembers() {
        // 이미 모집이 끝난 경우
        if ("CLOSED".equals(this.status)) {
            throw new IllegalArgumentException(
                    "모집이 종료된 스터디입니다."
            );
        }
        // 최대 인원 확인
        if (this.currentMembers >= this.maxMembers) {
            throw new IllegalArgumentException(
                    "모집 인원이 가득 찼습니다."
            );
        }
        // 현재 인원 +1
        this.currentMembers++;
        // 최대 인원에 도달하면 모집 종료
        if (this.currentMembers >= this.maxMembers) {
            this.status = "CLOSED";
        }
        this.updatedAt = LocalDateTime.now();
    }



    // 7. 스터디 인원 감소
    public void decreaseCurrentMembers() {
        // 방장 1명보다 적어질 수 없음
        if (this.currentMembers <= 1) {
            throw new IllegalArgumentException(
                    "스터디 방장은 항상 한 명 이상 존재해야 합니다."
            );
        }
        // 현재 인원 -1
        this.currentMembers--;
        // 자리가 생겼으면 다시 모집중
        if (this.currentMembers < this.maxMembers) {
            this.status = "RECRUITING";
        }
        this.updatedAt = LocalDateTime.now();
    }


    // 8. 스터디 완료 처리 (방장이 직접 종료)
    //
    // 예약/결제/채팅/캘린더 등 관련 데이터는 전혀 건드리지 않고 상태값만
    // COMPLETED로 바꾼다 - 목록 조회(StudyService.getStudies 등)에서
    // COMPLETED 상태를 제외하는 방식으로 "진행 중 목록"에서만 감춘다.
    public void complete() {

        if ("COMPLETED".equals(this.status)) {
            throw new IllegalArgumentException(
                    "이미 완료된 스터디입니다."
            );
        }

        this.status = "COMPLETED";
        this.updatedAt = LocalDateTime.now();
    }


    // =====================================================
    // 9. 입력값 검증
    // =====================================================

    private void validateTitle(String title) {

        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException(
                    "스터디 제목을 입력해주세요."
            );
        }


        if (title.length() > 100) {
            throw new IllegalArgumentException(
                    "스터디 제목은 100자 이하로 입력해주세요."
            );
        }
    }


    private void validateContent(String content) {

        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException(
                    "스터디 내용을 입력해주세요."
            );
        }
    }


    private void validateCategory(String category) {

        if (category == null || category.isBlank()) {
            throw new IllegalArgumentException(
                    "스터디 분야를 선택해주세요."
            );
        }
        if (category.length() > 50) {
            throw new IllegalArgumentException(
                    "스터디 분야는 50자 이하로 입력해주세요."
            );
        }
    }


    private void validateTopic(String topic) {

        if (topic == null || topic.isBlank()) {
            throw new IllegalArgumentException(
                    "스터디 주제를 입력해주세요."
            );
        }
        if (topic.length() > 150) {
            throw new IllegalArgumentException(
                    "스터디 주제는 150자 이하로 입력해주세요."
            );
        }
    }


    private void validateSchedule(LocalDate studyDate, LocalTime startTime, LocalTime endTime) {

        if (studyDate == null || startTime == null || endTime == null) {
            throw new IllegalArgumentException(
                    "스터디 날짜와 시작/종료 시간을 입력해주세요."
            );
        }

        if (studyDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "지난 날짜는 스터디 일정으로 선택할 수 없습니다."
            );
        }

        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException(
                    "시작 시간은 종료 시간보다 빨라야 합니다."
            );
        }

        // 이 일정이 그대로 스터디룸 예약 시간이 되므로 1시간 단위로만 허용한다
        if (Duration.between(startTime, endTime).toMinutes() % 60 != 0) {
            throw new IllegalArgumentException(
                    "스터디 시간은 1시간 단위로만 설정할 수 있습니다."
            );
        }
    }


    private void validateMaxMembers(int maxMembers) {
        // 방장 본인을 포함해서 최소 2명
        if (maxMembers < 2) {
            throw new IllegalArgumentException(
                    "최대 모집 인원은 최소 2명이어야 합니다."
            );
        }
    }
}