package com.ccc.roll_model.pipeline.application;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.ccc.roll_model.pipeline.application.command.GetPipelineDatasetInfoCommand;
import com.ccc.roll_model.pipeline.domain.model.client.MessagePublisher;
import com.ccc.roll_model.pipeline.domain.model.vo.ModelingData;
import com.ccc.roll_model.pipeline.ui.dto.response.*;
import com.ccc.roll_model.project.infrastructure.entity.mongo.DatasetDocument.Metadata.Statistics.NumericFeature;
import com.ccc.roll_model.project.infrastructure.entity.mongo.ModelDocument;
import com.ccc.roll_model.project.infrastructure.entity.mysql.ProjectEntity;
import com.ccc.roll_model.project.infrastructure.repository.mongo.ModelRepository;
import com.ccc.roll_model.project.infrastructure.repository.mysql.ProjectRepository;

import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ccc.roll_model.pipeline.application.command.ExecuteModelingCommand;
import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;
import com.ccc.roll_model.pipeline.domain.model.common.ModelingInfo;
import com.ccc.roll_model.pipeline.infrastructure.entity.mongo.PipelineDocument;
import com.ccc.roll_model.pipeline.infrastructure.repository.mongo.PipelineMongoRepository;
import com.ccc.roll_model.project.infrastructure.entity.mongo.DatasetDocument;
import com.ccc.roll_model.project.infrastructure.entity.mysql.PipelineEntity;
import com.ccc.roll_model.project.infrastructure.repository.mongo.DatasetRepository;
import com.ccc.roll_model.project.infrastructure.repository.mysql.PipelineRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ModelingService {

	private final PipelineRepository pipelineRepository;
	private final PipelineMongoRepository pipelineMongoRepository;
	private final DatasetRepository datasetRepository;
	private final ProjectRepository projectRepository;
	private final ModelRepository modelRepository;
	private final MessagePublisher messagePublisher;
	public void executeModeling(ExecuteModelingCommand command) {
		// 커맨드 유효성 검사
		if (!command.validate()) {
			throw new IllegalArgumentException("모델링 실행 명령이 유효하지 않습니다.");
		}

		// 파이프라인 존재 여부 확인 : mysql
		PipelineEntity pipeline = pipelineRepository.findById(command.getPipelineId())
			.orElseThrow(() -> new EntityNotFoundException("파이프라인을 찾을 수 없습니다. : mysql"));

		// 파이프라인 존재 여부 확인 : mongo
		PipelineDocument pipelineDocument;
		try {
			pipelineDocument = pipelineMongoRepository.findById(new ObjectId(command.getPipelineId()))
				.orElseThrow(() -> new EntityNotFoundException("파이프라인을 찾을 수 없습니다. : mongo"));
		} catch (IllegalArgumentException e) {
			throw new IllegalArgumentException("유효하지 않은 파이프라인 ID 형식입니다: " + e.getMessage());
		}

		String filePath = getDatasetFilePath(pipelineDocument);

		log.info("filePath: {}", filePath);

		// 모델링 정보 추출 및 파라미터 객체 생성
		ModelingInfo modelingInfo = command.getModelingInfo();

		ModelParameter modelParameter = ModelParameterFactory.createModelParameters(
			modelingInfo.getModelType(),
			modelingInfo.getParameters()
		);
		log.info("params validate: {}", modelParameter.validateParameters());

		log.info("params: {}", modelParameter.toString());

		// 카프카 메시징
		ModelingData modelingData = ModelingData.builder()
				.projectId(pipelineDocument.getProjectId())
				.modelType(modelingInfo.getModelType())
				.memberId(command.getMemberId())
				.pipelineId(command.getPipelineId())
				.parameters(modelParameter)
				.trainDataPath(filePath)
				.targetColumn(modelingInfo.getTargetFeature())
				.build();
		// 저장
		messagePublisher.publishProcessingRequest(modelingData);
	}

	/**
	 * 파이프라인 문서로부터 데이터셋 파일 경로를 가져오는 메서드
	 * @param pipelineDocument 파이프라인 문서
	 * @return 데이터셋 파일 경로
	 */
	public String getDatasetFilePath(PipelineDocument pipelineDocument) {
		// 원본 데이터셋 ID 확인
		String originalDatasetId = pipelineDocument.getOriginalDatasetId();
		if (originalDatasetId == null || originalDatasetId.isEmpty()) {
			throw new IllegalArgumentException("원본 데이터셋 ID가 없습니다.");
		}

		// 사용할 etag 결정
		String datasetId;

		if (pipelineDocument.getHistory() == null || pipelineDocument.getHistory().isEmpty()) {
			// 히스토리가 없는 경우 원본 데이터셋 id 사용
			datasetId = originalDatasetId;
		} else {
			// 히스토리가 있는 경우 가장 최근 전처리 단계의 etag 사용
			PipelineDocument.PipelineHistoryItem latestHistoryItem = pipelineDocument.getHistory()
				.get(pipelineDocument.getHistory().size() - 1);

			List<PipelineDocument.PreprocessingStep> steps = latestHistoryItem.getPreprocessingSteps();

			// 전처리 단계가 없는 경우 원본 데이터셋 id 사용
			if (steps == null || steps.isEmpty()) {
				datasetId = originalDatasetId;
			} else {
				// 전처리 단계가 있는 경우 가장 최근 전처리 단계의 dataset_id 사용
				PipelineDocument.PreprocessingStep latestStep = steps.get(steps.size() - 1);
				datasetId = latestStep.getPreprocessedDatasetId();

				// dataset_id가 없거나 비어있는 경우 원본 dataset_id로 폴백
				if (datasetId == null || datasetId.isEmpty()) {
					datasetId = originalDatasetId;
				}
			}
		}

		// 데이터셋 ID 로깅 및 유효성 검사
		log.info("getDatasetFilePath - 데이터셋 ID: {}", datasetId);

		if (datasetId == null || datasetId.isEmpty()) {
			throw new IllegalArgumentException("데이터셋 ID가 없습니다.");
		}

		// object_id로 데이터셋 문서 조회
		DatasetDocument datasetDocument;
		try {
			datasetDocument = datasetRepository.findById(new ObjectId(datasetId))
				.orElseThrow(()->new EntityNotFoundException("데이터셋을 찾을 수 없습니다."));
		} catch (IllegalArgumentException e) {
			throw new IllegalArgumentException("유효하지 않은 데이터셋 ID 형식입니다: " + e.getMessage());
		}

		// 데이터셋 파일 경로 반환
		return datasetDocument.getDatasetFilePath();
	}

	/**
	 * 파이프라인 ID를 받아 해당 파이프라인과 관련된 데이터셋 정보를 조회하는 메서드
	 * @param command 파이프라인 데이터셋 정보 조회 명령
	 * @return 파이프라인 데이터셋 정보 응답
	 */
	public GetPipelineDatasetInfoResponse getPipelineDatasetInfo(GetPipelineDatasetInfoCommand command) {
		// 커맨드 유효성 검사
		if (!command.validate()) {
			throw new IllegalArgumentException("파이프라인 데이터셋 정보 조회 명령이 유효하지 않습니다.");
		}

		// 파이프라인 존재 여부 확인 : mysql
		PipelineEntity pipelineEntity = pipelineRepository.findById(command.getPipelineId())
			.orElseThrow(() -> new EntityNotFoundException("파이프라인을 찾을 수 없습니다. : mysql"));

		// 파이프라인 존재 여부 확인 : mongo
		PipelineDocument pipelineDocument;
		try {
			// 소유자 여부와 상관없이 파이프라인 문서 조회 (기본 findById 메서드 사용)
			pipelineDocument = pipelineMongoRepository.findById(new ObjectId(command.getPipelineId()))
				.orElseThrow(() -> new EntityNotFoundException("파이프라인을 찾을 수 없습니다. : mongo"));

			log.info("getPipelineDatasetInfo - 파이프라인 문서 조회 성공 (소유자 여부 무시)");
		} catch (IllegalArgumentException e) {
			throw new IllegalArgumentException("유효하지 않은 파이프라인 ID 형식입니다: " + e.getMessage());
		}

		// 파이프라인 문서 정보 로깅
		log.info("getPipelineDatasetInfo - 파이프라인 ID: {}", command.getPipelineId());
		log.info("getPipelineDatasetInfo - 원본 데이터셋 ID: {}", pipelineDocument.getOriginalDatasetId());
		log.info("getPipelineDatasetInfo - 히스토리 존재 여부: {}", 
			pipelineDocument.getHistory() != null && !pipelineDocument.getHistory().isEmpty() ? "있음" : "없음");

		// 프로젝트 정보 조회
		ProjectEntity projectEntity = pipelineEntity.getProjectEntity();
		if (projectEntity == null) {
			throw new EntityNotFoundException("프로젝트를 찾을 수 없습니다.");
		}

		// 여기서 수정 시작: 전처리된 데이터셋을 우선적으로 조회
		DatasetDocument datasetDocument;

		// 1. 먼저 프로젝트 ID와 is_preprocessed=true 조건으로 전처리된 데이터셋 조회
		datasetDocument = datasetRepository.findByProjectIdAndIsPreprocessed(
				projectEntity.getProjectId(), true);

		// 2. 전처리된 데이터셋이 없는 경우, 기존 로직으로 데이터셋 조회
		if (datasetDocument == null) {
			log.info("전처리된 데이터셋이 없어 파이프라인 히스토리에서 데이터셋 ID를 조회합니다.");
			String datasetId = getLatestDatasetId(pipelineDocument);

			if (datasetId == null || datasetId.isEmpty()) {
				throw new IllegalArgumentException("데이터셋 ID가 없습니다.");
			}

			try {
				datasetDocument = datasetRepository.findById(new ObjectId(datasetId))
						.orElseThrow(() -> new EntityNotFoundException("데이터셋을 찾을 수 없습니다."));
			} catch (IllegalArgumentException e) {
				throw new IllegalArgumentException("유효하지 않은 데이터셋 ID 형식입니다: " + e.getMessage());
			}
		} else {
			log.info("전처리된 데이터셋을 사용합니다. 데이터셋 ID: {}", datasetDocument.getId());
		}

		// 응답 구성
		return buildResponse(pipelineEntity, pipelineDocument, projectEntity, datasetDocument, command.getMemberId());
	}

	/**
	 * 파이프라인 문서로부터 최신 데이터셋 ID를 가져오는 메서드
	 * @param pipelineDocument 파이프라인 문서
	 * @return 데이터셋 ID
	 */
	private String getLatestDatasetId(PipelineDocument pipelineDocument) {
		// 원본 데이터셋 ID가 null이거나 비어있는지 확인
		String originalDatasetId = pipelineDocument.getOriginalDatasetId();
		log.info("getLatestDatasetId - 원본 데이터셋 ID: {}", originalDatasetId);

		if (originalDatasetId == null || originalDatasetId.isEmpty()) {
			log.error("getLatestDatasetId - 원본 데이터셋 ID가 없습니다.");
			throw new IllegalArgumentException("원본 데이터셋 ID가 없습니다.");
		}

		if (pipelineDocument.getHistory() == null || pipelineDocument.getHistory().isEmpty()) {
			log.info("getLatestDatasetId - 히스토리가 없어 원본 데이터셋 ID 반환: {}", originalDatasetId);
			return originalDatasetId;
		}

		PipelineDocument.PipelineHistoryItem latestHistoryItem = pipelineDocument.getHistory()
			.get(pipelineDocument.getHistory().size() - 1);

		log.info("getLatestDatasetId - 히스토리 항목 찾음: {}", latestHistoryItem != null ? "있음" : "없음");

		List<PipelineDocument.PreprocessingStep> steps = latestHistoryItem.getPreprocessingSteps();
		log.info("getLatestDatasetId - 전처리 단계: {}", steps != null ? steps.size() + "개" : "없음");

		if (steps == null || steps.isEmpty()) {
			log.info("getLatestDatasetId - 전처리 단계가 없어 원본 데이터셋 ID 반환: {}", originalDatasetId);
			return originalDatasetId;
		}

		PipelineDocument.PreprocessingStep latestStep = steps.get(steps.size() - 1);
		String datasetId = latestStep.getPreprocessedDatasetId();
		log.info("getLatestDatasetId - 최신 전처리 단계의 데이터셋 ID: {}", datasetId);

		if (datasetId == null || datasetId.isEmpty()) {
			log.info("getLatestDatasetId - 전처리된 데이터셋 ID가 없어 원본 데이터셋 ID 반환: {}", originalDatasetId);
			return originalDatasetId;
		}

		log.info("getLatestDatasetId - 전처리된 데이터셋 ID 반환: {}", datasetId);
		return datasetId;
	}

	/**
	 * 응답 DTO를 구성하는 메서드
	 * @param pipelineEntity 파이프라인 엔티티
	 * @param pipelineDocument 파이프라인 문서
	 * @param projectEntity 프로젝트 엔티티
	 * @param datasetDocument 데이터셋 문서
	 * @param memberId 회원 ID
	 * @return 파이프라인 데이터셋 정보 응답
	 */
	private GetPipelineDatasetInfoResponse buildResponse(
		PipelineEntity pipelineEntity,
		PipelineDocument pipelineDocument,
		ProjectEntity projectEntity,
		DatasetDocument datasetDocument,
		Integer memberId
	) {
		// 프로젝트 정보 구성
		boolean isActualOwner = projectEntity.getMemberEntity().getMemberId().equals(memberId);

		ProjectInfoResponse projectInfo = ProjectInfoResponse.builder()
			.title(projectEntity.getTitle())
			.category(projectEntity.getCategory().name())
			.domain(projectEntity.getDomain().name())
				.version(pipelineEntity.getVersion() != null ? pipelineEntity.getVersion().toString() : null)
			.projectPublicYn(projectEntity.getPublicYn())
			.pipelinePublicYn(pipelineEntity.getPublicYn())
			.ownerYn(isActualOwner) // 실제 소유자 여부에 따라 설정
			.build();

		// 로그 추가: 소유자 여부 확인
		log.info("buildResponse - 실제 소유자 여부: {}, 응답에 설정된 소유자 여부: {}", isActualOwner, projectInfo.getOwnerYn());

		// 데이터셋 정보 구성
		DatasetResponse dataset = buildDatasetDTO(datasetDocument);

		// 전처리 단계 정보 구성
		List<PreprocessingStepResponse> preprocessingSteps = buildPreprocessingStepsDTO(pipelineDocument);

		// 데이터 분할 정보 구성
		DataSplitResponse dataSplit = buildDataSplitDTO(pipelineDocument);

		// 분포 정보 구성
		List<DistributionResponse> distributions = buildDistributionsDTO(datasetDocument);

		// 상관 관계 매트릭스 구성
		CorrelationMatrixResponse correlationMatrix = buildCorrelationMatrixDTO(datasetDocument);

		// 응답 구성
		return GetPipelineDatasetInfoResponse.builder()
			.projectInfo(projectInfo)
			.dataset(dataset)
			.preprocessingSteps(preprocessingSteps)
			.dataSplit(dataSplit)
			.distributions(distributions)
			.correlationMatrix(correlationMatrix)
			.build();
	}

	/**
	 * 데이터셋 DTO를 구성하는 메서드
	 * @param datasetDocument 데이터셋 문서
	 * @return 데이터셋 DTO
	 */
	private DatasetResponse buildDatasetDTO(DatasetDocument datasetDocument) {
		// 결측치 비율 계산
		String missingRate = calculateMissingRate(datasetDocument);

		return DatasetResponse.builder()
			.id(datasetDocument.getId().toString())
			.recordCount(datasetDocument.getMetadata().getRowCount())
			.featureCount(datasetDocument.getMetadata().getColumnCount())
			.targetVariable("") // 타겟 변수는 파이프라인의 모델링 정보에서 가져와야 하지만, 현재 구현에서는 생략
			.missingRate(missingRate)
			.build();
	}

	/**
	 * 결측치 비율을 계산하는 메서드
	 * @param datasetDocument 데이터셋 문서
	 * @return 결측치 비율 (예: "5.2%")
	 */
	private String calculateMissingRate(DatasetDocument datasetDocument) {
		Map<String, Integer> missingValueCount = datasetDocument.getMetadata().getMissingValueCount();
		if (missingValueCount == null || missingValueCount.isEmpty()) {
			return "0.0%";
		}

		int totalMissingValues = missingValueCount.values().stream().mapToInt(Integer::intValue).sum();
		int totalValues = datasetDocument.getMetadata().getRowCount() * datasetDocument.getMetadata().getColumnCount();

		if (totalValues == 0) {
			return "0.0%";
		}

		double missingRate = (double) totalMissingValues / totalValues * 100;
		return String.format("%.1f%%", missingRate);
	}

	/**
	 * 전처리 단계 DTO 목록을 구성하는 메서드
	 * @param pipelineDocument 파이프라인 문서
	 * @return 전처리 단계 DTO 목록
	 */
	private List<PreprocessingStepResponse> buildPreprocessingStepsDTO(PipelineDocument pipelineDocument) {
		if (pipelineDocument.getHistory() == null || pipelineDocument.getHistory().isEmpty()) {
			return new ArrayList<>();
		}

		PipelineDocument.PipelineHistoryItem latestHistoryItem = pipelineDocument.getHistory()
			.get(pipelineDocument.getHistory().size() - 1);

		List<PipelineDocument.PreprocessingStep> steps = latestHistoryItem.getPreprocessingSteps();
		if (steps == null || steps.isEmpty()) {
			return new ArrayList<>();
		}

		return steps.stream()
			.map(step -> PreprocessingStepResponse.builder()
				.type(step.getType())
				.parameters(step.getParameters())
				.order(step.getOrder())
				.active(step.isActive())
				.build())
			.collect(Collectors.toList());
	}

	/**
	 * 데이터 분할 DTO를 구성하는 메서드
	 * @param pipelineDocument 파이프라인 문서
	 * @return 데이터 분할 DTO
	 */
	private DataSplitResponse buildDataSplitDTO(PipelineDocument pipelineDocument) {
		if (pipelineDocument.getHistory() == null || pipelineDocument.getHistory().isEmpty()) {
			return DataSplitResponse.builder()
				.method("RANDOM")
				.trainRatio(0.8)
				.testRatio(0.2)
				.validationRatio(0.0)
				.build();
		}

		PipelineDocument.PipelineHistoryItem latestHistoryItem = pipelineDocument.getHistory()
			.get(pipelineDocument.getHistory().size() - 1);

		PipelineDocument.ModelingInfo modelingInfo = latestHistoryItem.getModelingInfo();
		if (modelingInfo == null || modelingInfo.getDataSplit() == null) {
			return DataSplitResponse.builder()
				.method("RANDOM")
				.trainRatio(0.8)
				.testRatio(0.2)
				.validationRatio(0.0)
				.build();
		}

		PipelineDocument.DataSplit dataSplit = modelingInfo.getDataSplit();
		return DataSplitResponse.builder()
			.method("RANDOM") // 현재 구현에서는 항상 RANDOM
			.trainRatio(dataSplit.getTrainRatio())
			.testRatio(dataSplit.getTestRatio())
			.validationRatio(dataSplit.getValidationRatio())
			.build();
	}

	/**
	 * 분포 DTO 목록을 구성하는 메서드
	 * @param datasetDocument 데이터셋 문서
	 * @return 분포 DTO 목록
	 */
	private List<DistributionResponse> buildDistributionsDTO(DatasetDocument datasetDocument) {
		if (datasetDocument.getMetadata() == null || 
			datasetDocument.getMetadata().getStatistics() == null || 
			datasetDocument.getMetadata().getStatistics().getNumericFeatures() == null) {
			return new ArrayList<>();
		}

		Map<String, NumericFeature> numericFeatures = datasetDocument.getMetadata().getStatistics().getNumericFeatures();

		// 최대 4개의 주요 변수만 선택
		return numericFeatures.entrySet().stream()
			.limit(4)
			.map(entry -> {
				String featureName = entry.getKey();
				NumericFeature feature = entry.getValue();

				// 히스토그램 데이터가 없는 경우 빈 리스트 사용
				List<Integer> histogram = feature.getHistogram() != null ? feature.getHistogram() : new ArrayList<>();

				// x축 값 생성 (min부터 max까지 균등하게 나눔)
				List<Object> xValues = new ArrayList<>();
				if (feature.getMin() != null && feature.getMax() != null && !histogram.isEmpty()) {
					double min = feature.getMin();
					double max = feature.getMax();
					double step = (max - min) / (histogram.size() - 1);

					for (int i = 0; i < histogram.size(); i++) {
						xValues.add(min + i * step);
					}
				}

				return DistributionResponse.builder()
					.name(featureName)
					.type("histogram")
					.xAxis(DistributionResponse.AxisDTO.builder()
						.label(featureName)
						.values(xValues)
						.build())
					.yAxis(DistributionResponse.AxisDTO.builder()
						.label("Count")
						.values(new ArrayList<>(histogram))
						.build())
					.build();
			})
			.collect(Collectors.toList());
	}

	/**
	 * 상관 관계 매트릭스 DTO를 구성하는 메서드
	 * @param datasetDocument 데이터셋 문서
	 * @return 상관 관계 매트릭스 DTO
	 */
	private CorrelationMatrixResponse buildCorrelationMatrixDTO(DatasetDocument datasetDocument) {
		if (datasetDocument.getMetadata() == null || 
			datasetDocument.getMetadata().getStatistics() == null || 
			datasetDocument.getMetadata().getStatistics().getCorrelationMatrix() == null) {
			return CorrelationMatrixResponse.builder()
				.featureNames(new ArrayList<>())
				.matrix(new ArrayList<>())
				.build();
		}

		// 상관 관계 매트릭스 데이터
		List<List<Double>> correlationMatrix = datasetDocument.getMetadata().getStatistics().getCorrelationMatrix();

		// 특성 이름 목록 (데이터셋에서 추출)
		List<String> featureNames = new ArrayList<>(datasetDocument.getMetadata().getDataTypes().keySet());

		// 매트릭스 크기와 특성 이름 목록 크기가 다른 경우 조정
		if (correlationMatrix.size() != featureNames.size()) {
			// 간단한 구현을 위해 더 작은 크기로 맞춤
			int size = Math.min(correlationMatrix.size(), featureNames.size());
			featureNames = featureNames.subList(0, size);

			List<List<Double>> adjustedMatrix = new ArrayList<>();
			for (int i = 0; i < size; i++) {
				List<Double> row = correlationMatrix.get(i);
				if (row.size() > size) {
					adjustedMatrix.add(row.subList(0, size));
				} else {
					adjustedMatrix.add(row);
				}
			}
			correlationMatrix = adjustedMatrix;
		}

		return CorrelationMatrixResponse.builder()
			.featureNames(featureNames)
			.matrix(correlationMatrix)
			.build();
	}
}
