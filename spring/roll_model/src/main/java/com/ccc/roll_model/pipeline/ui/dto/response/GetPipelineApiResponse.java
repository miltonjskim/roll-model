package com.ccc.roll_model.pipeline.ui.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GetPipelineApiResponse {
    private ProjectInfo projectInfo;
    private ApiStatus apiStatus;
    private Endpoint endpoint;
    private InputSchema inputSchema;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProjectInfo {
        private String title;
        private String category;
        private String domain;
        private String version;
        private Boolean projectPublicYn;
        private Boolean pipelinePublicYn;
        private Boolean ownerYn;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ApiStatus {
        private LocalDateTime expiresAt;
        private Double accuracy;

        @JsonProperty("rSquared")
        private Double rSquared;
        // 이 필드는 Jackson이 자동 생성하는 필드를 무시하도록 함
        @JsonIgnore
        public Double getRsquared() {
            return rSquared;
        }
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Endpoint {
        private String url;
        private String apiKey;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InputSchema {
        private List<Feature> features;

        @Getter
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        public static class Feature {
            private String name;
            private String type;
            private Boolean required;
            private Object example;
            private List<String> options;
        }
    }
}