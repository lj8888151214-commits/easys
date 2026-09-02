package com.easys.service;

import com.easys.dto.StudyRoomAdminRequestDto;
import com.easys.dto.StudyRoomAdminResponseDto;
import com.easys.dto.StudyRoomDeleteResultDto;
import com.easys.dto.StudyRoomResponseDto;
import com.easys.entity.StudyRoom;
import com.easys.entity.StudyRoomStatus;
import com.easys.repository.ReservationRepository;
import com.easys.repository.StudyRoomRepository;
import com.easys.repository.StudyRoomReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudyRoomService {

    private final StudyRoomRepository studyRoomRepository;
    private final ReservationRepository reservationRepository;
    private final StudyRoomReviewRepository studyRoomReviewRepository;

    // 운영 중인 스터디룸 전체 조회
    public List<StudyRoomResponseDto> getStudyRooms() {

        return studyRoomRepository
                .findByStatusOrderByNameAsc(StudyRoomStatus.ACTIVE)
                .stream()
                .map(StudyRoomResponseDto::from)
                .toList();
    }
    // 스터디룸 상세 조회
    public StudyRoomResponseDto getStudyRoom(Long roomId) {

        StudyRoom studyRoom = studyRoomRepository.findById(roomId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "존재하지 않는 스터디룸입니다."
                        )
                );

        if (studyRoom.getStatus() != StudyRoomStatus.ACTIVE) {
            throw new IllegalArgumentException(
                    "현재 예약할 수 없는 스터디룸입니다."
            );
        }
        return StudyRoomResponseDto.from(studyRoom);
    }

    // 스터디룸 검색
    public List<StudyRoomResponseDto> searchStudyRooms(
            String keyword
    ) {

        if (keyword == null || keyword.isBlank()) {
            return getStudyRooms();
        }

        return studyRoomRepository
                .findByStatusAndNameContainingIgnoreCaseOrStatusAndLocationContainingIgnoreCase(
                        StudyRoomStatus.ACTIVE,
                        keyword,
                        StudyRoomStatus.ACTIVE,
                        keyword
                )
                .stream()
                .map(StudyRoomResponseDto::from)
                .toList();
    }

    // =====================================================
    // 관리자 기능
    // =====================================================

    // 전체 스터디룸 조회 (운영 중지 포함)
    public List<StudyRoomAdminResponseDto> getStudyRoomsForAdmin() {

        return studyRoomRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(StudyRoomAdminResponseDto::from)
                .toList();
    }

    // 스터디룸 등록
    @Transactional
    public StudyRoomAdminResponseDto createStudyRoom(
            StudyRoomAdminRequestDto request
    ) {

        validateRequest(request);

        StudyRoom studyRoom = new StudyRoom(
                request.name(),
                request.location(),
                request.description(),
                request.minCapacity(),
                request.maxCapacity(),
                request.pricePerHour(),
                null,
                request.imageUrl(),
                normalizeOwnerEmail(request.ownerEmail())
        );

        return StudyRoomAdminResponseDto.from(
                studyRoomRepository.save(studyRoom)
        );
    }

    // 스터디룸 수정
    @Transactional
    public StudyRoomAdminResponseDto updateStudyRoom(
            Long roomId,
            StudyRoomAdminRequestDto request
    ) {

        validateRequest(request);

        StudyRoom studyRoom = findStudyRoomForAdmin(roomId);

        studyRoom.update(
                request.name(),
                request.location(),
                request.description(),
                request.minCapacity(),
                request.maxCapacity(),
                request.pricePerHour(),
                studyRoom.getRating(),
                request.imageUrl(),
                normalizeOwnerEmail(request.ownerEmail())
        );

        return StudyRoomAdminResponseDto.from(studyRoom);
    }

    // 스터디룸 삭제
    //
    // 예약/리뷰 이력이 하나도 없는 스터디룸은 DB에서 완전히 삭제한다.
    // 이미 예약이나 리뷰가 남아있는 스터디룸은 그 기록들이 FK로 이 스터디룸을
    // 참조하고 있어 완전히 지우면 안 되므로, 기존처럼 운영 중지(INACTIVE)
    // 처리만 한다.
    @Transactional
    public StudyRoomDeleteResultDto deleteStudyRoomByAdmin(Long roomId) {

        StudyRoom studyRoom = findStudyRoomForAdmin(roomId);

        boolean hasHistory = reservationRepository.existsByStudyRoom(studyRoom)
                || studyRoomReviewRepository.existsByStudyRoom(studyRoom);

        if (hasHistory) {
            studyRoom.deactivate();
            return new StudyRoomDeleteResultDto(false, StudyRoomAdminResponseDto.from(studyRoom));
        }

        studyRoomRepository.delete(studyRoom);
        return new StudyRoomDeleteResultDto(true, null);
    }

    // 스터디룸 운영 재개
    @Transactional
    public StudyRoomAdminResponseDto activateStudyRoomByAdmin(Long roomId) {

        StudyRoom studyRoom = findStudyRoomForAdmin(roomId);
        studyRoom.activate();

        return StudyRoomAdminResponseDto.from(studyRoom);
    }

    private String normalizeOwnerEmail(String ownerEmail) {
        return (ownerEmail == null || ownerEmail.isBlank()) ? null : ownerEmail.trim();
    }

    private void validateRequest(StudyRoomAdminRequestDto request) {

        if (request.name() == null || request.name().isBlank()) {
            throw new IllegalArgumentException("스터디룸 이름을 입력해주세요.");
        }

        if (request.location() == null || request.location().isBlank()) {
            throw new IllegalArgumentException("위치를 입력해주세요.");
        }

        if (request.minCapacity() < 1) {
            throw new IllegalArgumentException("최소 인원은 1명 이상이어야 합니다.");
        }

        if (request.maxCapacity() < request.minCapacity()) {
            throw new IllegalArgumentException("최대 인원은 최소 인원보다 크거나 같아야 합니다.");
        }

        if (request.pricePerHour() == null
                || request.pricePerHour().signum() < 0) {
            throw new IllegalArgumentException("시간당 가격을 올바르게 입력해주세요.");
        }
    }

    private StudyRoom findStudyRoomForAdmin(Long roomId) {

        return studyRoomRepository.findById(roomId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "존재하지 않는 스터디룸입니다."
                        )
                );
    }
}
