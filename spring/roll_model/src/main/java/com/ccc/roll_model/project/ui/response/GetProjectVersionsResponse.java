package com.ccc.roll_model.project.ui.response;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GetProjectVersionsResponse {
    private ProjectInfo projectInfo;
    private List<PipelineInfo> pipelines;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectInfo {
        private String title;
        private String category;
        private String domain;
        private String version;
        private boolean projectPublicYn;
        private boolean pipelinePublicYn;
        private boolean ownerYn;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PipelineInfo {
        private String pipelineId;
        private String version;
        private boolean publicYn;
        private boolean deletedYn;
        private String parent;
        private Double accuracy;
        private Double rSquared;
        private Integer dataCount;
        private String target;
        private Double runnungDuration;
        private Integer likeCount;
        private Integer downloadCount;
        private LocalDateTime updatedAt;
        private boolean ownerYn;
    }
}