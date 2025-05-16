package com.ccc.roll_model.project.ui.response;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class GetMyProjectResponse {

    private Summary summary;
    private List<Project> projects;

    @Getter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class Summary {
        private int totalProjects;
        private int completedProjectCount;
        private int inProgressProjectCount;
        private int publicProjectCount;
    }

    @Getter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class Project {
        private String id;
        private String version;
        private String title;
        private String category;
        private String status;
        private String domain;
        private Double accuracy;
        @JsonProperty("rSquared")
        private Double rSquared;
        @JsonIgnore
        public Double getRsquared() {
            return this.rSquared = rSquared;
        }
        private String target;
        private int dataCount;
        private Double runningDuration;
        private int likeCount;
        private int downloadCount;
        private boolean publicYn;
        private String createdAt;
        private String updatedAt;
    }
}