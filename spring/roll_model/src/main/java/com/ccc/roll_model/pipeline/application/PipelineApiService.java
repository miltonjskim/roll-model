package com.ccc.roll_model.pipeline.application;

import com.ccc.roll_model.global.exception.ApiException;
import com.ccc.roll_model.global.exception.ErrorCode;
import com.ccc.roll_model.pipeline.application.command.GetPipelineApiCommand;
import com.ccc.roll_model.pipeline.infrastructure.entity.mongo.PipelineDocument;
import com.ccc.roll_model.pipeline.infrastructure.repository.mongo.PipelineMongoRepository;
import com.ccc.roll_model.pipeline.ui.dto.response.GetPipelineApiResponse;
import com.ccc.roll_model.project.infrastructure.entity.mongo.DatasetDocument;
import com.ccc.roll_model.project.infrastructure.entity.mongo.ModelDocument;
import com.ccc.roll_model.project.infrastructure.entity.mysql.PipelineEntity;
import com.ccc.roll_model.project.infrastructure.entity.mysql.ProjectEntity;
import com.ccc.roll_model.project.infrastructure.entity.mysql.VersionEntity;
import com.ccc.roll_model.project.infrastructure.repository.mongo.DatasetRepository;
import com.ccc.roll_model.project.infrastructure.repository.mongo.ModelRepository;
import com.ccc.roll_model.project.infrastructure.repository.mysql.PipelineRepository;
import com.ccc.roll_model.project.infrastructure.repository.mysql.ProjectRepository;

import com.ccc.roll_model.project.infrastructure.repository.mysql.VersionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Random;
import java.util.Collections;

@Slf4j
@Service
@RequiredArgsConstructor
public class PipelineApiService {
    private final PipelineMongoRepository pipelineMongoRepository;
    private final PipelineRepository pipelineRepository;
    private final ProjectRepository projectRepository;
    private final ModelRepository modelRepository;
    private final DatasetRepository datasetRepository;
    private final VersionRepository versionRepository;
    private final Random random = new Random(42);  // 일관성 유지
    private final String ROOT_VERSION = "1.0";

    @Transactional(readOnly = true)
    public GetPipelineApiResponse getPipelineApi(GetPipelineApiCommand command) {
        String pipelineId = command.getPipelineId();
        Integer memberId = command.getMemberId();

        log.info("파이프라인 조회 시작 - ID: {}", pipelineId);

        // 1. MongoDB에서 파이프라인 document 직접 조회 (MySQL 조회 없이)
        ObjectId objectId;
        try {
            objectId = new ObjectId(pipelineId);
        } catch (IllegalArgumentException e) {
            throw new ApiException(ErrorCode.INVALID_PIPELINE_ID);
        }
        PipelineDocument pipelineDocument = pipelineMongoRepository.findById(objectId)
                .orElseThrow(() -> new ApiException(ErrorCode.PIPELINE_NOT_FOUND));

        Integer projectId = pipelineDocument.getProjectId();
        log.info("프로젝트 ID 찾음: {}", projectId);

        // 2. 프로젝트 정보가 필요하므로 MySQL에서 프로젝트 entity 조회
        ProjectEntity projectEntity = projectRepository.findById(projectId)
                .orElseThrow(() -> new ApiException(ErrorCode.PROJECT_NOT_FOUND));

        // 3. MySQL에서 파이프라인 entity 조회 (필요한 메타데이터 때문에)
        PipelineEntity pipelineEntity = pipelineRepository.findById(pipelineId)
                .orElseThrow(() -> new ApiException(ErrorCode.PIPELINE_METADATA_NOT_FOUND));

        // 버전 엔티티 조회
        VersionEntity versionEntity = versionRepository.findByPipelineId(pipelineId);
        String versionNum = versionEntity != null ? versionEntity.getVersionNum() : ROOT_VERSION;

        // 4. 파이프라인의 맨 마지막 히스토리 가져오기
        PipelineDocument.PipelineHistoryItem latestHistoryItem = pipelineDocument.getHistory().stream()
                .filter(item -> item.getModelId() != null)
                .reduce((first, second) -> second)
                .orElseThrow(() -> new ApiException(ErrorCode.NO_MODEL_HISTORY_FOUND));

        ObjectId modelId = latestHistoryItem.getModelId();
        log.info("모델 ID 찾음: {}", modelId);

        // 5. MongoDB에서 모델 document 조회
        ModelDocument modelDocument = modelRepository.findByPipelineId(pipelineId);
        if (modelDocument == null) {
            throw new ApiException(ErrorCode.MODEL_NOT_FOUND);
        }

        // 6. 전처리된 데이터셋 찾기 (선택적)
        DatasetDocument preprocessedDataset = findPreprocessedDataset(latestHistoryItem);
        if (preprocessedDataset != null) {
            log.info("전처리된 데이터셋 ID 찾음: {}", preprocessedDataset.getId());
        }

        return buildApiResponse(projectEntity, pipelineEntity, modelDocument, preprocessedDataset, memberId, versionNum);
    }

    // 전처리된 데이터셋을 찾는 별도 메소드
    private DatasetDocument findPreprocessedDataset(PipelineDocument.PipelineHistoryItem historyItem) {
        if (historyItem.getPreprocessingSteps() == null || historyItem.getPreprocessingSteps().isEmpty()) {
            return null;
        }

        String preprocessedDatasetId = historyItem.getPreprocessingSteps().stream()
                .filter(step -> step.getPreprocessedDatasetId() != null)
                .map(PipelineDocument.PreprocessingStep::getPreprocessedDatasetId)
                .reduce((first, second) -> second)
                .orElse(null);

        if (preprocessedDatasetId == null || preprocessedDatasetId.isEmpty()) {
            return null;
        }

        log.info("전처리된 데이터셋 조회 - ID: {}", preprocessedDatasetId);
        try {
            return datasetRepository.findById(new ObjectId(preprocessedDatasetId)).orElse(null);
        } catch (IllegalArgumentException e) {
            log.warn("유효하지 않은 데이터셋 ID 형식: {}", preprocessedDatasetId);
            return null;
        }
    }

    private GetPipelineApiResponse buildApiResponse(
            ProjectEntity projectEntity,
            PipelineEntity pipelineEntity,
            ModelDocument modelDocument,
            DatasetDocument preprocessedDataset,
            Integer memberId,
            String versionNum
    ) {
        // ProjectInfo 구성
        GetPipelineApiResponse.ProjectInfo projectInfo = GetPipelineApiResponse.ProjectInfo.builder()
                .title(projectEntity.getTitle())
                .category(projectEntity.getCategory().name())
                .domain(projectEntity.getDomain().name())
                .version(versionNum)
                .projectPublicYn(projectEntity.getPublicYn())
                .pipelinePublicYn(pipelineEntity.getPublicYn())
                .ownerYn(projectEntity.getMemberEntity().getMemberId().equals(memberId))
                .build();

        ModelDocument.ApiKey apiKey = modelDocument.getApiKey() != null ? modelDocument.getApiKey() : null;
        if( apiKey == null) {
            throw new ApiException(ErrorCode.MODEL_API_KEY_NOT_FOUND);
        }
        Long timestamp = apiKey.getCreatedAt();
        LocalDateTime createdAt = LocalDateTime.ofEpochSecond(timestamp, 0, ZoneOffset.UTC);
        LocalDateTime expierdAt = createdAt.plusYears(1L);

        Double accuracy = null;
        Double rSquared = null;

        if (modelDocument.getModelType() != null && modelDocument.getModelType().equals("CLASSIFICATION") &&
                modelDocument.getPerformance() != null &&
                modelDocument.getPerformance().getClassification() != null) {
            accuracy = modelDocument.getPerformance().getClassification().getAccuracy();
            // 소수점 이하 2자리
            if (accuracy != null) {
                accuracy = formatNumberTwoDecimals(accuracy);
            }
        } else if (modelDocument.getModelType() != null && modelDocument.getModelType().equals("REGRESSION") &&
                modelDocument.getPerformance() != null &&
                modelDocument.getPerformance().getRegression() != null) {
            rSquared = modelDocument.getPerformance().getRegression().getRSquared();
            // 소수점 이하 2자리
            if (rSquared != null) {
                rSquared = formatNumberTwoDecimals(rSquared);
            }
        }

        GetPipelineApiResponse.ApiStatus apiStatus = GetPipelineApiResponse.ApiStatus.builder()
                .expiresAt(expierdAt)
                .accuracy(accuracy)
                .rSquared(rSquared)
                .build();

        String url = modelDocument.getApiEndpoint();
        String apiKeyValue = modelDocument.getApiKey().getKey() != null ? modelDocument.getApiKey().getKey() : "";

        GetPipelineApiResponse.Endpoint endpoint = GetPipelineApiResponse.Endpoint.builder()
                .url(url)
                .apiKey(apiKeyValue)
                .build();

        // InputSchema 구성
        List<GetPipelineApiResponse.InputSchema.Feature> features = buildFeatureList(modelDocument, preprocessedDataset);

        GetPipelineApiResponse.InputSchema inputSchema = GetPipelineApiResponse.InputSchema.builder()
                .features(features)
                .build();

        // 최종 응답 조합
        return GetPipelineApiResponse.builder()
                .projectInfo(projectInfo)
                .apiStatus(apiStatus)
                .endpoint(endpoint)
                .inputSchema(inputSchema)
                .build();
    }

    private List<GetPipelineApiResponse.InputSchema.Feature> buildFeatureList(
            ModelDocument modelDocument,
            DatasetDocument preprocessedDataset
    ) {
        List<GetPipelineApiResponse.InputSchema.Feature> features = new ArrayList<>();

        // 모델 트레인 정보에서 특성 목록 가져오기
        if (modelDocument.getTrainInfo() != null && modelDocument.getTrainInfo().getFeatures() != null) {
            // 현실적인 예시 값 추출
            Map<String, Object> exampleValues = extractExampleValues(modelDocument, preprocessedDataset);

            for (ModelDocument.TrainInfo.Feature feature : modelDocument.getTrainInfo().getFeatures()) {
                String featureName = feature.getName();

                // 타겟 변수는 제외
                if (modelDocument.getTrainInfo().getTargetFeature() != null &&
                        featureName.equals(modelDocument.getTrainInfo().getTargetFeature())) {
                    continue;
                }

                String featureType = convertFeatureType(feature.getType());

                // 특성에 맞는 예시 값 선택
                Object exampleValue = exampleValues.getOrDefault(featureName, getDefaultExampleValue(featureType));

                // 숫자 타입인 경우 소수점 이하 2자리
                if ("number".equals(featureType) && exampleValue instanceof Number) {
                    exampleValue = formatNumberTwoDecimals(((Number)exampleValue).doubleValue());
                }

                GetPipelineApiResponse.InputSchema.Feature.FeatureBuilder schemaFeature =
                        GetPipelineApiResponse.InputSchema.Feature.builder()
                                .name(featureName)
                                .type(featureType)
                                .required(true)
                                .example(exampleValue);

                // enum 타입인 경우 options 설정
                if ("enum".equals(featureType) && feature.getFeatureClass() != null && !feature.getFeatureClass().isEmpty()) {
                    schemaFeature.options(feature.getFeatureClass());
                    schemaFeature.example(feature.getFeatureClass().get(0));
                }

                features.add(schemaFeature.build());
            }
        }

        // 예시 데이터가 충분하지 않을 경우 샘플 특성 추가
        if (features.isEmpty()) {
            // 요구사항에 맞는 기본 특성 추가
            addDefaultFeatures(features);
        }

        return features;
    }

    // 소숫점 두자리까지
    private Double formatNumberTwoDecimals(double value) {
        BigDecimal bd = new BigDecimal(value);
        bd = bd.setScale(2, RoundingMode.HALF_UP);
        return bd.doubleValue();
    }

    private void addDefaultFeatures(List<GetPipelineApiResponse.InputSchema.Feature> features) {
        // 기존 특성명들을 추출
        List<String> existingFeatureNames = features.stream()
                .map(GetPipelineApiResponse.InputSchema.Feature::getName)
                .toList();

        // 샘플 특성 1: number 타입
        if (!existingFeatureNames.contains("feature1")) {
            features.add(GetPipelineApiResponse.InputSchema.Feature.builder()
                    .name("feature1")
                    .type("number")
                    .required(true)
                    .example(formatNumberTwoDecimals(25.4))  // 소수점 이하 2자리로
                    .build());
        }

        // 샘플 특성 2: enum 타입
        if (!existingFeatureNames.contains("feature2")) {
            List<String> options = List.of("category_a", "category_b", "category_c");
            features.add(GetPipelineApiResponse.InputSchema.Feature.builder()
                    .name("feature2")
                    .type("enum")
                    .required(true)
                    .options(options)
                    .example("category_a")
                    .build());
        }

        // 샘플 특성 3: string 타입
        if (!existingFeatureNames.contains("feature3")) {
            features.add(GetPipelineApiResponse.InputSchema.Feature.builder()
                    .name("feature3")
                    .type("string")
                    .required(true)
                    .example("sample")
                    .build());
        }

        // 샘플 특성 4: boolean 타입 (optional)
        if (!existingFeatureNames.contains("feature4")) {
            features.add(GetPipelineApiResponse.InputSchema.Feature.builder()
                    .name("feature4")
                    .type("boolean")
                    .required(false)
                    .example(true)
                    .build());
        }
        // 샘플 특성 5: datetime 타입
        if (!existingFeatureNames.contains("feature5")) {
            features.add(GetPipelineApiResponse.InputSchema.Feature.builder()
                    .name("feature5")
                    .type("datetime")
                    .required(true)
                    .example("2023-06-15T14:30:00")
                    .build());
        }
    }

    private String convertFeatureType(String modelFeatureType) {
        if (modelFeatureType == null) return "string";

        switch (modelFeatureType.toLowerCase()) {
            case "number":
            case "numeric":
            case "float":
            case "integer":
            case "double":
                return "number";
            case "category":
            case "categorical":
            case "enum":
                return "enum";
            case "boolean":
            case "bool":
                return "boolean";
            case "datetime":
            case "date":
            case "timestamp":
                return "datetime";
            default:
                return "string";
        }
    }

    private Object getDefaultExampleValue(String featureType) {
        switch (featureType) {
            case "number":
                // 0-100 사이의 무작위 값 (소수점 이하 2자리로 포맷팅)
                return formatNumberTwoDecimals(random.nextDouble() * 100);
            case "enum":
                return "category_a";
            case "boolean":
                return true;
            case "datetime":
                // 현재 시간 기준 예시 (ISO-8601 형식)
                return LocalDateTime.now().withNano(0).toString();
            default:
                return "sample";
        }
    }

    private Map<String, Object> extractExampleValues(ModelDocument modelDocument, DatasetDocument dataset) {
        Map<String, Object> examples = new HashMap<>();

        // 1. 데이터셋의 통계에서 예시 값 추출
        if (dataset != null && dataset.getMetadata() != null &&
                dataset.getMetadata().getStatistics() != null) {

            // 숫자형 특성의 예시 값: 평균값 사용
            if (dataset.getMetadata().getStatistics().getNumericFeatures() != null) {
                dataset.getMetadata().getStatistics().getNumericFeatures().forEach((key, value) -> {
                    if (value != null && value.getMean() != null) {
                        // 소수점 이하 2자리로 포맷팅
                        examples.put(key, formatNumberTwoDecimals(value.getMean()));
                    }
                });
            }

            // 카테고리형 특성의 예시 값: 가장 빈도가 높은 값 사용
            if (dataset.getMetadata().getStatistics().getCategoricalFeatures() != null) {
                dataset.getMetadata().getStatistics().getCategoricalFeatures().forEach((key, value) -> {
                    if (value != null && value.getValueCounts() != null && !value.getValueCounts().isEmpty()) {
                        String mostFrequentValue = value.getValueCounts().entrySet().stream()
                                .max(Map.Entry.comparingByValue())
                                .map(Map.Entry::getKey)
                                .orElse("example_value");
                        examples.put(key, mostFrequentValue);
                    }
                });
            }
        }

        // 2. 모델의 성능 데이터에서 예시 값 추출
        if (modelDocument != null && modelDocument.getPerformance() != null) {
            // 모델 타입에 따라 다른 성능 데이터 활용
            if ("REGRESSION".equals(modelDocument.getModelType()) &&
                    modelDocument.getPerformance().getRegression() != null) {

                // 회귀 모델: scatter_plot에서 실제 값 사용
                ModelDocument.Performance.RegressionPerformance.Plot scatterPlot =
                        modelDocument.getPerformance().getRegression().getScatterPlot();

                if (scatterPlot != null && scatterPlot.getActual() != null &&
                        !scatterPlot.getActual().isEmpty()) {

                    // 모델의 특성 목록 가져오기
                    List<String> featureNames = new ArrayList<>();
                    if (modelDocument.getTrainInfo() != null &&
                            modelDocument.getTrainInfo().getFeatures() != null) {

                        for (ModelDocument.TrainInfo.Feature feature :
                                modelDocument.getTrainInfo().getFeatures()) {
                            // 타겟 변수 제외
                            if (!feature.getName().equals(
                                    modelDocument.getTrainInfo().getTargetFeature())) {
                                featureNames.add(feature.getName());
}
                        }
                    }

                    // 각 특성에 대해 scatter_plot의 actual 데이터에서 실제 값 추출
                    if (!featureNames.isEmpty() && !scatterPlot.getActual().isEmpty()) {
                        for (String featureName : featureNames) {
                            if (!examples.containsKey(featureName)) {
                                // 임의의 실제 값 선택
                                int randomIndex = random.nextInt(scatterPlot.getActual().size());
                                Double value = scatterPlot.getActual().get(randomIndex);

                                // 값이 유효한 경우에만 추가 (소수점 이하 2자리로 포맷팅)
                                if (value != null && Double.isFinite(value)) {
                                    examples.put(featureName, formatNumberTwoDecimals(value));
                                }
                            }
                        }
                    }
                }
            }
        }

        // 3. 특성 중요도(feature_importance)에서 중요한 특성 확인 및 예시 값 보완
        if (modelDocument != null && modelDocument.getFeatureImportance() != null &&
                !modelDocument.getFeatureImportance().isEmpty()) {

            Map<String, Double> featureImportance = modelDocument.getFeatureImportance();

            // 가장 중요한 몇 개의 특성을 위주로 예시 값 보완
            featureImportance.entrySet().stream()
                    .sorted(Collections.reverseOrder(Map.Entry.comparingByValue()))
                    .limit(3)  // 상위 3개 특성
                    .forEach(entry -> {
                        String featureName = entry.getKey();

                        // 이미 예시 값이 있는지 확인
                        if (!examples.containsKey(featureName)) {
                            // 특성 타입 찾기
                            String featureType = "number";  // 기본값
                            if (modelDocument.getTrainInfo() != null &&
                                    modelDocument.getTrainInfo().getFeatures() != null) {

                                for (ModelDocument.TrainInfo.Feature feature :
                                        modelDocument.getTrainInfo().getFeatures()) {
                                    if (feature.getName().equals(featureName)) {
                                        featureType = convertFeatureType(feature.getType());
                                        break;
                                    }
                                }
                            }

                            // 특성 타입에 따라 적절한 예시 값 생성
                            Object value = getRealisticExampleValue(
                                    featureType, featureName, entry.getValue());

                            // 숫자 타입인 경우 소수점 이하 2자리로 포맷팅
                            if ("number".equals(featureType) && value instanceof Number) {
                                value = formatNumberTwoDecimals(((Number)value).doubleValue());
                            }

                            examples.put(featureName, value);
                        }
                    });
        }

        return examples;
    }

    private Object getRealisticExampleValue(String featureType, String featureName, Double importance) {
        switch (featureType) {
            case "number":
                double value;
                // 특성명에 따라 다른 범위의 숫자 값 생성
                if (featureName.toLowerCase().contains("age")) {
                    value = 25 + random.nextInt(50);  // 25-74 사이 나이
                } else if (featureName.toLowerCase().contains("percent") ||
                        featureName.toLowerCase().contains("rate")) {
                    value = random.nextDouble() * 100;  // 0-100% 사이
                } else if (featureName.toLowerCase().contains("value") ||
                        featureName.toLowerCase().contains("price")) {
                    value = 100.0 + random.nextInt(900);  // 100-999 사이 값
                } else if (featureName.toLowerCase().contains("count") ||
                        featureName.toLowerCase().contains("number")) {
                    value = random.nextInt(50) + 1;  // 1-50 사이 개수
                } else {
                    // 중요도에 따라 값 스케일 조정
                    value = 10.0 + (importance * 100);
                }
                // 소수점 이하 2자리로 포맷팅
                return formatNumberTwoDecimals(value);
            case "enum":
                // 특성명에 따라 다른 예시 값 제공
                if (featureName.toLowerCase().contains("gender") ||
                        featureName.toLowerCase().contains("sex")) {
                    return random.nextBoolean() ? "male" : "female";
                } else if (featureName.toLowerCase().contains("type") ||
                        featureName.toLowerCase().contains("category")) {
                    String[] categories = {"A", "B", "C", "D"};
                    return categories[random.nextInt(categories.length)];
                } else {
                    return "category_" + (char)('a' + random.nextInt(3));  // category_a, b, c
                }
            case "boolean":
                return random.nextBoolean();
            default:
                // 문자열: 특성명에 따라 다른 예시 제공
                if (featureName.toLowerCase().contains("name")) {
                    String[] names = {"Alice", "Bob", "Charlie", "David"};
                    return names[random.nextInt(names.length)];
                } else if (featureName.toLowerCase().contains("id")) {
                    return "ID" + (10000 + random.nextInt(90000));  // ID10000-ID99999
                } else {
                    return "sample_" + featureName.substring(0, Math.min(3, featureName.length())).toLowerCase();
                }
        }
    }
}
