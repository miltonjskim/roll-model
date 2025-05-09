package com.ccc.roll_model.pipeline.ui.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 모델링 평가 응답 중 분류 모델 Response
 */
@Getter
@NoArgsConstructor
public class ClassificationResponse extends GetModelAndMetricResponse {
    private ConfusionMatrix confusionMatrix;

    @Builder(builderMethodName = "classificationBuilder")
    public ClassificationResponse(ProjectInfo projectInfo, String algorithm,
                                  List<ModelParameters> modelParameters, List<Map<String, String>> targetInfo,
                                  List<PerformanceMetric> performanceMetrics,ConfusionMatrix confusionMatrix,
                                  List<FeatureImportance> featureImportance) {
        super(projectInfo, algorithm, modelParameters, targetInfo, performanceMetrics, featureImportance);
        this.confusionMatrix = confusionMatrix;
    }
    @Getter
    @NoArgsConstructor
    public static class ConfusionMatrix {
        private List<String> labels;             // 실제 클래스 이름 리스트
        private List<List<Integer>> matrixData;  // 2D 혼동 행렬

        @Builder
        public ConfusionMatrix(List<String> labels, List<List<Integer>> matrixData) {
            this.labels = labels;
            this.matrixData = matrixData;
        }
    }


}
