package com.ccc.roll_model.pipeline.application;

import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;
import com.ccc.roll_model.pipeline.domain.model.parameters.classification.*;
import com.ccc.roll_model.pipeline.domain.model.parameters.regression.ElasticNetParams;
import com.ccc.roll_model.pipeline.domain.model.parameters.regression.GradientBoostingRegressorParams;
import com.ccc.roll_model.pipeline.domain.model.parameters.regression.RandomForestRegressorParams;
import com.ccc.roll_model.pipeline.domain.model.parameters.regression.SVRParams;
import com.ccc.roll_model.pipeline.ui.dto.response.ClassificationResponse;
import com.ccc.roll_model.pipeline.ui.dto.response.GetModelAndMetricResponse;
import com.ccc.roll_model.pipeline.ui.dto.response.RegressionResponse;
import com.ccc.roll_model.project.infrastructure.entity.mongo.ModelDocument;
import lombok.extern.slf4j.Slf4j;


import java.time.Duration;
import java.util.*;

/**
 * 각 분류 모델별 파라미터 형식을 맞추기 위한 일종의 Reponse 변환 Mampper들을 모아 놓은 클래스
 */
@Slf4j
public class ModelResponseAssembler {
    private static boolean isSupportedAlgorithm(String algorithm) {
        return List.of(
                "LogisticRegressionParams",
                "RandomForestClassifierParams",
                "GradientBoostingClassifierParams",
                "KNeighborsClassifierParams",
                "SVCParams",
                "RandomForestRegressorParams",
                "GradientBoostingRegressorParams",
                "ElasticNetParams",
                "SVRParams"
        ).contains(algorithm);
    }

    /**
     * 모델 파라미터 구성
     */
    public static List<GetModelAndMetricResponse.ModelParameters> buildModelParameters(ModelDocument modelDocument) {
        List<GetModelAndMetricResponse.ModelParameters> parameters = new ArrayList<>();

        if (modelDocument == null) {
            log.warn("ModelDocument is null in buildModelParameters");
            return parameters;
        }

        String algorithm = modelDocument.getAlgorithm();
        if (algorithm == null) {
            log.warn("Algorithm is null in ModelDocument");
            return parameters;
        }

        // 지원하지 않는 모델이면 아예 처리하지 않음
        if (!isSupportedAlgorithm(algorithm)) {
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("지원되지 않는 모델")
                    .parameterValue("미지원 알고리즘: " + algorithm)
                    .parameterKey("unsupported")
                    .build());
            return parameters;
        }

        ModelParameter params;
        try {
            params = modelDocument.getParameters();
            if (params == null) {
                log.warn("ModelParameters is null for algorithm: {}", algorithm);
                return parameters;
            }
        } catch (Exception e) {
            // 역직렬화 실패 등 예외 발생 시 로그 남기고 무시
            log.warn("ModelParameter 역직렬화 실패: {}", e.getMessage());
            return parameters;
        }

        if (params instanceof GradientBoostingClassifierParams gbParams) {
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("부스팅 단계 수 (트리 개수)")
                    .parameterValue(Optional.ofNullable(gbParams.getN_estimators()).map(Object::toString).orElse("N/A"))
                    .parameterKey("n_estimators")
                    .build());
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("각 단계의 학습률 (작을수록 느리지만 안정적)")
                    .parameterValue(Optional.ofNullable(gbParams.getLearning_rate()).map(Object::toString).orElse("N/A"))
                    .parameterKey("learning_rate")
                    .build());
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("각 트리의 최대 깊이")
                    .parameterValue(Optional.ofNullable(gbParams.getMax_depth()).map(Object::toString).orElse("N/A"))
                    .parameterKey("max_depth")
                    .build());

            return parameters;
        }

        if (params instanceof LogisticRegressionParams lrParams) {
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("규제 유형 ('l1', 'l2', 'elasticnet', 'none')")
                    .parameterValue(Optional.ofNullable(lrParams.getPenalty()).orElse("N/A"))
                    .parameterKey("penalty")
                    .build());
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("규제 강도 (작을수록 강한 규제)")
                    .parameterValue(Optional.ofNullable(lrParams.getC()).map(Object::toString).orElse("N/A"))
                    .parameterKey("C")
                    .build());
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("최적화 알고리즘 ('liblinear', 'saga', 'lbfgs' 등)")
                    .parameterValue(Optional.ofNullable(lrParams.getSolver()).orElse("N/A"))
                    .parameterKey("solver")
                    .build());
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("반복 횟수 (수렴하지 않을 때 증가 필요)")
                    .parameterValue(Optional.ofNullable(lrParams.getMax_iter()).map(Object::toString).orElse("N/A"))
                    .parameterKey("max_iter")
                    .build());

            return parameters;
        }

        if (params instanceof SVCParams svcParams) {
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("마진 오류에 대한 패널티 (작을수록 규제가 강함)")
                    .parameterValue(Optional.ofNullable(svcParams.getC()).map(Object::toString).orElse("N/A"))
                    .parameterKey("C")
                    .build());
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("커널 함수 ('linear', 'rbf', 'poly', 'sigmoid')")
                    .parameterValue(Optional.ofNullable(svcParams.getKernel()).orElse("N/A"))
                    .parameterKey("kernel")
                    .build());
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("RBF, poly 커널에서의 영향력 크기 ('scale', 'auto', float)")
                    .parameterValue(Optional.ofNullable(svcParams.getGamma()).orElse("N/A"))
                    .parameterKey("gamma")
                    .build());
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("다항 커널에서의 차수 (kernel='poly'일 때 사용)")
                    .parameterValue(Optional.ofNullable(svcParams.getDegree()).map(Object::toString).orElse("N/A"))
                    .parameterKey("degree")
                    .build());

            return parameters;
        }

        if (params instanceof KNeighborsClassifierParams knParams) {
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("이웃 개수 (보통 홀수 사용)")
                    .parameterValue(Optional.ofNullable(knParams.getN_neighbors()).map(Object::toString).orElse("N/A"))
                    .parameterKey("n_neighbors")
                    .build());
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("거리 가중치 ('uniform' 또는 'distance')")
                    .parameterValue(Optional.ofNullable(knParams.getWeights()).orElse("N/A"))
                    .parameterKey("weights")
                    .build());
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("거리 측정 방식 ('minkowski', 'euclidean', 'manhattan')")
                    .parameterValue(Optional.ofNullable(knParams.getWeights()).orElse("N/A"))
                    .parameterKey("metric")
                    .build());

            return parameters;
        }

        if (params instanceof RandomForestRegressorParams rfrParams) {
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("트리 개수")
                    .parameterValue(Optional.ofNullable(rfrParams.getN_estimators()).map(Object::toString).orElse("N/A"))
                    .parameterKey("n_estimators")
                    .build());
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("트리 깊이 제한")
                    .parameterValue(Optional.ofNullable(rfrParams.getMax_depth()).map(Object::toString).orElse("N/A"))
                    .parameterKey("max_depth")
                    .build());
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("분할 시 사용할 특성 수")
                    .parameterValue(Optional.ofNullable(rfrParams.getMax_features()).orElse("N/A"))
                    .parameterKey("max_features")
                    .build());

            return parameters;
        }

        if (params instanceof ElasticNetParams enParams) {
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("전체 정규화 강도")
                    .parameterValue(Optional.ofNullable(enParams.getAlpha()).map(Object::toString).orElse("N/A"))
                    .parameterKey("alpha")
                    .build());
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("L1/L2 비율 (0: Ridge, 1: Lasso)")
                    .parameterValue(Optional.ofNullable(enParams.getL1_ratio()).map(Object::toString).orElse("N/A"))
                    .parameterKey("l1_ratio")
                    .build());

            return parameters;
        }
        if (params instanceof SVRParams svrParams) {
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("마진 오류 허용도 (크면 과적합 위험)")
                    .parameterValue(Optional.ofNullable(svrParams.getC()).map(Object::toString).orElse("N/A"))
                    .parameterKey("C")
                    .build());
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("무시할 수 있는 오류의 여유 범위")
                    .parameterValue(Optional.ofNullable(svrParams.getEpsilon()).map(Object::toString).orElse("N/A"))
                    .parameterKey("epsilon")
                    .build());
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("커널 종류 ('linear', 'rbf', 'poly', 'sigmoid')")
                    .parameterValue(Optional.ofNullable(svrParams.getKernel()).orElse("N/A"))
                    .parameterKey("kernel")
                    .build());

            return parameters;
        }
        if (params instanceof RandomForestClassifierParams rfcParams) {
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("결정 트리 개수")
                    .parameterValue(Optional.ofNullable(rfcParams.getN_estimators()).map(Object::toString).orElse("N/A"))
                    .parameterKey("n_estimators")
                    .build());
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("각 트리의 최대 깊이")
                    .parameterValue(Optional.ofNullable(rfcParams.getMax_depth()).map(Object::toString).orElse("N/A"))
                    .parameterKey("max_depth")
                    .build());
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("분할 시 고려할 최대 특성 수 ('sqrt', 'log2')")
                    .parameterValue(Optional.ofNullable(rfcParams.getMax_features()).orElse("N/A"))
                    .parameterKey("max_features")
                    .build());

            return parameters;
        }
        if (params instanceof GradientBoostingRegressorParams grrParams) {
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("부스팅 단계 수")
                    .parameterValue(Optional.ofNullable(grrParams.getN_estimators()).map(Object::toString).orElse("N/A"))
                    .parameterKey("n_estimators")
                    .build());
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("각 단계 기여도 조절")
                    .parameterValue(Optional.ofNullable(grrParams.getLearning_rate()).map(Object::toString).orElse("N/A"))
                    .parameterKey("learning_rate")
                    .build());
            parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                    .parameterName("개별 트리 복잡도 조절")
                    .parameterValue(Optional.ofNullable(grrParams.getMax_depth()).map(Object::toString).orElse("N/A"))
                    .parameterKey("max_depth")
                    .build());

            return parameters;
        }
        parameters.add(GetModelAndMetricResponse.ModelParameters.builder()
                .parameterName("알 수 없는 파라미터")
                .parameterValue("미정")
                .parameterKey("unknown")
                .build());

        return parameters;
    }

    /**
     * 타겟 정보 구성
     */
    public static List<Map<String, String>> buildTargetInfo(ModelDocument modelDocument) {
        List<Map<String, String>> targetInfoList = new ArrayList<>();

        if (modelDocument == null) {
            log.warn("ModelDocument is null in buildTargetInfo");
            return targetInfoList;
        }

        ModelDocument.TrainInfo trainInfo = modelDocument.getTrainInfo();
        if (trainInfo != null) {
            if (trainInfo.getFeatures() != null) {
                Map<String, String> featureCount = new HashMap<>();
                featureCount.put("targetName", "특성 수");
                featureCount.put("targetValue", String.valueOf(trainInfo.getFeatures().size()));
                featureCount.put("targetKey", "feature_count");
                targetInfoList.add(featureCount);
            }

            Map<String, String> duration = new HashMap<>();
            duration.put("durationName", "학습 시간");
            if (trainInfo.getStartTime() != null && trainInfo.getEndTime() != null) {
                long seconds = Duration.between(trainInfo.getStartTime(), trainInfo.getEndTime()).getSeconds();
                duration.put("durationValue", String.valueOf(seconds));
            } else {
                duration.put("durationValue", "N/A");
            }
            duration.put("durationKey", "learning_duration");
            targetInfoList.add(duration);
        }

        return targetInfoList;
    }

    /**
     * 성능 메트릭 구성
     */
    public static List<GetModelAndMetricResponse.PerformanceMetric> buildPerformanceMetrics(ModelDocument modelDocument, String category) {
        List<GetModelAndMetricResponse.PerformanceMetric> metrics = new ArrayList<>();
        ModelDocument.Performance performance;
        if (modelDocument == null) {
            log.warn("ModelDocument is null in buildPerformanceMetrics");
            return metrics;
        }
        if( modelDocument.getPerformance()==null){
            log.warn("modelDocument is null in buildPerformanceMetrics");
            return metrics;
        }else{
            performance = modelDocument.getPerformance();
        }

        log.info("Performance category: {}", category);

        // 분류 모델인 경우
        if ("CLASSIFICATION".equalsIgnoreCase(category) && performance.getClassification() != null) {
            ModelDocument.Performance.ClassificationPerformance cp = performance.getClassification();

            if (cp.getAccuracy() != null) {
                metrics.add(GetModelAndMetricResponse.PerformanceMetric.builder()
                        .metricName("정확도 (Accuracy)")
                        .metricValue(String.format("%.0f%%", cp.getAccuracy() * 100))
                        .metricDesc("올바르게 분류한 비율")
                        .metricKey("accuracy")
                        .build());
            }

            if (cp.getPrecision() != null) {
                metrics.add(GetModelAndMetricResponse.PerformanceMetric.builder()
                        .metricName("정밀도 (Precision)")
                        .metricValue(String.format("%.0f%%", cp.getPrecision() * 100))
                        .metricDesc("양성 예측의 정확성")
                        .metricKey("precision")
                        .build());
            }

            if (cp.getRecall() != null) {
                metrics.add(GetModelAndMetricResponse.PerformanceMetric.builder()
                        .metricName("재현율 (Recall)")
                        .metricValue(String.format("%.0f%%", cp.getRecall() * 100))
                        .metricDesc("실제 양성 감지율")
                        .metricKey("recall")
                        .build());
            }

            if (cp.getF1Score() != null) {
                metrics.add(GetModelAndMetricResponse.PerformanceMetric.builder()
                        .metricName("F1 점수")
                        .metricValue(String.format("%.0f%%", cp.getF1Score() * 100))
                        .metricDesc("정밀도와 재현율의 조화")
                        .metricKey("f1_score")
                        .build());
            }
        }
        // 회귀 모델인 경우
        else if ("REGRESSION".equalsIgnoreCase(category) && performance.getRegression() != null) {
            ModelDocument.Performance.RegressionPerformance rp = performance.getRegression();

            if (rp.getRSquared() != null) {
                metrics.add(GetModelAndMetricResponse.PerformanceMetric.builder()
                        .metricName("R² (결정 개수)")
                        .metricValue(String.format("%.0f%%", rp.getRSquared() * 100))
                        .metricDesc("모델이 설명하는 분산의 비율")
                        .metricKey("r_squared")
                        .build());
            }

            if (rp.getMae() != null) {
                metrics.add(GetModelAndMetricResponse.PerformanceMetric.builder()
                        .metricName("MAE (평균 절대 오차)")
                        .metricValue(String.format("%.0f%%", rp.getMae() * 100))
                        .metricDesc("예측값과 실제값 차이의 절대값 평균")
                        .metricKey("mae")
                        .build());
            }

            if (rp.getMse() != null) {
                metrics.add(GetModelAndMetricResponse.PerformanceMetric.builder()
                        .metricName("MSE (평균 제곱 오차)")
                        .metricValue(String.format("%.0f%%", rp.getMse() * 100))
                        .metricDesc("예측값과 실제값 차이의 제곱 평균")
                        .metricKey("mse")
                        .build());
            }

            if (rp.getRmse() != null) {
                metrics.add(GetModelAndMetricResponse.PerformanceMetric.builder()
                        .metricName("RMSE (평균 제곱근 오차)")
                        .metricValue(String.format("%.0f%%", rp.getRmse() * 100))
                        .metricDesc("MSE의 제곱근 값")
                        .metricKey("rmse")
                        .build());
            }
        }

        return metrics;
    }

    /**
     * 특성 중요도 구성
     */
    public static List<GetModelAndMetricResponse.FeatureImportance> buildFeatureImportance(ModelDocument modelDocument) {
        List<GetModelAndMetricResponse.FeatureImportance> importanceList = new ArrayList<>();

        if (modelDocument == null) {
            log.warn("ModelDocument is null in buildFeatureImportance");
            return importanceList;
        }

        Map<String, Double> featureImportance = modelDocument.getFeatureImportance();
        if (featureImportance != null && !featureImportance.isEmpty()) {
            for (Map.Entry<String, Double> entry : featureImportance.entrySet()) {
                if (entry.getKey() != null && entry.getValue() != null) {
                    importanceList.add(GetModelAndMetricResponse.FeatureImportance.builder()
                            .featureName(entry.getKey())
                            .importanceValue(String.format("%.0f", entry.getValue() * 100))
                            .importanceKey(entry.getKey().replaceAll("\\s+", "_").toLowerCase())
                            .build());
                }
            }

            // 중요도 내림차순으로 정렬
            importanceList.sort((a, b) -> {
                try {
                    Double valA = Double.parseDouble(a.getImportanceValue());
                    Double valB = Double.parseDouble(b.getImportanceValue());
                    return valB.compareTo(valA);
                } catch (NumberFormatException e) {
                    log.warn("Failed to parse importance value: {}", e.getMessage());
                    return 0;
                }
            });
        }

        return importanceList;
    }

    /**
     * 혼동 행렬 구성
     */
    public static ClassificationResponse.ConfusionMatrix buildConfusionMatrix(ModelDocument document) {
        if (document == null) {
            log.warn("ModelDocument is null in buildConfusionMatrix");
            return null;
        }

        ModelDocument.Performance performance = document.getPerformance();
        if (performance == null) {
            log.warn("Performance is null in ModelDocument");
            return null;
        }

        if (performance.getClassification() == null) {
            log.warn("ClassificationPerformance is null in Performance");
            return null;
        }

        ModelDocument.TrainInfo trainInfo = document.getTrainInfo();
        if (trainInfo == null) {
            log.warn("TrainInfo is null in ModelDocument");
            return null;
        }

        List<List<Integer>> matrix = performance.getClassification().getConfusionMatrix();
        if (matrix == null || matrix.isEmpty()) {
            log.warn("ConfusionMatrix is null or empty");
            return null;
        }

        String targetFeatureName = trainInfo.getTargetFeature();
        if (targetFeatureName == null) {
            log.warn("TargetFeature is null in TrainInfo");
            return null;
        }

        List<ModelDocument.TrainInfo.Feature> features = trainInfo.getFeatures();

        List<String> labels = extractLabelsFromFeatures(features, targetFeatureName, matrix.size());

        return ClassificationResponse.ConfusionMatrix.builder()
                .labels(labels)
                .matrixData(matrix)
                .build();
    }

    /**
     * 혼동 행렬에서 라벨링 뽑아내는 클래스인데 아직 정확하게는 모르겠음
     */
    private static List<String> extractLabelsFromFeatures(List<ModelDocument.TrainInfo.Feature> features, String targetFeatureName, int matrixSize) {
        if (features != null && targetFeatureName != null) {
            for (ModelDocument.TrainInfo.Feature feature : features) {
                if (feature != null && targetFeatureName.equals(feature.getName()) && feature.getFeatureClass() != null && !feature.getFeatureClass().isEmpty()) {
                    return feature.getFeatureClass();
                }
            }
        }

        return generateIndexLabels(targetFeatureName, matrixSize);
    }

    private static List<String> generateIndexLabels(String featureName, int size) {
        List<String> labels = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            labels.add((featureName != null ? featureName : "Class") + " " + i);
        }
        return labels;
    }

    /**
     * 회귀 모델의 파라미터 Mapper
     */
    public static RegressionResponse.ActualVsPredicted buildActualVsPredicted(ModelDocument modelDocument) {
        if (modelDocument == null) {
            log.warn("ModelDocument is null in buildActualVsPredicted");
            return null;
        }
        if(modelDocument.getPerformance() == null) {
            return null;
        }
        ModelDocument.Performance performance = modelDocument.getPerformance();
        if (performance == null) {
            log.warn("Performance is null in ModelDocument");
            return null;
        }

        ModelDocument.Performance.RegressionPerformance regression = performance.getRegression();
        if (regression == null) {
            log.warn("RegressionPerformance is null in Performance");
            return null;
        }

        if (regression.getScatterPlot() == null) {
            log.warn("ScatterPlot is null in RegressionPerformance");
            return null;
        }

        List<Double> actualList = regression.getScatterPlot().getActual();
        List<Double> predictedList = regression.getScatterPlot().getPredicted();

        if (actualList == null || predictedList == null) {
            log.warn("Actual or Predicted list is null in ScatterPlot");
            return null;
        }

        if (actualList.size() != predictedList.size()) {
            log.warn("Actual and Predicted lists have different sizes: {} vs {}",
                    actualList.size(), predictedList.size());
            return null;
        }

        List<RegressionResponse.ActualVsPredicted.DataPoint> dataPoints = new ArrayList<>();

        for (int i = 0; i < actualList.size(); i++) {
            if (actualList.get(i) != null && predictedList.get(i) != null) {
                dataPoints.add(
                        RegressionResponse.ActualVsPredicted.DataPoint.builder()
                                .actual(actualList.get(i))
                                .predicted(predictedList.get(i))
                                .id(i)
                                .build()
                );
            }
        }

        return RegressionResponse.ActualVsPredicted.builder()
                .data(dataPoints)
                .perfectLinePoints(List.of(
                        RegressionResponse.ActualVsPredicted.PointXY.builder().x(0).y(0).build(),
                        RegressionResponse.ActualVsPredicted.PointXY.builder().x(8100).y(8100).build()
                ))
                .xAxisLabel("실제값 (IC50_nM)")
                .yAxisLabel("예측값")
                .build();
    }

    public static RegressionResponse.ResidualPlot buildResidualPlot(ModelDocument.Performance.RegressionPerformance regression) {

        if (regression == null || regression.getScatterPlot() == null) return null;

        List<Double> actualList = regression.getScatterPlot().getActual();
        List<Double> predictedList = regression.getScatterPlot().getPredicted();

        if (actualList == null || predictedList == null || actualList.size() != predictedList.size()) return null;

        List<RegressionResponse.ResidualPlot.ResidualDataPoint> residualData = new ArrayList<>();
        for (int i = 0; i < predictedList.size(); i++) {
            double residual = actualList.get(i) - predictedList.get(i);
            residualData.add(
                    RegressionResponse.ResidualPlot.ResidualDataPoint.builder()
                            .predicted(predictedList.get(i))
                            .residual(residual)
                            .id(i)
                            .build()
            );
        }

        // 히스토그램 데이터가 저장된 경우 사용하고 없으면 비워둡니다.
        List<Double> bins = List.of(-40.0, -35.0, -30.0, /* ... */ 40.0);
        List<Integer> frequencies = List.of(0, 0, 0, /* ... */ 0);

        return RegressionResponse.ResidualPlot.builder()
                .data(residualData)
                .histogram(
                        RegressionResponse.ResidualPlot.Histogram.builder()
                                .bins(bins)
                                .frequencies(frequencies)
                                .build()
                )
                .xAxisLabel("예측값")
                .yAxisLabel("잔차(실제값 - 예측값)")
                .zeroLineY(0.0)
                .build();
    }


}
