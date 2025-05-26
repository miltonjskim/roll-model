package com.ccc.roll_model.like.infrastructure.repository.mysql;

import com.ccc.roll_model.like.infrastructure.entity.PipelineLikeEntity;
import com.ccc.roll_model.member.infrastructure.MemberEntity;
import com.ccc.roll_model.project.infrastructure.entity.mysql.PipelineEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PipelineLikeRepository extends JpaRepository<PipelineLikeEntity, Long> {
    Optional<PipelineLikeEntity> findByPipelineEntityAndMemberEntity(PipelineEntity pipelineEntity, MemberEntity memberEntity);
    boolean existsByPipelineEntityAndMemberEntity(PipelineEntity pipelineEntity, MemberEntity memberEntity);

    @Query("SELECT CASE WHEN COUNT(pl) > 0 THEN true ELSE false END FROM PipelineLikeEntity pl " +
            "WHERE pl.memberEntity.memberId = :memberId AND pl.pipelineEntity.pipelineId = :pipelineId")
    boolean existsByMemberEntityMemberIdAndPipelineEntityPipelineId(
            @Param("memberId") Integer memberId,
            @Param("pipelineId") String pipelineId);

}