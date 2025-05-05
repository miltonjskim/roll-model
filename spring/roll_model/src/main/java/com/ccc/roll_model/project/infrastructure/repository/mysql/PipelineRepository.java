package com.ccc.roll_model.project.infrastructure.repository.mysql;

import com.ccc.roll_model.project.infrastructure.entity.mysql.PipelineEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PipelineRepository extends JpaRepository<PipelineEntity, String> {

    // 특정 프로젝트의 모든 파이프라인 중 가장 최신 파이프라인 가져오기
    @Query("SELECT p FROM PipelineEntity p WHERE p.projectEntity.projectId = :projectId ORDER BY p.registeredAt DESC")
    Optional<PipelineEntity> findFirstByProjectIdOrderByRegisteredAtDesc(@Param("projectId") Integer projectId);

    // 특정 프로젝트의 파이프라인 개수 가져오기
    @Query("SELECT COUNT(p) FROM PipelineEntity p WHERE p.projectEntity.projectId = :projectId")
    Integer countByProjectId(@Param("projectId") Integer projectId);

    // 특정 프로젝트의 공개된 파이프라인 중 가장 최신 파이프라인 가져오기
    @Query("SELECT p FROM PipelineEntity p WHERE p.projectEntity.projectId = :projectId AND p.publicYn = true ORDER BY p.registeredAt DESC")
    Optional<PipelineEntity> findFirstPublicByProjectIdOrderByRegisteredAtDesc(@Param("projectId") Integer projectId);
}
