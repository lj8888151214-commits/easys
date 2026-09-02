package com.easys.dto;

// 관리자 스터디룸 삭제 결과.
//
// deleted=true  : 예약/리뷰 이력이 전혀 없어 DB에서 완전히 삭제됨 (room은 null)
// deleted=false : 예약/리뷰 이력이 있어 삭제 대신 운영 중지(INACTIVE) 처리됨 (room에 갱신된 정보)
public record StudyRoomDeleteResultDto(
        boolean deleted,
        StudyRoomAdminResponseDto room
) {
}
