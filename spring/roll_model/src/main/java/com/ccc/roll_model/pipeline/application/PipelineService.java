package com.ccc.roll_model.pipeline.application;

import com.ccc.roll_model.like.infrastructure.repository.mysql.PipelineLikeRepository;
import com.ccc.roll_model.member.infrastructure.MemberJpaRepository;
import com.ccc.roll_model.pipeline.infrastructure.repository.mongo.PipelineMongoRepository;
import com.ccc.roll_model.pipeline.ui.dto.response.ClassificationResponse;
import com.ccc.roll_model.pipeline.ui.dto.response.GetModelAndMetricResponse;
import com.ccc.roll_model.pipeline.ui.dto.response.RegressionResponse;
import com.ccc.roll_model.project.infrastructure.entity.mongo.ModelDocument;
import com.ccc.roll_model.project.infrastructure.entity.mysql.ProjectEntity;
import com.ccc.roll_model.project.infrastructure.entity.mysql.VersionEntity;
import com.ccc.roll_model.project.infrastructure.repository.mongo.ModelRepository;
import com.ccc.roll_model.project.infrastructure.repository.mysql.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;

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
import com.ccc.roll_model.project.infrastructure.repository.mysql.VersionRepository;

import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class PipelineService {
	private final PipelineRepository pipelineRepository;
	private final MemberJpaRepository memberRepository;
	private final PipelineLikeRepository pipelineLikeRepository;
	private final PipelineMongoRepository pipelineMongoRepository;
	private final ModelRepository modelRepository;
	private final ProjectRepository ProjectRepository;
	private final ProjectRepository projectRepository;
	private final VersionRepository versionRepository;

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
	/**
	 *
	 * @param pipelineId
	 * @param memberId
	 * @return
	 */
	public GetModelAndMetricResponse getModelAndMetric(String pipelineId, Integer memberId) {

		PipelineEntity pipeline = pipelineRepository.findById(pipelineId)
				.orElseThrow(() -> new ApiException(ErrorCode.ACCESS_DENIED));

		log.info("파이프라인:{}", pipeline.getPipelineId());

		//ModelDocument modelDocument = modelRepository.findByPipelineId(pipelineId);

		List<ModelDocument> modelDocuments =modelRepository.findAllByPipelineId(pipelineId);

		if (modelDocuments == null) {
			throw new EntityNotFoundException("모델을 찾을 수 없습니다.");

		}

		log.info("모델 ModelDocument:{}", modelDocuments.size());

		ModelDocument modelDocument = modelDocuments.get(modelDocuments.size() - 1);

		ProjectEntity project= projectRepository.findById(pipeline.getProjectId())
				.orElseThrow(() -> new EntityNotFoundException("프로젝트를 찾을 수 없습니다."));

		VersionEntity version = versionRepository.findByPipelineId(pipeline.getPipelineId());

		// 프로젝트 정보 구성
		GetModelAndMetricResponse.ProjectInfo projectInfo =GetModelAndMetricResponse.ProjectInfo.builder()
				.title(project.getTitle())
				.category(project.getCategory().toString())
				.domain(project.getDomain().toString())
				.version(version != null ? version.getVersionNum() : null) // 필요에 따라 버전 정보 추가
				.projectPublicYn(project.getPublicYn()) // 프로젝트 공개 여부는 필요에 따라 설정
				.pipelinePublicYn(pipeline.getPublicYn()) // 파이프라인 공개 여부는 필요에 따라 설정
				.ownerYn(project.getMemberEntity().getMemberId().equals(memberId)) // 소유자 여부는 필요에 따라 설정
				.build();
		log.info("ProjectInfo:{}", projectInfo.getCategory());

		// 모델 파라미터 구성
		List<GetModelAndMetricResponse.ModelParameters> modelParameters = ModelResponseAssembler.buildModelParameters(modelDocument);
		log.info("ModelParameters:{}", modelParameters);

		// 타겟 정보 구성
		List<Map<String,String>> targetInfo = ModelResponseAssembler.buildTargetInfo(modelDocument);
		log.info("TargetInfo:{}", targetInfo);

		// 성능 메트릭 구성
		List<GetModelAndMetricResponse.PerformanceMetric> performanceMetrics = ModelResponseAssembler.buildPerformanceMetrics(modelDocument, projectInfo.getCategory());
		log.info("PerformanceMetrics:{}", performanceMetrics);

		// 특성 중요도 구성
		List<GetModelAndMetricResponse.FeatureImportance> featureImportance = ModelResponseAssembler.buildFeatureImportance(modelDocument);

		if (project.getCategory().toString().equals("CLASSIFICATION")) {

			ClassificationResponse.ConfusionMatrix confusionMatrix =ModelResponseAssembler.buildConfusionMatrix(modelDocument);
			log.info("ConfusionMatrix:{}", confusionMatrix);

			return ClassificationResponse.classificationBuilder()
					.projectInfo(projectInfo)
					.algorithm(modelDocument.getAlgorithm())
					.modelParameters(modelParameters)
					.targetInfo(targetInfo)
					.performanceMetrics(performanceMetrics)
					.confusionMatrix(confusionMatrix)
					.featureImportance(featureImportance)
					.build();
		} else if (project.getCategory().toString().equals("REGRESSION")){
			RegressionResponse.ResidualPlot residualPlot;
			RegressionResponse.ActualVsPredicted actualVsPredicted;

			if(modelDocument.getPerformance() != null) {
				residualPlot = ModelResponseAssembler.buildResidualPlot(modelDocument.getPerformance().getRegression());

				actualVsPredicted = ModelResponseAssembler.buildActualVsPredicted(modelDocument);
				log.info("ActualVsPredicted:{}", actualVsPredicted);
				return RegressionResponse.regressionBuilder()
						.projectInfo(projectInfo)
						.algorithm(modelDocument.getAlgorithm())
						.modelParameters(modelParameters)
						.targetInfo(targetInfo)
						.performanceMetrics(performanceMetrics)
						.actualVsPredicted(actualVsPredicted)
						.residualPlot(residualPlot)
						.featureImportance(featureImportance)
						.build();
			}


			return RegressionResponse.regressionBuilder()
					.projectInfo(projectInfo)
					.algorithm(modelDocument.getAlgorithm())
					.modelParameters(modelParameters)
					.targetInfo(targetInfo)
					.performanceMetrics(performanceMetrics)
					.actualVsPredicted(null)
					.residualPlot(null)
					.featureImportance(featureImportance)
					.build();
		}

		return null;
	}
}




