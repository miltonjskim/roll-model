package com.ccc.roll_model.pipeline.ui.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 모델링 평가 Response 공통 필드 Response
 */
@Getter
@NoArgsConstructor
public abstract class GetModelAndMetricResponse {

    private ProjectInfo projectInfo;
    private String algorithm;
    private List<ModelParameters> modelParameters;
    private List<Map<String, String>> targetInfo;
    private List<PerformanceMetric> performanceMetrics;
    private List<FeatureImportance> featureImportance;

    public GetModelAndMetricResponse(ProjectInfo projectInfo,String algorithm, List<ModelParameters> modelParameters,
                                     List<Map<String, String>> targetInfo, List<PerformanceMetric> performanceMetrics,
                           List<FeatureImportance> featureImportance) {
        this.projectInfo = projectInfo;
        this.algorithm = algorithm;
        this.modelParameters = modelParameters;
        this.targetInfo = targetInfo;
        this.performanceMetrics = performanceMetrics;
        this.featureImportance = featureImportance;
    }


    @Getter
    @NoArgsConstructor
    public static class ProjectInfo {
        private String title;
        private String category;
        private String domain;
        private String version;
        private boolean projectPublicYn;
        private boolean pipelinePublicYn;
        private boolean ownerYn;

        @Builder
        public ProjectInfo(String title, String category, String domain, String version,
                           boolean projectPublicYn, boolean pipelinePublicYn, boolean ownerYn) {
            this.title = title;
            this.category = category;
            this.domain = domain;
            this.version = version;
            this.projectPublicYn = projectPublicYn;
            this.pipelinePublicYn = pipelinePublicYn;
            this.ownerYn = ownerYn;
        }
    }

    @Getter
    @NoArgsConstructor
    public static class ModelParameters {
        private String parameterName;
        private String parameterValue;
        private String parameterKey;

        @Builder
        public ModelParameters(String parameterName, String parameterValue, String parameterKey) {
            this.parameterName = parameterName;
            this.parameterValue = parameterValue;
            this.parameterKey = parameterKey;
        }
    }


    @Getter
    @NoArgsConstructor
    public static class PerformanceMetric {
        private String metricName;
        private String metricValue;
        private String metricDesc;
        private String metricKey;

        @Builder
        public PerformanceMetric(String metricName, String metricValue, String metricDesc, String metricKey) {
            this.metricName = metricName;
            this.metricValue = metricValue;
            this.metricDesc = metricDesc;
            this.metricKey = metricKey;
        }
    }

    @Getter
    @NoArgsConstructor
    public static class FeatureImportance {
        private String featureName;
        private String importanceValue;
        private String importanceKey;

        @Builder
        public FeatureImportance(String featureName, String importanceValue, String importanceKey) {
            this.featureName = featureName;
            this.importanceValue = importanceValue;
            this.importanceKey = importanceKey;
        }
    }
}