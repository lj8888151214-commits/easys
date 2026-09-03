package com.easys.config;

import com.easys.entity.StudyRoom;
import com.easys.entity.StudyRoomLocation;
import com.easys.repository.ReservationRepository;
import com.easys.repository.StudyRoomLocationRepository;
import com.easys.repository.StudyRoomRepository;
import com.easys.repository.StudyRoomReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/*
 * 결제 기능이 붙기 전까지 테스트용으로 사용할
 * 스터디룸 더미 데이터를 등록한다.
 *
 * 예약/리뷰 데이터가 하나도 없을 때는 기존 더미 스터디룸을 지우고
 * 아래 목록으로 다시 채워서, 코드만 수정하면 재시작 시 항상
 * 최신 더미 데이터로 맞춰진다. 예약/리뷰가 이미 생겼다면
 * FK 충돌을 피하기 위해 건드리지 않는다.
 */
@Component
@RequiredArgsConstructor
public class StudyRoomDataInitializer implements CommandLineRunner {

    private final StudyRoomRepository studyRoomRepository;
    private final StudyRoomLocationRepository studyRoomLocationRepository;
    private final ReservationRepository reservationRepository;
    private final StudyRoomReviewRepository studyRoomReviewRepository;

    @Override
    public void run(String... args) {

        if (reservationRepository.count() > 0
                || studyRoomReviewRepository.count() > 0) {
            return;
        }

        studyRoomLocationRepository.deleteAll();

        StudyRoom room1 = studyRoomRepository.save(new StudyRoom(
                "스터디룸 그린",
                "서울 강남구",
                "조용하고 쾌적한 스터디 공간",
                1,
                8,
                new BigDecimal("12000"),
                new BigDecimal("4.8"),
                "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80"
        ));
        studyRoomLocationRepository.save(new StudyRoomLocation(
                room1,
                new BigDecimal("37.517236"),
                new BigDecimal("127.047325")
        ));

        // 2. 워크 라운지
        StudyRoom room2 = studyRoomRepository.save(new StudyRoom(
                "워크 라운지",
                "서울 역삼동",
                "프로젝트 스터디에 적합한 공간",
                1,
                6,
                new BigDecimal("10000"),
                new BigDecimal("4.7"),
                "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80"
        ));
        studyRoomLocationRepository.save(new StudyRoomLocation(
                room2,
                new BigDecimal("37.500622"),
                new BigDecimal("127.036456")
        ));

        // 3. 코드 스페이스
        StudyRoom room3 = studyRoomRepository.save(new StudyRoom(
                "코드 스페이스",
                "서울 신논현",
                "개발자 스터디를 위한 집중 공간",
                1,
                10,
                new BigDecimal("15000"),
                new BigDecimal("4.9"),
                "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80"
        ));
        studyRoomLocationRepository.save(new StudyRoomLocation(
                room3,
                new BigDecimal("37.504583"),
                new BigDecimal("127.025012")
        ));

        // 4. 홍대 포커스룸
        StudyRoom room4 = studyRoomRepository.save(new StudyRoom(
                "홍대 포커스룸",
                "서울 마포구",
                "1인 몰입 학습에 적합한 소형 공간",
                1,
                2,
                new BigDecimal("7000"),
                new BigDecimal("4.7"),
                "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80"
        ));
        studyRoomLocationRepository.save(new StudyRoomLocation(
                room4,
                new BigDecimal("37.556342"),
                new BigDecimal("126.923211")
        ));

        // 5. 인천 스터디허브
        StudyRoom room5 = studyRoomRepository.save(new StudyRoom(
                "인천 스터디허브",
                "인천 부평구",
                "역 근처에 위치한 접근성 좋은 스터디룸",
                1,
                5,
                new BigDecimal("9000"),
                new BigDecimal("4.5"),
                "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80"
        ));
        studyRoomLocationRepository.save(new StudyRoomLocation(
                room5,
                new BigDecimal("37.507027"),
                new BigDecimal("126.721903")
        ));

        // 6. 판교 오피스룸
        StudyRoom room6 = studyRoomRepository.save(new StudyRoom(
                "판교 오피스룸",
                "경기 성남시 분당구",
                "IT 스터디와 회의에 어울리는 넓은 공간",
                1,
                12,
                new BigDecimal("18000"),
                new BigDecimal("4.6"),
                "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=900&q=80"
        ));
        studyRoomLocationRepository.save(new StudyRoomLocation(
                room6,
                new BigDecimal("37.394776"),
                new BigDecimal("127.111160")
        ));

        // 7. 수원 스퀘어룸
        StudyRoom room7 = studyRoomRepository.save(new StudyRoom(
                "수원 스퀘어룸",
                "경기 수원시 팔달구",
                "적당한 크기로 소규모 스터디에 알맞은 공간",
                1,
                4,
                new BigDecimal("8500"),
                new BigDecimal("4.6"),
                "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80"
        ));
        studyRoomLocationRepository.save(new StudyRoomLocation(
                room7,
                new BigDecimal("37.282745"),
                new BigDecimal("127.020042")
        ));

        // 8. 대전 테크허브
        StudyRoom room8 = studyRoomRepository.save(new StudyRoom(
                "대전 테크허브",
                "대전 유성구",
                "카이스트 인근의 이공계 스터디 특화 공간",
                1,
                8,
                new BigDecimal("10500"),
                new BigDecimal("4.3"),
                "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80"
        ));
        studyRoomLocationRepository.save(new StudyRoomLocation(
                room8,
                new BigDecimal("37.361421"),
                new BigDecimal("127.356412")
        ));

        // 9. 광주 크리에이티브룸
        StudyRoom room9 = studyRoomRepository.save(new StudyRoom(
                "광주 크리에이티브룸",
                "광주 서구",
                "디자인/기획 스터디에 어울리는 감각적인 공간",
                1,
                6,
                new BigDecimal("9500"),
                new BigDecimal("4.2"),
                "https://images.unsplash.com/photo-1497366811353-8f9f5f8b6f8b?auto=format&fit=crop&w=900&q=80"
        ));
        studyRoomLocationRepository.save(new StudyRoomLocation(
                room9,
                new BigDecimal("35.152814"),
                new BigDecimal("126.889547")
        ));

        // 10. 대구 스터디센터
        StudyRoom room10 = studyRoomRepository.save(new StudyRoom(
                "대구 스터디센터",
                "대구 수성구",
                "대형 스터디 그룹을 위한 넉넉한 공간",
                1,
                10,
                new BigDecimal("11500"),
                new BigDecimal("4.5"),
                "https://images.unsplash.com/photo-1524749292158-7540c2494485?auto=format&fit=crop&w=900&q=80"
        ));
        studyRoomLocationRepository.save(new StudyRoomLocation(
                room10,
                new BigDecimal("35.858431"),
                new BigDecimal("128.630851")
        ));

        // 11. 해운대 스터디카페
        StudyRoom room11 = studyRoomRepository.save(new StudyRoom(
                "해운대 스터디카페",
                "부산 해운대구",
                "바다 전망을 갖춘 여유로운 스터디 공간",
                1,
                6,
                new BigDecimal("11000"),
                new BigDecimal("4.4"),
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"
        ));
        studyRoomLocationRepository.save(new StudyRoomLocation(
                room11,
                new BigDecimal("35.158732"),
                new BigDecimal("129.160384")
        ));

        // 12. 제주 오션스터디
        StudyRoom room12 = studyRoomRepository.save(new StudyRoom(
                "제주 오션스터디",
                "제주 제주시",
                "여행 겸 워케이션으로 인기 있는 공간",
                1,
                4,
                new BigDecimal("13000"),
                new BigDecimal("4.9"),
                "https://images.unsplash.com/photo-1465156799763-2c087c332922?auto=format&fit=crop&w=900&q=80"
        ));
        studyRoomLocationRepository.save(new StudyRoomLocation(
                room12,
                new BigDecimal("33.499621"),
                new BigDecimal("126.531188")
        ));
    }

}
