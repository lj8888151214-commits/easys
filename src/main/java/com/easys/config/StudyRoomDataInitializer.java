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
import java.math.RoundingMode;
import java.util.List;
import java.util.Random;

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
            // 예약/리뷰가 이미 있으면 더미 스터디룸을 갈아엎지는 않지만,
            // 지도 기능이 나중에 추가된 것이라 좌표가 없는 기존 스터디룸이
            // 있을 수 있으므로 그 부분만 채워준다.
            backfillMissingLocations();
            return;
        }

        studyRoomLocationRepository.deleteAll();
        studyRoomRepository.deleteAll();

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

    /*
     * 좌표가 없는 기존 스터디룸에 대략적인 지역 중심 좌표를 채워 넣는다.
     * 실제 주소 기반 정확한 좌표가 아니라, 지도에 표시/길찾기 데모가
     * 가능하도록 하는 임시(더미) 좌표다.
     */
    private void backfillMissingLocations() {

        List<StudyRoom> rooms = studyRoomRepository.findAll();
        Random random = new Random();

        for (StudyRoom room : rooms) {

            if (studyRoomLocationRepository.existsByStudyRoomId(room.getId())) {
                continue;
            }

            double[] center = resolveRegionCenter(room.getLocation());

            // 같은 지역 안에서도 마커가 겹치지 않도록 약간의 오차를 준다
            double latitude = center[0] + (random.nextDouble() - 0.5) * 0.02;
            double longitude = center[1] + (random.nextDouble() - 0.5) * 0.02;

            studyRoomLocationRepository.save(new StudyRoomLocation(
                    room,
                    BigDecimal.valueOf(latitude).setScale(7, RoundingMode.HALF_UP),
                    BigDecimal.valueOf(longitude).setScale(7, RoundingMode.HALF_UP)
            ));
        }
    }

    // 스터디룸의 "location" 문자열(예: "서울 강남구")에 포함된 지역 키워드로
    // 대략적인 중심 좌표를 찾는다. 일치하는 키워드가 없으면 서울로 취급한다.
    private double[] resolveRegionCenter(String location) {

        if (location == null) {
            return new double[]{37.5665, 126.9780};
        }

        if (location.contains("인천")) return new double[]{37.4563, 126.7052};
        if (location.contains("부산")) return new double[]{35.1796, 129.0756};
        if (location.contains("대구")) return new double[]{35.8714, 128.6014};
        if (location.contains("광주")) return new double[]{35.1595, 126.8526};
        if (location.contains("대전")) return new double[]{36.3504, 127.3845};
        if (location.contains("울산")) return new double[]{35.5384, 129.3114};
        if (location.contains("세종")) return new double[]{36.4801, 127.2890};
        if (location.contains("제주")) return new double[]{33.4996, 126.5312};
        if (location.contains("강원")) return new double[]{37.8228, 128.1555};

        if (location.contains("경기") || location.contains("성남") || location.contains("수원")
                || location.contains("고양") || location.contains("용인") || location.contains("판교")) {
            return new double[]{37.4138, 127.5183};
        }

        if (location.contains("충청") || location.contains("충남") || location.contains("충북")
                || location.contains("청주")) {
            return new double[]{36.6357, 127.4917};
        }

        if (location.contains("전라") || location.contains("전남") || location.contains("전북")
                || location.contains("전주")) {
            return new double[]{35.7175, 127.1530};
        }

        if (location.contains("경상") || location.contains("경남") || location.contains("경북")) {
            return new double[]{36.4919, 128.8889};
        }

        // "서울 강남구", "서울 광진구"처럼 구 단위까지만 있는 경우 등 기본값
        return new double[]{37.5665, 126.9780};
    }
}
