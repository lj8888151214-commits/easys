package com.easys.service;

import com.easys.dto.StudyCreateDto;
import com.easys.dto.StudyResponseDto;
import com.easys.entity.Member;
import com.easys.entity.MemberRole;
import com.easys.entity.Reservation;
import com.easys.entity.ReservationStatus;
import com.easys.entity.Study;
import com.easys.repository.MemberRepository;
import com.easys.repository.ReservationRepository;
import com.easys.repository.StudyApplicationRepository;
import com.easys.repository.StudyChatMessageRepository;
import com.easys.repository.StudyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudyService {

    // 목록/검색에서 제외할 완료 상태 값 (Study.complete()가 세팅하는 값과 동일해야 한다)
    private static final String STATUS_COMPLETED = "COMPLETED";

    private final StudyRepository studyRepository;

    private final StudyApplicationRepository applicationRepository;

    private final ReservationRepository reservationRepository;

    private final StudyChatMessageRepository chatMessageRepository;

    private final MemberRepository memberRepository;


    // =====================================================
    // 스터디 생성
    // =====================================================

    @Transactional
    public StudyResponseDto createStudy(
            StudyCreateDto request,
            String email
    ) {

        if (request == null) {

            throw new IllegalArgumentException(
                    "스터디 정보를 입력해주세요."
            );
        }


        Member member =
                memberRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "회원을 찾을 수 없습니다."
                                )
                        );


        Study study =
                new Study(
                        request.getTitle(),
                        request.getContent(),
                        request.getCategory(),
                        request.getMaxMembers(),
                        member
                );


        Study savedStudy =
                studyRepository.save(study);


        return new StudyResponseDto(
                savedStudy
        );
    }


    // =====================================================
    // 스터디 전체 조회
    // =====================================================

    // includeCompleted=false(기본값)면 완료(COMPLETED) 스터디는 목록에서 제외한다.
    // 관리자 페이지(AdminStudySection)는 완료된 스터디도 관리해야 하므로
    // includeCompleted=true로 호출해 전체를 조회한다.
    @Transactional(readOnly = true)
    public List<StudyResponseDto> getStudies(boolean includeCompleted) {

        return studyRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(study -> includeCompleted || !STATUS_COMPLETED.equals(study.getStatus()))
                .map(StudyResponseDto::new)
                .toList();
    }


    // =====================================================
    // 스터디 상세 조회
    // =====================================================

    @Transactional(readOnly = true)
    public StudyResponseDto getStudy(
            Long id
    ) {

        Study study =
                studyRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "스터디를 찾을 수 없습니다."
                                )
                        );


        return new StudyResponseDto(
                study
        );
    }


    // =====================================================
    // 스터디 수정
    // =====================================================

    @Transactional
    public StudyResponseDto updateStudy(
            Long id,
            StudyCreateDto request,
            String email
    ) {

        if (request == null) {

            throw new IllegalArgumentException(
                    "스터디 정보를 입력해주세요."
            );
        }


        Study study =
                studyRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "스터디를 찾을 수 없습니다."
                                )
                        );


        // 작성자 확인
        checkOwner(
                study,
                email
        );


        study.update(
                request.getTitle(),
                request.getContent(),
                request.getCategory(),
                request.getMaxMembers()
        );


        return new StudyResponseDto(
                study
        );
    }


    // =====================================================
    // 스터디 삭제
    // =====================================================

    @Transactional
    public void deleteStudy(
            Long id,
            String email
    ) {

        Study study =
                studyRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "스터디를 찾을 수 없습니다."
                                )
                        );


        // 작성자 본인이거나 관리자만 삭제 가능
        checkOwnerOrAdmin(
                study,
                email
        );


        /*
         * 이 스터디를 위해 예약한 스터디룸 예약이 있는지 확인한다.
         *
         * 진행 중이거나(PENDING) 결제/승인이 완료된(PAID/CONFIRMED) 예약이
         * 남아있으면, 삭제의 부작용으로 그 예약이 함께 사라지거나 무효화되면
         * 안 되므로 스터디 삭제 자체를 막는다. 사용자가 먼저 예약을 정상
         * 취소(캘린더/결제 정리까지 되는 기존 취소 절차)해야 한다.
         */
        if (reservationRepository.existsByStudyAndStatusIn(
                study,
                List.of(
                        ReservationStatus.PENDING,
                        ReservationStatus.PAID,
                        ReservationStatus.CONFIRMED
                )
        )) {
            throw new IllegalArgumentException(
                    "진행 중이거나 결제/승인 완료된 예약이 있어 스터디를 삭제할 수 없습니다. 먼저 예약을 취소해주세요."
            );
        }

        /*
         * 여기까지 왔다면 이 스터디에 남아있는 예약은 전부 CANCELLED뿐이다.
         * 취소된 예약의 결제/이용 이력 자체는 그대로 보존하되, study_id
         * 참조만 끊어서 FK 제약(study_room_reservation.study_id → study.id)에
         * 걸리지 않게 한다.
         */
        reservationRepository.findByStudy(study)
                .forEach(Reservation::detachStudy);


        /*
         * StudyApplication이 Study를 참조하고 있으므로
         * 신청 정보를 먼저 삭제한다.
         */
        applicationRepository.deleteByStudyId(id);

        /*
         * StudyChatMessage도 Study를 (NOT NULL로) 참조하고 있으므로
         * 채팅 기록도 함께 삭제해야 FK 제약에 걸리지 않는다.
         */
        chatMessageRepository.deleteByStudyId(id);


        // 스터디 삭제
        studyRepository.delete(study);
    }


    // =====================================================
    // 스터디 완료 처리 (방장 전용)
    //
    // 스터디 카드 자체는 더 이상 날짜/시간 일정을 갖지 않으므로(스터디룸
    // 예약이 별도로 이루어진다), 방장은 시간 조건 없이 원하는 시점에 완료
    // 처리할 수 있다. 예약/결제/채팅/캘린더 데이터는 전혀 건드리지 않고
    // 상태만 COMPLETED로 바꾼다. 목록(getStudies/searchStudy)에서 COMPLETED
    // 상태를 제외하는 방식으로 "진행 중 스터디 목록"에서만 사라지게 한다.
    // =====================================================

    @Transactional
    public StudyResponseDto completeStudy(
            Long id,
            String email
    ) {

        Study study =
                studyRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "스터디를 찾을 수 없습니다."
                                )
                        );

        // 반드시 방장 본인만 완료 처리할 수 있다 (프론트 버튼 숨김과 별개로 서버에서도 검증)
        if (!study.getMember().getEmail().equals(email)) {
            throw new IllegalArgumentException(
                    "스터디 방장만 완료 처리할 수 있습니다."
            );
        }

        study.complete();

        return new StudyResponseDto(
                study
        );
    }


    // =====================================================
    // 스터디 검색
    // =====================================================

    @Transactional(readOnly = true)
    public List<StudyResponseDto> searchStudy(
            String keyword,
            String category
    ) {

        boolean hasKeyword =
                keyword != null &&
                        !keyword.isBlank();


        boolean hasCategory =
                category != null &&
                        !category.isBlank();


        List<Study> studies;


        // 검색 조건 없음
        if (!hasKeyword && !hasCategory) {

            studies =
                    studyRepository
                            .findAllByOrderByCreatedAtDesc();
        }


        // 제목 검색
        else if (hasKeyword && !hasCategory) {

            studies =
                    studyRepository
                            .findByTitleContainingIgnoreCase(
                                    keyword.trim()
                            );
        }


        // 카테고리 검색
        else if (!hasKeyword && hasCategory) {

            studies =
                    studyRepository
                            .findByCategory(
                                    category.trim()
                            );
        }


        // 제목 + 카테고리 검색
        else {

            studies =
                    studyRepository
                            .findByTitleContainingIgnoreCaseAndCategory(
                                    keyword.trim(),
                                    category.trim()
                            );
        }


        return studies
                .stream()
                .filter(study -> !STATUS_COMPLETED.equals(study.getStatus()))
                .map(StudyResponseDto::new)
                .toList();
    }


    // =====================================================
    // 작성자 확인
    // =====================================================

    private void checkOwner(
            Study study,
            String email
    ) {

        if (!study.getMember()
                .getEmail()
                .equals(email)) {

            throw new IllegalArgumentException(
                    "스터디 작성자만 수정하거나 삭제할 수 있습니다."
            );
        }
    }


    // 삭제 전용: 작성자 본인이거나 관리자면 통과
    private void checkOwnerOrAdmin(
            Study study,
            String email
    ) {

        if (study.getMember().getEmail().equals(email)) {
            return;
        }

        Member requester =
                memberRepository.findByEmail(email)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "회원을 찾을 수 없습니다."
                                )
                        );

        if (requester.getRole() != MemberRole.ADMIN) {

            throw new IllegalArgumentException(
                    "스터디 작성자만 수정하거나 삭제할 수 있습니다."
            );
        }
    }
}