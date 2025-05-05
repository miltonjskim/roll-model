package com.ccc.roll_model.like.infrastructure.repository;

import com.ccc.roll_model.like.infrastructure.entity.LikeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LikeRepository extends JpaRepository<LikeEntity, Integer> {

    @Query("SELECT CASE WHEN COUNT(l) > 0 THEN true ELSE false END FROM LikeEntity l WHERE l.memberEntity.memberId = :memberId AND l.pipelineEntity.pipelineId = :pipelineId")
    boolean existsByMemberEntityMemberIdAndPipelineEntityPipelineId(@Param("memberId") Integer memberId, @Param("pipelineId") String pipelineId);
}
