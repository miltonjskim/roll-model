package com.ccc.roll_model.project.ui.response;

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
        private Double rmse;
        private String target;
        private int dataCount;
        private int runningDuration;
        private int likeCount;
        private int downloadCount;
        private boolean publicYn;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}