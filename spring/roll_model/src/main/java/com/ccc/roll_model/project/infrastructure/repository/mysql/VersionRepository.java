package com.ccc.roll_model.project.infrastructure.repository.mysql;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.ccc.roll_model.project.infrastructure.entity.mysql.VersionEntity;

@Repository
public interface VersionRepository extends JpaRepository<VersionEntity, Integer> {

	@Query("SELECT v FROM PipelineEntity p " +
	"JOIN VersionEntity v ON p.parentPipelineId = v.pipelineId " +
	"WHERE p.pipelineId = :pipelineId")
	VersionEntity findParentVersionByPipelineId(@Param("pipelineId") String pipelineId);

	@Query("SELECT MAX(v.groupId) FROM VersionEntity v")
	Optional<Integer> findHighestGroupId();

	List<VersionEntity> findVersionEntitiesByGroupId(Integer groupId);

	VersionEntity findByPipelineId(String pipelineId);
}
