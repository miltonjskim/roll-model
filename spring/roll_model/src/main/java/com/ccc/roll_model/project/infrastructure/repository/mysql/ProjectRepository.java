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

    // 새로운 메소드: 공개 프로젝트 중 완료된 공개 파이프라인이 있는 프로젝트만 조회 (기본)
    @Query("SELECT DISTINCT p FROM ProjectEntity p " +
            "JOIN PipelineEntity pl ON pl.projectEntity.projectId = p.projectId " +
            "WHERE p.publicYn = true AND p.deletedYn = false " +
            "AND pl.publicYn = true AND pl.deletedYn = false AND pl.status = 'COMPLETED'")
    Page<ProjectEntity> findAllPublicProjectsWithCompletedPublicPipelines(Pageable pageable);

    // 키워드 검색
    @Query("SELECT DISTINCT p FROM ProjectEntity p " +
            "JOIN PipelineEntity pl ON pl.projectEntity.projectId = p.projectId " +
            "WHERE p.publicYn = true AND p.deletedYn = false " +
            "AND pl.publicYn = true AND pl.deletedYn = false AND pl.status = 'COMPLETED' " +
            "AND p.title LIKE %:keyword%")
    Page<ProjectEntity> findAllPublicProjectsWithCompletedPublicPipelinesByKeyword(
            @Param("keyword") String keyword, Pageable pageable);

    // 카테고리 검색
    @Query("SELECT DISTINCT p FROM ProjectEntity p " +
            "JOIN PipelineEntity pl ON pl.projectEntity.projectId = p.projectId " +
            "WHERE p.publicYn = true AND p.deletedYn = false " +
            "AND pl.publicYn = true AND pl.deletedYn = false AND pl.status = 'COMPLETED' " +
            "AND p.category = :category")
    Page<ProjectEntity> findAllPublicProjectsWithCompletedPublicPipelinesByCategory(
            @Param("category") Category category, Pageable pageable);

    // 도메인 검색
    @Query("SELECT DISTINCT p FROM ProjectEntity p " +
            "JOIN PipelineEntity pl ON pl.projectEntity.projectId = p.projectId " +
            "WHERE p.publicYn = true AND p.deletedYn = false " +
            "AND pl.publicYn = true AND pl.deletedYn = false AND pl.status = 'COMPLETED' " +
            "AND p.domain = :domain")
    Page<ProjectEntity> findAllPublicProjectsWithCompletedPublicPipelinesByDomain(
            @Param("domain") Domain domain, Pageable pageable);

    // 키워드와 카테고리 검색
    @Query("SELECT DISTINCT p FROM ProjectEntity p " +
            "JOIN PipelineEntity pl ON pl.projectEntity.projectId = p.projectId " +
            "WHERE p.publicYn = true AND p.deletedYn = false " +
            "AND pl.publicYn = true AND pl.deletedYn = false AND pl.status = 'COMPLETED' " +
            "AND p.title LIKE %:keyword% AND p.category = :category")
    Page<ProjectEntity> findAllPublicProjectsWithCompletedPublicPipelinesByKeywordAndCategory(
            @Param("keyword") String keyword, @Param("category") Category category, Pageable pageable);

    // 키워드와 도메인 검색
    @Query("SELECT DISTINCT p FROM ProjectEntity p " +
            "JOIN PipelineEntity pl ON pl.projectEntity.projectId = p.projectId " +
            "WHERE p.publicYn = true AND p.deletedYn = false " +
            "AND pl.publicYn = true AND pl.deletedYn = false AND pl.status = 'COMPLETED' " +
            "AND p.title LIKE %:keyword% AND p.domain = :domain")
    Page<ProjectEntity> findAllPublicProjectsWithCompletedPublicPipelinesByKeywordAndDomain(
            @Param("keyword") String keyword, @Param("domain") Domain domain, Pageable pageable);

    // 카테고리와 도메인 검색
    @Query("SELECT DISTINCT p FROM ProjectEntity p " +
            "JOIN PipelineEntity pl ON pl.projectEntity.projectId = p.projectId " +
            "WHERE p.publicYn = true AND p.deletedYn = false " +
            "AND pl.publicYn = true AND pl.deletedYn = false AND pl.status = 'COMPLETED' " +
            "AND p.category = :category AND p.domain = :domain")
    Page<ProjectEntity> findAllPublicProjectsWithCompletedPublicPipelinesByCategoryAndDomain(
            @Param("category") Category category, @Param("domain") Domain domain, Pageable pageable);

    // 키워드, 카테고리, 도메인 검색
    @Query("SELECT DISTINCT p FROM ProjectEntity p " +
            "JOIN PipelineEntity pl ON pl.projectEntity.projectId = p.projectId " +
            "WHERE p.publicYn = true AND p.deletedYn = false " +
            "AND pl.publicYn = true AND pl.deletedYn = false AND pl.status = 'COMPLETED' " +
            "AND p.title LIKE %:keyword% AND p.category = :category AND p.domain = :domain")
    Page<ProjectEntity> findAllPublicProjectsWithCompletedPublicPipelinesByKeywordAndCategoryAndDomain(
            @Param("keyword") String keyword, @Param("category") Category category,
            @Param("domain") Domain domain, Pageable pageable);
}