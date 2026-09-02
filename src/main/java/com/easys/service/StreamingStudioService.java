package com.easys.service;

import com.easys.entity.StreamingStudio;
import com.easys.repository.StreamingStudioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StreamingStudioService {

    private final StreamingStudioRepository streamingStudioRepository;

    // 1. 방 생성 (방제 및 방 내용 DB 저장)
    @Transactional
    public StreamingStudio createRoom(StreamingStudio studio) {
        // 생성 시 초기 인원이 없거나 0 이하일 경우 기본 1명(방장)으로 설정
        if (studio.getViewers() <= 0) {
            studio.setViewers(1);
        }
        StreamingStudio saved = streamingStudioRepository.save(studio);
        System.out.println("🚀 [DB 스튜디오 생성 완료] 방제: " + saved.getTitle() + " | 내용: " + saved.getDescription());
        return saved;
    }

    // 2. 인원수 감소 및 0명일 때 자동 삭제 처리
    @Transactional
    public boolean decreaseViewer(Long id) {
        StreamingStudio studio = streamingStudioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 스트리밍 방입니다. ID: " + id));

        int currentViewers = studio.getViewers() - 1;

        if (currentViewers <= 0) {
            // 인원수가 0명 이하가 되면 DB에서 완전 삭제
            streamingStudioRepository.delete(studio);
            System.out.println("🗑️ [방 자동 삭제] 인원이 0명이 되어 ID(" + id + ") 방이 DB에서 삭제되었습니다.");
            return true; // 삭제됨
        } else {
            // 남은 인원수 업데이트
            studio.setViewers(currentViewers);
            streamingStudioRepository.save(studio);
            System.out.println("👥 [시청자 감소] ID(" + id + ") 남은 인원: " + currentViewers);
            return false; // 유지됨
        }
    }

    // StreamingStudioService.java 에 추가
    @Transactional
    public void deleteRoomDirectly(Long id) {
        if (streamingStudioRepository.existsById(id)) {
            streamingStudioRepository.deleteById(id);
            System.out.println("🗑️ [DB 방 강제 삭제 완료] ID: " + id);
        }
    }
}