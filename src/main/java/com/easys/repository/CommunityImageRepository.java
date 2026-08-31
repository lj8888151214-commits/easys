package com.easys.repository;

import com.easys.entity.CommunityImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommunityImageRepository extends JpaRepository<CommunityImage, Long> {

    List<CommunityImage> findAllByCommunityPostId(Long postId);
}
