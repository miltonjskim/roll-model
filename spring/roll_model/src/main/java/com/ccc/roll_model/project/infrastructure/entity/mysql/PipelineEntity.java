package com.ccc.roll_model.project.infrastructure.entity.mysql;

import com.ccc.roll_model.global.entity.BaseCreatedAndUpdatedEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "pipelines")
@Getter
@NoArgsConstructor
@SuperBuilder
public class PipelineEntity extends BaseCreatedAndUpdatedEntity {

    @Id
    @Column(name = "pipeline_id")
    private String pipelineId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id")
    private ProjectEntity projectEntity;

    @Column(name = "public_yn", nullable = false)
    private Boolean publicYn = false;

    @Column(name = "like_count", nullable = false)
    private Integer likeCount = 0;

    @Column(name = "fork_count", nullable = false)
    private Integer forkCount = 0;

    @Column(name = "download_count", nullable = false)
    private Integer downloadCount = 0;

    @Column(name = "result")
    private Float result;

    @Column(name = "data_count")
    private Integer dataCount;

    @Column(name = "target_feature")
    private String targetFeature;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private Status status;

    @Column(name = "version")
    private Float version = 1.0f;

    @Column(name = "deleted_yn", nullable = false)
    private Boolean deletedYn = false;

    @Column(name = "parent_pipeline_id", nullable = false)
    private String parentPipelineId;

    // 프로젝트 ID를 얻음
    public Integer getProjectId() {
        return projectEntity != null ? projectEntity.getProjectId() : null;
    }

    public void updateVisibility(Boolean publicYn) {
        this.publicYn = publicYn;
    }
    public void updateStatus(Status status) {
        this.status = status;
    }

    // 좋아요 수 증가
    public void incrementLikeCount() {
        this.likeCount = this.likeCount != null ? this.likeCount + 1 : 1;
    }

    // 좋아요 수 감소
    public void decrementLikeCount() {
        if (this.likeCount != null && this.likeCount > 0) {
            this.likeCount -= 1;
        }
    }
}
