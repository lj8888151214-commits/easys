package com.easys.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class CommunityImageService {

    // 커뮤니티 이미지 저장 위치
    private final String uploadDir =
            "uploads/community/";


    // 이미지 저장
    public String saveImage(
            MultipartFile file
    ) {

        // 파일이 없는 경우
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(
                    "이미지 파일이 없습니다."
            );
        }


        // 이미지 파일인지 확인
        String contentType =
                file.getContentType();

        if (contentType == null ||
                !contentType.startsWith("image/")) {

            throw new IllegalArgumentException(
                    "이미지 파일만 업로드할 수 있습니다."
            );
        }


        try {

            // 업로드 폴더
            Path uploadPath =
                    Paths.get(uploadDir);


            // 폴더가 없으면 생성
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }


            // 원본 파일명
            String originalFileName =
                    file.getOriginalFilename();


            // 확장자
            String extension = "";

            if (originalFileName != null &&
                    originalFileName.contains(".")) {

                extension =
                        originalFileName.substring(
                                originalFileName.lastIndexOf(".")
                        );
            }


            // 중복 방지를 위한 UUID 파일명
            String savedFileName =
                    UUID.randomUUID() + extension;


            // 최종 저장 경로
            Path filePath =
                    uploadPath.resolve(savedFileName);


            // 실제 파일 저장
            Files.copy(
                    file.getInputStream(),
                    filePath
            );


            // DB에 저장할 이미지 경로
            return "/uploads/community/" +
                    savedFileName;

        } catch (IOException e) {

            throw new RuntimeException(
                    "이미지 저장에 실패했습니다.",
                    e
            );
        }
    }
}