package com.ccc.roll_model.project.ui.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class GetOpensourceResponse {

    private int currentPage;
    private int totalPages;
    private int totalElements;
    private boolean last;
    private List<Project> projects;

    @Getter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class Project {
        private String id;
        private String version;
        private String title;
        private int writerId;
        private String writerNickname;
        private String category;
        private String status;
        private String domain;
        private Double accuracy;
        private Double rSquared;
        private String target;
        private int dataCount;
        private int runningDuration;
        private int likeCount;
        private int downloadCount;
        private boolean likeYn;
        private String createdAt;
        private String updatedAt;
    }
}
