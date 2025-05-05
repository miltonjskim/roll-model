package com.ccc.roll_model.project.infrastructure.repository;

import com.ccc.roll_model.project.infrastructure.entity.ProjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRepository extends JpaRepository<ProjectEntity, Integer> {

    public ProjectEntity save(ProjectEntity projectEntity);
}
