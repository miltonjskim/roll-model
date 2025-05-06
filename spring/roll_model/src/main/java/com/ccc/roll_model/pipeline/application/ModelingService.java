package com.ccc.roll_model.pipeline.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ccc.roll_model.pipeline.application.command.ExecuteModelingCommand;
import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;
import com.ccc.roll_model.pipeline.domain.model.common.ModelingInfo;
import com.ccc.roll_model.project.infrastructure.entity.mysql.PipelineEntity;
import com.ccc.roll_model.project.infrastructure.repository.mysql.PipelineRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class ModelingService {

	private final PipelineRepository pipelineRepository;

	public void executeModeling(ExecuteModelingCommand  command) {
		// 커맨드 유효성 검사
		if (!command.validate()) {
			throw new IllegalArgumentException("모델링 실행 명령이 유효하지 않습니다.");
		}

		// 파이프라인 존재 여부 확인
		PipelineEntity pipeline = pipelineRepository.findById(command.getPipelineId())
			.orElseThrow(() -> new EntityNotFoundException("파이프라인을 찾을 수 없습니다."));

		// 모델링 정보 추출 및 파라미터 객체 생성
		ModelingInfo modelingInfo = command.getModelingInfo();

		ModelParameter modelParameter = ModelParameterFactory.createModelParameters(
			modelingInfo.getAlgorithm(),
			modelingInfo.getParameters()
		);
	}
}
