package com.ccc.roll_model.project.ui.response;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
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

        @JsonProperty("rSquared")
        private Double rSquared;
        // 이 필드는 Jackson이 자동 생성하는 필드를 무시하도록 함
        @JsonIgnore
        public Double getRsquared() {
            return rSquared;
        }

        private Integer dataCount;
        private String target;
        private Double runningDuration;
        private Integer likeCount;
        private Integer downloadCount;

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime updatedAt;

        private boolean ownerYn;
    }
}