package com.ccc.roll_model.project.infrastructure.repository.mysql;

import com.ccc.roll_model.project.infrastructure.entity.mysql.PipelineEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PipelineRepository extends JpaRepository<PipelineEntity, String> {

    // 특정 프로젝트의 모든 파이프라인 중 가장 최신 파이프라인 가져오기
    @Query("SELECT p FROM PipelineEntity p WHERE p.projectEntity.projectId = :projectId ORDER BY p.registeredAt DESC")
    Optional<PipelineEntity> findFirstByProjectIdOrderByRegisteredAtDesc(@Param("projectId") Integer projectId);

    // 특정 프로젝트의 삭제되지 않은 파이프라인 중 가장 최신 파이프라인 가져오기
    @Query("SELECT p FROM PipelineEntity p WHERE p.projectEntity.projectId = :projectId AND p.deletedYn = false ORDER BY p.registeredAt DESC limit 1")
    Optional<PipelineEntity> findFirstByProjectIdOrderByRegisteredAtDescAndNotDeletedYn(@Param("projectId") Integer projectId);

    // 특정 프로젝트의 삭제되지 않은 상태가 COMPLETED면서 publicYn이 true인 파이프라인 중 가장 최신 파이프라인 가져오기
    @Query(value = "SELECT * FROM pipelines p WHERE p.project_id IN (SELECT project_id FROM projects WHERE project_id = :projectId) AND p.deleted_yn = false AND p.status = 'COMPLETED' AND p.public_yn = true ORDER BY p.registered_at DESC LIMIT 1",
            nativeQuery = true)
    List<PipelineEntity> findFirstCompletedPublicPipeline(@Param("projectId") Integer projectId);

    // 특정 프로젝트의 파이프라인 개수 가져오기
    @Query("SELECT COUNT(p) FROM PipelineEntity p WHERE p.projectEntity.projectId = :projectId")
    Integer countByProjectId(@Param("projectId") Integer projectId);

    // 특정 프로젝트의 공개된 파이프라인 중 가장 최신 파이프라인 가져오기
    @Query("SELECT p FROM PipelineEntity p WHERE p.projectEntity.projectId = :projectId AND p.publicYn = true ORDER BY p.registeredAt DESC")
    Optional<PipelineEntity> findFirstPublicByProjectIdOrderByRegisteredAtDesc(@Param("projectId") Integer projectId);

    // 파이프라인의 deletedYn 필드를 true로 설정
    @Modifying
    @Query("UPDATE PipelineEntity p SET p.deletedYn = true WHERE p.pipelineId = :pipelineId")
    void markAsDeleted(@Param("pipelineId") String pipelineId);

    // 파이프라인 ID와 프로젝트 소유자 ID로 파이프라인 조회
    @Query("SELECT p FROM PipelineEntity p WHERE p.pipelineId = :pipelineId AND p.projectEntity.memberEntity.memberId = :memberId")
    Optional<PipelineEntity> findByPipelineIdAndProjectMemberId(@Param("pipelineId") String pipelineId, @Param("memberId") Integer memberId);

    Optional<PipelineEntity> findByPipelineId(String pipelineId);
}
