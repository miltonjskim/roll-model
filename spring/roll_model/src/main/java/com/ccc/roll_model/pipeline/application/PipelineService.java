package com.ccc.roll_model.pipeline.application;

import com.ccc.roll_model.like.infrastructure.repository.mysql.PipelineLikeRepository;
import com.ccc.roll_model.member.infrastructure.MemberJpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ccc.roll_model.global.exception.ApiException;
import com.ccc.roll_model.global.exception.ErrorCode;
import com.ccc.roll_model.project.infrastructure.entity.mysql.PipelineEntity;
import com.ccc.roll_model.project.infrastructure.repository.mysql.PipelineRepository;
import com.ccc.roll_model.pipeline.ui.dto.response.UpdatePipelineVisibilityResponse;
import com.ccc.roll_model.like.infrastructure.entity.PipelineLikeEntity;
import com.ccc.roll_model.pipeline.ui.dto.request.PipelineLikeRequest;
import com.ccc.roll_model.pipeline.ui.dto.response.PipelineLikeResponse;
import com.ccc.roll_model.member.infrastructure.MemberEntity;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class PipelineService {
	private final PipelineRepository pipelineRepository;
	private final MemberJpaRepository memberRepository;
	private final PipelineLikeRepository pipelineLikeRepository;

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

	@Transactional
	public PipelineLikeResponse updatePipelineLike(String pipelineId, Integer memberId, PipelineLikeRequest request) {
		// 파이프라인 존재 여부 확인
		PipelineEntity pipeline = pipelineRepository.findById(pipelineId)
				.orElseThrow(() -> new ApiException(ErrorCode.PIPELINE_NOT_FOUND));

		// 사용자 존재 여부 확인
		MemberEntity member = memberRepository.findById(memberId)
				.orElseThrow(() -> new ApiException(ErrorCode.PIPELINE_NOT_FOUND));

		// 기존 좋아요 여부 확인
		boolean alreadyLiked = pipelineLikeRepository.existsByPipelineEntityAndMemberEntity(pipeline, member);

		if (Boolean.TRUE.equals(request.getLikeYn())) {
			// 좋아요 요청이고 아직 좋아요가 없으면 추가
			if (!alreadyLiked) {
				PipelineLikeEntity like = PipelineLikeEntity.builder()
						.memberEntity(member)
						.pipelineEntity(pipeline)
						.build();
				pipelineLikeRepository.save(like);

				// 파이프라인 좋아요 수 증가
				pipeline.incrementLikeCount();
				pipelineRepository.save(pipeline);
			}
			return PipelineLikeResponse.builder().likeYn(true).build();
		} else {
			// 좋아요 취소 요청이고 좋아요가 있으면 삭제
			if (alreadyLiked) {
				pipelineLikeRepository.findByPipelineEntityAndMemberEntity(pipeline, member)
						.ifPresent(pipelineLikeRepository::delete);

				// 파이프라인 좋아요 수 감소
				pipeline.decrementLikeCount();
				pipelineRepository.save(pipeline);
			}
			return PipelineLikeResponse.builder().likeYn(false).build();
		}
	}
}