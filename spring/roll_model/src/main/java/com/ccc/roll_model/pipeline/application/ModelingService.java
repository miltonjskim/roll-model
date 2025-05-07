package com.ccc.roll_model.pipeline.application;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import com.ccc.roll_model.pipeline.domain.model.client.MessagePublisher;
import com.ccc.roll_model.pipeline.domain.model.vo.ModelingData;

import org.apache.catalina.Pipeline;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ccc.roll_model.pipeline.application.command.ExecuteModelingCommand;
import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;
import com.ccc.roll_model.pipeline.domain.model.common.ModelingInfo;
import com.ccc.roll_model.pipeline.infrastructure.ModelingInfoMapper;
import com.ccc.roll_model.pipeline.infrastructure.entity.mongo.PipelineDocument;
import com.ccc.roll_model.pipeline.infrastructure.repository.mongo.PipelineMongoRepository;
import com.ccc.roll_model.project.infrastructure.entity.mongo.DatasetDocument;
import com.ccc.roll_model.project.infrastructure.entity.mongo.ModelDocument;
import com.ccc.roll_model.project.infrastructure.entity.mysql.PipelineEntity;
import com.ccc.roll_model.project.infrastructure.entity.mysql.Status;
import com.ccc.roll_model.project.infrastructure.repository.mongo.DatasetRepository;
import com.ccc.roll_model.project.infrastructure.repository.mongo.ModelRepository;
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
	private final ModelRepository modelRepository;
	private final ModelingInfoMapper modelingInfoMapper;

	public void executeModeling(ExecuteModelingCommand command) {
		// 커맨드 유효성 검사
		if (!command.validate()) {
			throw new IllegalArgumentException("모델링 실행 명령이 유효하지 않습니다.");
		}

		// 파이프라인 존재 여부 확인 : mysql
		PipelineEntity pipeline = pipelineRepository.findById(command.getPipelineId())
			.orElseThrow(() -> new EntityNotFoundException("파이프라인을 찾을 수 없습니다. : mysql"));

		// 파이프라인 존재 여부 확인 : mongo
		System.out.println(command.getModelingInfo());
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

		// 상태 저장
		saveModelingStatus(
			command,
			pipeline,
			pipelineDocument,
			modelingInfo,
			modelParameter
		);

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
		// messagePublisher.publishProcessingRequest(modelingData);
	}

	/**
	 * 파이프라인 문서로부터 데이터셋 파일 경로를 가져오는 메서드
	 * @param pipelineDocument 파이프라인 문서
	 * @return 데이터셋 파일 경로
	 */
	private String getDatasetFilePath(PipelineDocument pipelineDocument) {
		// 사용할 datasetId 결정
		String datasetId;

		if (pipelineDocument.getHistory() == null || pipelineDocument.getHistory().isEmpty()) {
			// 히스토리가 없는 경우 원본 데이터셋 id 사용
			datasetId = pipelineDocument.getOriginalDatasetId();
		} else {
			// 히스토리가 있는 경우 가장 최근 전처리 단계의 dataset_id 사용
			PipelineDocument.PipelineHistoryItem latestHistoryItem = pipelineDocument.getHistory()
				.get(pipelineDocument.getHistory().size() - 1);

			List<PipelineDocument.PreprocessingStep> steps = latestHistoryItem.getPreprocessingSteps();

			// 전처리 단계가 없는 경우 원본 데이터셋 id 사용
			if (steps == null || steps.isEmpty()) {
				datasetId = pipelineDocument.getOriginalDatasetId();
			} else {
				// 전처리 단계가 있는 경우 가장 최근 전처리 단계의 dataset_id 사용
				PipelineDocument.PreprocessingStep latestStep = steps.get(steps.size() - 1);
				datasetId = latestStep.getPreprocessedDatasetId();

				// dataset_id가 없거나 비어있는 경우 원본 dataset_id로 폴백
				if (datasetId == null || datasetId.isEmpty()) {
					datasetId = pipelineDocument.getOriginalDatasetId();
				}
			}
		}

		// object_id로 데이터셋 문서 조회
		System.out.println("datasetId : "+datasetId);
		DatasetDocument datasetDocument = datasetRepository.findById(new ObjectId(datasetId))
			.orElseThrow(()->new EntityNotFoundException("데이터셋을 찾을 수 없습니다."));

		// 데이터셋 파일 경로 반환
		return datasetDocument.getDatasetFilePath();
	}

	private ModelDocument initializeModelDocument(ExecuteModelingCommand command, PipelineDocument pipelineDocument, ModelParameter modelParameter) {
		ModelingInfo modelingInfo = command.getModelingInfo();

		// 모델 문서 기본 정보 설정 (모델링 시작 전에 알 수 있는 정보들)
		ModelDocument modelDocument = ModelDocument.builder()
			.pipelineId(command.getPipelineId())
			.projectId(pipelineDocument.getProjectId())
			.memberId(command.getMemberId())
			.modelTitle(generateDefaultModelTitle(modelingInfo.getAlgorithm(), modelingInfo.getModelType().toString()))
			.modelDescription("설명이 없습니다.") // 기본 설명
			.modelType(modelingInfo.getModelType().toString())
			.algorithm(modelingInfo.getAlgorithm())
			.registeredAt(LocalDateTime.now())
			.build();

		// 파라미터 삽입
		modelDocument.setParameters(modelParameter);

		// TrainInfo 설정 (시작 시간 및 타겟 정보)
		ModelDocument.TrainInfo trainInfo = ModelDocument.TrainInfo.builder()
			.startTime(LocalDateTime.now())
			.targetFeature(modelingInfo.getTargetFeature())
			.build();

		modelDocument.setTrainInfo(trainInfo);

		// Features 정보는 모델링 중에 설정됨
		// Performance, FeatureImportance 등은 모델링 완료 후 설정

		return modelDocument;
	}

	/**
	 * 기본 모델 제목 생성
	 */
	private String generateDefaultModelTitle(String algorithm, String modelType) {
		LocalDateTime now = LocalDateTime.now();
		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
		String timestamp = now.format(formatter);

		return algorithm + "_" + modelType + "_" + timestamp;
	}

	/**
	 * 모델링 실행 전에 상태 저장 및 초기 모델 문서 생성
	 */
	private void saveModelingStatus(
		ExecuteModelingCommand command,
		PipelineEntity pipeline,
		PipelineDocument pipelineDocument,
		ModelingInfo modelingInfo,
		ModelParameter modelParameter
		) {
		// 1. MongoDB에 초기 Model 문서 생성
		ModelDocument initialModelDocument = initializeModelDocument(command, pipelineDocument, modelParameter);
		ObjectId modelId = modelRepository.save(initialModelDocument).getId();

		// 2. MongoDB 파이프라인 문서 업데이트
		PipelineDocument.PipelineHistoryItem latestHistoryItem;

		if (pipelineDocument.getHistory() == null) {
			// 히스토리가 없는 경우 새로 생성
			pipelineDocument.setHistory(new ArrayList<>());
			latestHistoryItem = PipelineDocument.PipelineHistoryItem.builder()
				.status(String.valueOf(Status.LEARNING))
				.modelId(modelId) // 초기 모델 ID 설정
				.build();
			pipelineDocument.getHistory().add(latestHistoryItem);
		} else if (pipelineDocument.getHistory().isEmpty()) {
			// 히스토리 리스트는 있지만 비어있는 경우
			latestHistoryItem = PipelineDocument.PipelineHistoryItem.builder()
				.status(String.valueOf(Status.LEARNING))
				.modelId(modelId) // 초기 모델 ID 설정
				.build();
			pipelineDocument.getHistory().add(latestHistoryItem);
		} else {
			// 히스토리가 있는 경우 가장 최근 아이템 업데이트
			latestHistoryItem = pipelineDocument.getHistory().get(pipelineDocument.getHistory().size() - 1);
			latestHistoryItem.setStatus(String.valueOf(Status.LEARNING));
			latestHistoryItem.setModelId(modelId); // 초기 모델 ID 설정
		}

		PipelineDocument.ModelingInfo pipelineModelingInfo = modelingInfoMapper.toDocumentModelingInfo(modelingInfo);
		// modelingInfo 업데이트

		latestHistoryItem.setModelingInfo(pipelineModelingInfo);

		// MongoDB 파이프라인 문서 저장
		pipelineMongoRepository.save(pipelineDocument);

		// 3. MySQL 파이프라인 상태 변경
		pipeline.updateStatus(Status.LEARNING);
		pipelineRepository.save(pipeline);

		log.info("파이프라인 상태를 MODELING으로 업데이트했습니다. 파이프라인 ID: {}, 초기 모델 ID: {}",
			pipeline.getPipelineId(), modelId);
	}

}
