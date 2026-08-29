package com.easys.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MentoringReservationRejectDto {

    // 거절 사유 (선택 입력)
    private String reason;
}
