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
import com.ccc.roll_model.project.infrastructure.repository.mongo.DatasetRepository;
import com.ccc.roll_model.project.infrastructure.repository.mongo.ModelRepository;
import com.ccc.roll_model.project.infrastructure.repository.mysql.PipelineRepository;
import com.ccc.roll_model.project.infrastructure.repository.mysql.ProjectRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class PipelineApiService {
    private final PipelineMongoRepository pipelineMongoRepository;
    private final PipelineRepository pipelineRepository;
    private final ProjectRepository projectRepository;
    private final ModelRepository modelRepository;
    private final DatasetRepository datasetRepository;

    @Transactional(readOnly = true)
    public GetPipelineApiResponse getPipelineApi(GetPipelineApiCommand command) {
        String pipelineId = command.getPipelineId();
        Integer memberId = command.getMemberId();

        // 1. MySQL에서 파이프라인 엔티티 조회
        PipelineEntity pipelineEntity = pipelineRepository.findById(pipelineId)
                .orElseThrow(() -> new ApiException(ErrorCode.PIPELINE_NOT_FOUND));

        // 2. MySQL에서 프로젝트 엔티티 조회
        ProjectEntity projectEntity = projectRepository.findById(pipelineEntity.getProjectId())
                .orElseThrow(() -> new ApiException(ErrorCode.PIPELINE_NOT_FOUND));

        // 3. MongoDB에서 파이프라인 도큐먼트 조회
        PipelineDocument pipelineDocument = pipelineMongoRepository.findById(new ObjectId(pipelineId))
                .orElseThrow(() -> new ApiException(ErrorCode.PIPELINE_NOT_FOUND));

        // 4. 파이프라인의 최신 히스토리 아이템 가져오기
        PipelineDocument.PipelineHistoryItem latestHistoryItem = pipelineDocument.getHistory().stream()
                .filter(item -> item.getModelId() != null)
                .findFirst()
                .orElseThrow(() -> new ApiException(ErrorCode.PIPELINE_NOT_FOUND));

        // 5. MongoDB에서 모델 document 조회
        ModelDocument modelDocument = modelRepository.findById(latestHistoryItem.getModelId())
                .orElseThrow(() -> new ApiException(ErrorCode.PIPELINE_NOT_FOUND));

        // 6. 전처리된 데이터셋 찾기
        String preprocessedDatasetId = null;
        if (latestHistoryItem.getPreprocessingSteps() != null && !latestHistoryItem.getPreprocessingSteps().isEmpty()) {
            preprocessedDatasetId = latestHistoryItem.getPreprocessingSteps().stream()
                    .filter(step -> step.getPreprocessedDatasetId() != null)
                    .map(PipelineDocument.PreprocessingStep::getPreprocessedDatasetId)
                    .findFirst()
                    .orElse(null);
        }

        DatasetDocument preprocessedDataset = null;
        if (preprocessedDatasetId != null) {
            preprocessedDataset = datasetRepository.findById(new ObjectId(preprocessedDatasetId)).orElse(null);
        }

        return buildApiResponse(projectEntity, pipelineEntity, modelDocument, preprocessedDataset, memberId);
    }

    private GetPipelineApiResponse buildApiResponse(
            ProjectEntity projectEntity,
            PipelineEntity pipelineEntity,
            ModelDocument modelDocument,
            DatasetDocument preprocessedDataset,
            Integer memberId
    ) {
        // ProjectInfo 구성
        GetPipelineApiResponse.ProjectInfo projectInfo = GetPipelineApiResponse.ProjectInfo.builder()
                .title(projectEntity.getTitle())
                .category(projectEntity.getCategory().name())
                .domain(projectEntity.getDomain().name())
                .version(pipelineEntity.getVersion() != null ? pipelineEntity.getVersion().toString() : "1.0")
                .projectPublicYn(projectEntity.getPublicYn())
                .pipelinePublicYn(pipelineEntity.getPublicYn())
                .ownerYn(projectEntity.getMemberEntity().getMemberId().equals(memberId))
                .build();

        // TODO: ApiStatus 구성 (만료일은 하드코딩)
        LocalDateTime expiresAt = LocalDateTime.of(2025, 8, 8, 23, 59, 59);
        Double accuracy = null;
        Double rSquared = null;

        if (modelDocument.getModelType() != null && modelDocument.getModelType().equals("CLASSIFICATION") &&
                modelDocument.getPerformance() != null &&
                modelDocument.getPerformance().getClassification() != null) {
            accuracy = modelDocument.getPerformance().getClassification().getAccuracy();
        } else if (modelDocument.getModelType() != null && modelDocument.getModelType().equals("REGRESSION") &&
                modelDocument.getPerformance() != null &&
                modelDocument.getPerformance().getRegression() != null) {
            rSquared = modelDocument.getPerformance().getRegression().getRSquared();
        }

        GetPipelineApiResponse.ApiStatus apiStatus = GetPipelineApiResponse.ApiStatus.builder()
                .expiresAt(expiresAt)
                .accuracy(accuracy)
                .rSquared(rSquared)
                .build();

        // TODO: Endpoint 구성 (API 키는 하드코딩)
        String url = "https://api.yourdomain.com/models/proj-" + pipelineEntity.getPipelineId().substring(0, 5) + "/predict";
        String apiKey = "sk_12345abcdef67890";

        GetPipelineApiResponse.Endpoint endpoint = GetPipelineApiResponse.Endpoint.builder()
                .url(url)
                .apiKey(apiKey)
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
            Map<String, Object> exampleValues = extractExampleValues(preprocessedDataset);

            for (ModelDocument.TrainInfo.Feature feature : modelDocument.getTrainInfo().getFeatures()) {
                String featureName = feature.getName();

                // 타겟 변수는 제외 (입력 스키마에 포함하지 않음)
                if (modelDocument.getTrainInfo().getTargetFeature() != null &&
                        featureName.equals(modelDocument.getTrainInfo().getTargetFeature())) {
                    continue;
                }

                String featureType = convertFeatureType(feature.getType());
                Object exampleValue = exampleValues.getOrDefault(featureName, getDefaultExampleValue(featureType));

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
        if (features.size() < 4) {
            // 요구사항에 맞는 4개의 기본 특성 추가
            addDefaultFeatures(features);
        }

        return features;
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
                    .example(25.4)
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
            default:
                return "string";
        }
    }

    private Object getDefaultExampleValue(String featureType) {
        switch (featureType) {
            case "number":
                return 25.4;
            case "enum":
                return "category_a";
            case "boolean":
                return true;
            default:
                return "sample";
        }
    }

    private Map<String, Object> extractExampleValues(DatasetDocument dataset) {
        Map<String, Object> examples = new HashMap<>();

        if (dataset == null || dataset.getMetadata() == null ||
                dataset.getMetadata().getStatistics() == null) {
            return examples;
        }

        // 숫자형 특성의 예시 값: 평균값 사용
        if (dataset.getMetadata().getStatistics().getNumericFeatures() != null) {
            dataset.getMetadata().getStatistics().getNumericFeatures().forEach((key, value) -> {
                if (value != null && value.getMean() != null) {
                    examples.put(key, value.getMean());
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

        return examples;
    }
}