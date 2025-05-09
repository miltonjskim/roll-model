package com.ccc.roll_model.pipeline.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ccc.roll_model.global.exception.ApiException;
import com.ccc.roll_model.global.exception.ErrorCode;
import com.ccc.roll_model.project.infrastructure.entity.mysql.PipelineEntity;
import com.ccc.roll_model.project.infrastructure.repository.mysql.PipelineRepository;
import com.ccc.roll_model.pipeline.ui.dto.response.UpdatePipelineVisibilityResponse;  // 이 줄 추가

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class PipelineService {
	private final PipelineRepository pipelineRepository;

	public void getPipelineStatus() {

	}

	public void deletePipeline(String pipelineId, Integer memberId) {
		// 파이프라인이 존재하는지 & 요청한 사용자가 소유자인지 함께 확인
		PipelineEntity pipeline = pipelineRepository.findByPipelineIdAndProjectMemberId(pipelineId, memberId)
				.orElseThrow(() -> new ApiException(ErrorCode.ACCESS_DENIED));

		pipelineRepository.markAsDeleted(pipelineId);
	}

	@Transactional
	public UpdatePipelineVisibilityResponse updatePipelineVisibility(String pipelineId, Integer memberId, Boolean publicYn) {
		PipelineEntity pipeline = pipelineRepository.findByPipelineIdAndProjectMemberId(pipelineId, memberId)
				.orElseThrow(() -> new ApiException(ErrorCode.ACCESS_DENIED));

		pipeline.updateVisibility(publicYn);
		pipelineRepository.save(pipeline);

		return UpdatePipelineVisibilityResponse.builder()
				.isPublic(publicYn)
				.build();
	}
}
