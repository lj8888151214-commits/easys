package com.easys.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.profile-image-dir:uploads/profile-images}")
    private String profileImageDirectory;


    @Override
    public void addResourceHandlers(
            ResourceHandlerRegistry registry
    ) {

        // 프로필 이미지 경로
        String profileLocation =
                Paths.get(profileImageDirectory)
                        .toAbsolutePath()
                        .normalize()
                        .toUri()
                        .toString();


        registry
                .addResourceHandler("/profile-images/**")
                .addResourceLocations(profileLocation);


        // 커뮤니티 이미지 경로
        String communityLocation =
                Paths.get("uploads/community/")
                        .toAbsolutePath()
                        .normalize()
                        .toUri()
                        .toString();


        registry
                .addResourceHandler("/uploads/community/**")
                .addResourceLocations(communityLocation);
    }
}