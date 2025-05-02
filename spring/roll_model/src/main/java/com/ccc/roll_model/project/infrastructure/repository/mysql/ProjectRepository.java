package com.ccc.roll_model.project.infrastructure.repository.mysql;

import com.ccc.roll_model.project.infrastructure.entity.mysql.ProjectEntity;
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
}
