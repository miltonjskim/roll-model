package com.ccc.roll_model.project.infrastructure.entity.mongo;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "models")
public class ModelDocument {

    @Id
    private ObjectId id; // 모델 고유 식별자

    @Field("pipeline_id")
    private String pipelineId; // 학습에 사용된 파이프라인 ID

    @Field("project_id")
    private Integer projectId; // 소속 프로젝트 ID (정수)

    @Field("member_id")
    private Integer memberId; // 모델 등록한 회원 ID

    @Field("model_title")
    private String modelTitle; // 모델 이름

    @Field("model_description")
    private String modelDescription; // 모델 설명

    @Field("model_type")
    private String modelType; // CLASSIFICATION, REGRESSION 등 (모델 유형)
    private String algorithm; // 알고리즘 (예: RANDOM_FOREST 등)

    @JsonTypeInfo(use = JsonTypeInfo.Id.CLASS, property = "@class")
    private ModelParameter parameters; // 모델의 매개변수
    @Field("train_info")
    private TrainInfo trainInfo; // 학습 정보
    private Performance performance; // 성능 정보

    @Field("feature_importance")
    private Map<String, Double> featureImportance; // 각 특성 중요도

    @Field("learning_duration")
    private Double learningDuration; // 학습 소요 시간 (초 단위)
    @Field("model_file_path")
    private String modelFilePath; // 모델 파일 저장 경로
    @Field("api_endpoint")
    private String apiEndpoint; // API 엔드포인트
    @Field("api_key")
    private ApiKey apiKey; // API 키
    @Field("registered_at")
    private LocalDateTime registeredAt; // 생성(등록) 시간

    @Field("error_message")
    private String errorMessage; // 모델 학습 실패 시 에러 메시지

    // ------ 중첩 클래스 정의 ------
    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class TrainInfo {
        @Field("start_time")
        private LocalDateTime startTime; // 학습 시작 시간

        @Field("end_time")
        private LocalDateTime endTime; // 학습 종료 시간
        private Integer epochs; // 에포크 수

        private List<Feature> features; // 특성 정보

        @Field("target_feature")
        private String targetFeature; // 타겟 변수명

        @Getter
        @Setter
        @AllArgsConstructor
        @NoArgsConstructor
        @Builder
        public static class Feature {
            private String name; // 특성 이름
            private String type; // 특성 타입 (예: number, category 등)
            @Field("feature_class")
            private List<String> featureClass; // 클래스 정보 (카테고리형일 경우)
        }
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class Performance {
        private ClassificationPerformance classification; // 분류 모델 성능
        private RegressionPerformance regression; // 회귀 모델 성능

        @Getter
        @Setter
        @AllArgsConstructor
        @NoArgsConstructor
        @Builder
        public static class ClassificationPerformance {
            private Double accuracy; // 정확도
            private Double precision; // 정밀도
            private Double recall; // 재현율
            @Field("f1_score")
            private Double f1Score; // F1 점수
            private Double auc; // AUC 값
            @Field("confusion_matrix")
            private List<List<Integer>> confusionMatrix; // 혼동 행렬

            @Field("roc_curve")
            private RocCurve rocCurve; // ROC 커브 데이터

            @Getter
            @Setter
            @AllArgsConstructor
            @NoArgsConstructor
            @Builder
            public static class RocCurve {
                private List<Double> fpr; // False Positive Rate
                private List<Double> tpr; // True Positive Rate
            }
        }

        @Getter
        @Setter
        @AllArgsConstructor
        @NoArgsConstructor
        @Builder
        public static class RegressionPerformance {
            @Field("r_squared")
            private Double rSquared; // 결정 계수 (R² 값)
            private Double mae; // 평균 절대 오차
            private Double mse; // 평균 제곱 오차
            private Double rmse; // 평균 제곱근 오차

            @Field("residual_plot")
            private ResidualPlot residualPlot; // 잔차 플롯 데이터
            @Field("scatter_plot")
            private Plot scatterPlot; // 실제값 vs 예측값 스캐터 플롯 데이터

            @Getter
            @Setter
            @AllArgsConstructor
            @NoArgsConstructor
            @Builder
            public static class Plot {
                private List<Double> predicted; // 예측값 (x축)
                private List<Double> actual; // 실제값 (y축) 또는 잔차 값
            }
            @Getter
            @Setter
            @AllArgsConstructor
            @NoArgsConstructor
            @Builder
            public static class ResidualPlot {
                private List<Double> predicted;

                @Field("residuals")
                private List<Double> residuals;
            }

        }
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class ApiKey {
        @Field("created_at")
        private Long createdAt; // API Key 생성 시간
        private String key; // API Key 값
    }
}

