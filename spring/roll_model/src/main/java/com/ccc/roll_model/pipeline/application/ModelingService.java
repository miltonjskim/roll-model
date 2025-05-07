package com.ccc.roll_model.pipeline.application;

import java.util.List;

import com.ccc.roll_model.pipeline.domain.model.client.MessagePublisher;
import com.ccc.roll_model.pipeline.domain.model.vo.ModelingData;
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
