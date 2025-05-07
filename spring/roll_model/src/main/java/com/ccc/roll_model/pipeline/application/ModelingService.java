package com.ccc.roll_model.pipeline.application;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ccc.roll_model.global.exception.ApiException;
import com.ccc.roll_model.pipeline.application.command.ExecuteModelingCommand;
import com.ccc.roll_model.pipeline.application.command.GetPipelineDatasetInfoCommand;
import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;
import com.ccc.roll_model.pipeline.domain.model.common.ModelingInfo;
import com.ccc.roll_model.pipeline.infrastructure.entity.mongo.PipelineDocument;
import com.ccc.roll_model.pipeline.infrastructure.repository.mongo.PipelineMongoRepository;
import com.ccc.roll_model.pipeline.ui.dto.response.GetPipelineDatasetInfoResponse;
import com.ccc.roll_model.project.infrastructure.entity.mongo.DatasetDocument;
import com.ccc.roll_model.project.infrastructure.entity.mysql.PipelineEntity;
import com.ccc.roll_model.project.infrastructure.entity.mysql.ProjectEntity;
import com.ccc.roll_model.project.infrastructure.repository.mongo.DatasetRepository;
import com.ccc.roll_model.project.infrastructure.repository.mysql.PipelineRepository;
import com.ccc.roll_model.project.infrastructure.repository.mysql.ProjectRepository;

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

	public void executeModeling(ExecuteModelingCommand command) {
		// 커맨드 유효성 검사
		if (!command.validate()) {
			throw new IllegalArgumentException("모델링 실행 명령이 유효하지 않습니다.");
		}

		// 파이프라인 존재 여부 확인 : mysql
		PipelineEntity pipeline = pipelineRepository.findById(command.getPipelineId())
			.orElseThrow(() -> new EntityNotFoundException("파이프라인을 찾을 수 없습니다. : mysql"));

		// 파이프라인 존재 여부 확인 : mongo
		PipelineDocument pipelineDocument = pipelineMongoRepository.findById(new ObjectId(command.getPipelineId()))
			.orElseThrow(() -> new EntityNotFoundException("파이프라인을 찾을 수 없습니다. : mongo"));

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

		// 저장
	}

	/**
	 * 파이프라인 데이터셋 정보를 조회하는 메서드
	 * @param command 파이프라인 데이터셋 정보 조회 명령
	 * @return 파이프라인 데이터셋 정보 응답
	 */
	public GetPipelineDatasetInfoResponse getPipelineDatasetInfo(GetPipelineDatasetInfoCommand command) {
		// 파이프라인 존재 여부 확인 : mongo (MongoDB ID로 직접 조회)
		PipelineDocument pipelineDocument = pipelineMongoRepository.findById(new ObjectId(command.getPipelineId()))
			.orElseThrow(() -> new EntityNotFoundException("파이프라인을 찾을 수 없습니다. : mongo"));

		// 프로젝트 정보 조회 (MongoDB에서 가져온 project_id로 MySQL 조회)
		ProjectEntity projectEntity = projectRepository.findById(pipelineDocument.getProjectId())
			.orElseThrow(() -> new EntityNotFoundException("프로젝트를 찾을 수 없습니다."));

		// MySQL의 파이프라인 정보 조회 (필요한 경우)
		PipelineEntity pipelineEntity = null;
		try {
			pipelineEntity = pipelineRepository.findById(command.getPipelineId()).orElse(null);
		} catch (Exception e) {
			log.warn("MySQL에서 파이프라인을 찾을 수 없습니다. MongoDB ID를 사용합니다.", e);
		}

		// 데이터셋 정보 조회
		String etag = getDatasetEtag(pipelineDocument);
		DatasetDocument datasetDocument = datasetRepository.findByEtag(etag);

		if (datasetDocument == null) {
			throw new EntityNotFoundException("데이터셋을 찾을 수 없습니다. etag: " + etag);
		}

		// 결측치 비율 계산
		int totalMissingValues = 0;
		int totalCells = 0;

		if (datasetDocument.getMetadata() != null && datasetDocument.getMetadata().getMissingValueCount() != null) {
			for (Integer count : datasetDocument.getMetadata().getMissingValueCount().values()) {
				totalMissingValues += count;
			}
			totalCells = datasetDocument.getMetadata().getRowCount() * datasetDocument.getMetadata().getColumnCount();
		}

		String missingRate = "0.0%";
		if (totalCells > 0) {
			double rate = (double) totalMissingValues / totalCells * 100;
			missingRate = String.format("%.1f%%", rate);
		}

		// 전처리 단계 및 데이터 분할 정보 추출
		List<GetPipelineDatasetInfoResponse.PreprocessingStep> preprocessingSteps = new ArrayList<>();
		GetPipelineDatasetInfoResponse.DataSplit dataSplit = null;

		if (pipelineDocument.getHistory() != null && !pipelineDocument.getHistory().isEmpty()) {
			PipelineDocument.PipelineHistoryItem latestHistoryItem = pipelineDocument.getHistory()
				.get(pipelineDocument.getHistory().size() - 1);

			// 전처리 단계 추출
			if (latestHistoryItem.getPreprocessingSteps() != null) {
				preprocessingSteps = latestHistoryItem.getPreprocessingSteps().stream()
					.map(step -> GetPipelineDatasetInfoResponse.PreprocessingStep.builder()
						.type(step.getType())
						.parameters(step.getParameters())
						.order(step.getOrder())
						.active(step.isActive())
						.build())
					.collect(Collectors.toList());
			}

			// 데이터 분할 정보 추출
			if (latestHistoryItem.getModelingInfo() != null && latestHistoryItem.getModelingInfo().getDataSplit() != null) {
				PipelineDocument.DataSplit split = latestHistoryItem.getModelingInfo().getDataSplit();
				dataSplit = GetPipelineDatasetInfoResponse.DataSplit.builder()
					.method("RANDOM") // 기본값 설정
					.trainRatio(split.getTrainRatio())
					.testRatio(split.getTestRatio())
					.validationRatio(split.getValidationRatio())
					.build();
			}
		}

		// 분포 정보 생성 (최대 4개)
		List<GetPipelineDatasetInfoResponse.Distribution> distributions = new ArrayList<>();
		if (datasetDocument.getMetadata() != null && datasetDocument.getMetadata().getStatistics() != null
				&& datasetDocument.getMetadata().getStatistics().getNumericFeatures() != null) {

			// 숫자형 특성에서 분포 정보 추출 (최대 4개)
			int count = 0;
			for (Map.Entry<String, DatasetDocument.Metadata.Statistics.NumericFeature> entry :
					datasetDocument.getMetadata().getStatistics().getNumericFeatures().entrySet()) {

				if (count >= 4) break; // 최대 4개만 추출

				DatasetDocument.Metadata.Statistics.NumericFeature feature = entry.getValue();
				if (feature.getHistogram() != null) {
					// 히스토그램 데이터를 기반으로 분포 생성
					List<Double> xValues = new ArrayList<>();
					double min = feature.getMin();
					double max = feature.getMax();
					double step = (max - min) / (feature.getHistogram().size() - 1);

					for (int i = 0; i < feature.getHistogram().size(); i++) {
						xValues.add(min + i * step);
					}

					List<Double> yValues = feature.getHistogram().stream()
						.map(Integer::doubleValue)
						.collect(Collectors.toList());

					GetPipelineDatasetInfoResponse.Distribution distribution = GetPipelineDatasetInfoResponse.Distribution.builder()
						.name(entry.getKey())
						.type("histogram")
						.xAxis(GetPipelineDatasetInfoResponse.Distribution.Axis.builder()
							.label(entry.getKey())
							.values(xValues)
							.build())
						.yAxis(GetPipelineDatasetInfoResponse.Distribution.Axis.builder()
							.label("Count")
							.values(yValues)
							.build())
						.build();

					distributions.add(distribution);
					count++;
				}
			}
		}

		// 상관관계 매트릭스 생성
		GetPipelineDatasetInfoResponse.CorrelationMatrix correlationMatrix = null;
		if (datasetDocument.getMetadata() != null && datasetDocument.getMetadata().getStatistics() != null
				&& datasetDocument.getMetadata().getStatistics().getCorrelationMatrix() != null) {

			// 특성 이름 목록 생성 (데이터 타입에서 추출)
			List<String> featureNames = new ArrayList<>(datasetDocument.getMetadata().getDataTypes().keySet());

			correlationMatrix = GetPipelineDatasetInfoResponse.CorrelationMatrix.builder()
				.featureNames(featureNames)
				.matrix(datasetDocument.getMetadata().getStatistics().getCorrelationMatrix())
				.build();
		}

		// 응답 생성
		return GetPipelineDatasetInfoResponse.builder()
			.projectInfo(GetPipelineDatasetInfoResponse.ProjectInfo.builder()
				.title(projectEntity.getTitle())
				.category(projectEntity.getCategory().toString())
				.domain(projectEntity.getDomain().toString())
				.version(pipelineEntity != null ? pipelineEntity.getVersion() : 1.0f)
				.projectPublicYn(projectEntity.getPublicYn())
				.pipelinePublicYn(pipelineEntity != null ? pipelineEntity.getPublicYn() : false)
				.ownerYn(projectEntity.getMemberEntity().getMemberId().equals(command.getMemberId()))
				.build())
			.dataset(GetPipelineDatasetInfoResponse.Dataset.builder()
				.id(datasetDocument.getId().toString())
				.recordCount(datasetDocument.getMetadata().getRowCount())
				.featureCount(datasetDocument.getMetadata().getColumnCount())
				.targetVariable(pipelineEntity != null ? pipelineEntity.getTargetFeature() : null)
				.missingRate(missingRate)
				.build())
			.preprocessingSteps(preprocessingSteps)
			.dataSplit(dataSplit)
			.distributions(distributions)
			.correlationMatrix(correlationMatrix)
			.build();
	}

	/**
	 * 파이프라인 문서로부터 데이터셋 파일 경로를 가져오는 메서드
	 * @param pipelineDocument 파이프라인 문서
	 * @return 데이터셋 파일 경로
	 */
	public String getDatasetFilePath(PipelineDocument pipelineDocument) {
		// etag 가져오기
		String etag = getDatasetEtag(pipelineDocument);

		// etag로 데이터셋 문서 조회
		DatasetDocument datasetDocument = datasetRepository.findByEtag(etag);

		if (datasetDocument == null) {
			throw new EntityNotFoundException("데이터셋을 찾을 수 없습니다. etag: " + etag);
		}

		// 데이터셋 파일 경로 반환
		return datasetDocument.getDatasetFilePath();
	}

	/**
	 * 파이프라인 문서로부터 데이터셋 etag를 가져오는 메서드
	 * @param pipelineDocument 파이프라인 문서
	 * @return 데이터셋 etag
	 */
	private String getDatasetEtag(PipelineDocument pipelineDocument) {
		// 사용할 etag 결정
		String etag;

		if (pipelineDocument.getHistory() == null || pipelineDocument.getHistory().isEmpty()) {
			// 히스토리가 없는 경우 원본 데이터셋 etag 사용
			etag = pipelineDocument.getOriginalDatasetEtag();
		} else {
			// 히스토리가 있는 경우 가장 최근 전처리 단계의 etag 사용
			PipelineDocument.PipelineHistoryItem latestHistoryItem = pipelineDocument.getHistory()
				.get(pipelineDocument.getHistory().size() - 1);

			List<PipelineDocument.PreprocessingStep> steps = latestHistoryItem.getPreprocessingSteps();

			// 전처리 단계가 없는 경우 원본 데이터셋 etag 사용
			if (steps == null || steps.isEmpty()) {
				etag = pipelineDocument.getOriginalDatasetEtag();
			} else {
				// 전처리 단계가 있는 경우 가장 최근 전처리 단계의 etag 사용
				PipelineDocument.PreprocessingStep latestStep = steps.get(steps.size() - 1);
				etag = latestStep.getPreprocessedDatasetEtag();

				// etag가 없거나 비어있는 경우 원본 etag로 폴백
				if (etag == null || etag.isEmpty()) {
					etag = pipelineDocument.getOriginalDatasetEtag();
				}
			}
		}

		// etag로 데이터셋 문서 조회
		DatasetDocument datasetDocument = datasetRepository.findByEtag(etag);

		if (datasetDocument == null) {
			throw new EntityNotFoundException("데이터셋을 찾을 수 없습니다. etag: " + etag);
		}

		// 데이터셋 파일 경로 반환
		return datasetDocument.getDatasetFilePath();
	}
}
