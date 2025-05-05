package com.ccc.roll_model.project.infrastructure.repository.mysql;

import com.ccc.roll_model.project.infrastructure.entity.mysql.Category;
import com.ccc.roll_model.project.infrastructure.entity.mysql.Domain;
import com.ccc.roll_model.project.infrastructure.entity.mysql.ProjectEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<ProjectEntity, Integer> {

    // 특정 회원이 소유한 모든 프로젝트 조회
    @Query("SELECT p FROM ProjectEntity p JOIN FETCH p.memberEntity WHERE p.memberEntity.memberId = :memberId")
    List<ProjectEntity> findAllByMemberEntityMemberId(@Param("memberId") Integer memberId);

    // 공개된 프로젝트 조회 (페이징)
    @Query("SELECT p FROM ProjectEntity p WHERE p.publicYn = true AND p.deletedYn = false")
    Page<ProjectEntity> findAllPublicProjects(Pageable pageable);

    // 키워드로 공개된 프로젝트 검색 (페이징)
    @Query("SELECT p FROM ProjectEntity p WHERE p.publicYn = true AND p.deletedYn = false AND p.title LIKE %:keyword%")
    Page<ProjectEntity> findAllPublicProjectsByKeyword(@Param("keyword") String keyword, Pageable pageable);

    // 카테고리로 공개된 프로젝트 검색 (페이징)
    @Query("SELECT p FROM ProjectEntity p WHERE p.publicYn = true AND p.deletedYn = false AND p.category = :category")
    Page<ProjectEntity> findAllPublicProjectsByCategory(@Param("category") Category category, Pageable pageable);

    // 도메인으로 공개된 프로젝트 검색 (페이징)
    @Query("SELECT p FROM ProjectEntity p WHERE p.publicYn = true AND p.deletedYn = false AND p.domain = :domain")
    Page<ProjectEntity> findAllPublicProjectsByDomain(@Param("domain") Domain domain, Pageable pageable);

    // 키워드와 카테고리로 공개된 프로젝트 검색 (페이징)
    @Query("SELECT p FROM ProjectEntity p WHERE p.publicYn = true AND p.deletedYn = false AND p.title LIKE %:keyword% AND p.category = :category")
    Page<ProjectEntity> findAllPublicProjectsByKeywordAndCategory(@Param("keyword") String keyword, @Param("category") Category category, Pageable pageable);

    // 키워드와 도메인으로 공개된 프로젝트 검색 (페이징)
    @Query("SELECT p FROM ProjectEntity p WHERE p.publicYn = true AND p.deletedYn = false AND p.title LIKE %:keyword% AND p.domain = :domain")
    Page<ProjectEntity> findAllPublicProjectsByKeywordAndDomain(@Param("keyword") String keyword, @Param("domain") Domain domain, Pageable pageable);

    // 카테고리와 도메인으로 공개된 프로젝트 검색 (페이징)
    @Query("SELECT p FROM ProjectEntity p WHERE p.publicYn = true AND p.deletedYn = false AND p.category = :category AND p.domain = :domain")
    Page<ProjectEntity> findAllPublicProjectsByCategoryAndDomain(@Param("category") Category category, @Param("domain") Domain domain, Pageable pageable);

    // 키워드, 카테고리, 도메인으로 공개된 프로젝트 검색 (페이징)
    @Query("SELECT p FROM ProjectEntity p WHERE p.publicYn = true AND p.deletedYn = false AND p.title LIKE %:keyword% AND p.category = :category AND p.domain = :domain")
    Page<ProjectEntity> findAllPublicProjectsByKeywordAndCategoryAndDomain(@Param("keyword") String keyword, @Param("category") Category category, @Param("domain") Domain domain, Pageable pageable);
}
