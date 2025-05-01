package com.ccc.roll_model.project.infrastructure.repository.mysql;

import com.ccc.roll_model.project.infrastructure.entity.mysql.PipelineEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PipelineRepository extends JpaRepository<PipelineEntity, String> {

    // 특정 프로젝트의 모든 파이프라인 중 가장 최신 파이프라인 가져오기
    PipelineEntity findFirstByProjectEntityProjectIdOrderByRegisteredAtDesc(Integer projectId);
}
