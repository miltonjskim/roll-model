package com.ccc.roll_model.pipeline.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ccc.roll_model.global.exception.ApiException;
import com.ccc.roll_model.global.exception.ErrorCode;
import com.ccc.roll_model.project.infrastructure.entity.mysql.PipelineEntity;
import com.ccc.roll_model.project.infrastructure.repository.mysql.PipelineRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class PipelineService {
	private final PipelineRepository pipelineRepository;

	public void getPipelineStatus() {

	}

	public void deletePipeline(String pipelineId, Integer memberId) {
		// 파이프라인이 존재하는지 확인부터
		PipelineEntity pipeline = pipelineRepository.findById(pipelineId)
				.orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

		pipelineRepository.markAsDeleted(pipelineId);
	}
}
