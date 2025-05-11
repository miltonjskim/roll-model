package com.ccc.roll_model.project.application;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ccc.roll_model.global.exception.ApiException;
import com.ccc.roll_model.global.exception.ErrorCode;
import com.ccc.roll_model.member.domain.Member;
import com.ccc.roll_model.member.domain.MemberRepository;
import com.ccc.roll_model.project.application.command.GetProjectVersionsCommand;
import com.ccc.roll_model.project.infrastructure.entity.mongo.ModelDocument;
import com.ccc.roll_model.project.infrastructure.entity.mysql.Category;
import com.ccc.roll_model.project.infrastructure.entity.mysql.PipelineEntity;
import com.ccc.roll_model.project.infrastructure.entity.mysql.ProjectEntity;
import com.ccc.roll_model.project.infrastructure.repository.mongo.ModelRepository;
import com.ccc.roll_model.project.infrastructure.repository.mysql.PipelineRepository;
import com.ccc.roll_model.project.infrastructure.repository.mysql.ProjectRepository;
import com.ccc.roll_model.project.ui.response.GetProjectVersionsResponse;
import com.ccc.roll_model.project.ui.response.GetProjectVersionsResponse.PipelineInfo;
import com.ccc.roll_model.project.ui.response.GetProjectVersionsResponse.ProjectInfo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectVersionService {

    private final ProjectRepository projectRepository;
    private final PipelineRepository pipelineRepository;
    private final ModelRepository modelRepository;
    private final MemberRepository memberRepository;

    @Transactional(readOnly = true)
    public GetProjectVersionsResponse getProjectVersions(GetProjectVersionsCommand command) {
        log.info("Getting project versions for projectId: {}, pipelineId: {}, memberId: {}",
                command.getProjectId(), command.getPipelineId(), command.getMemberId());

        // 1. 현재 사용자 조회
        Member member = memberRepository.findById(command.getMemberId())
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        // 2. 프로젝트 조회
        ProjectEntity project = projectRepository.findById(command.getProjectId())
                .orElseThrow(() -> new ApiException(ErrorCode.INVALID_INPUT_PARAMETER));

        // 3. 프로젝트 소유자 여부 확인
        boolean isProjectOwner = project.getMemberEntity().getMemberId().equals(member.getMemberId());
        log.debug("User is project owner: {}", isProjectOwner);

        // 4. 현재 파이프라인 조회 (요청에 포함된 경우)
        PipelineEntity currentPipeline = null;
        if (command.getPipelineId() != null && !command.getPipelineId().isEmpty()) {
            currentPipeline = pipelineRepository.findById(command.getPipelineId())
                    .orElseThrow(() -> new ApiException(ErrorCode.PIPELINE_NOT_FOUND));
            log.debug("Current pipeline found: {}", currentPipeline.getPipelineId());
        }

        // 5. 프로젝트에 속한 모든 파이프라인 조회
        List<PipelineEntity> pipelines = pipelineRepository.findAll().stream()
                .filter(p -> p.getProjectEntity().getProjectId().equals(command.getProjectId()))
                .toList();
        log.debug("Found {} pipelines for project", pipelines.size());

        // 6. 파이프라인 정보 매핑 및 응답 구성
        List<PipelineInfo> pipelineInfoList = new ArrayList<>();

        for (PipelineEntity pipeline : pipelines) {
            // 삭제된 파이프라인 필터링 (프로젝트 소유자가 아닌 경우)
            if (pipeline.getDeletedYn() && !isProjectOwner) {
                continue;
            }

            // 모델 정보 조회 (runningDuration 용)
            ModelDocument model = modelRepository.findByPipelineId(pipeline.getPipelineId());

            PipelineInfo pipelineInfo = buildPipelineInfo(pipeline, model, project, isProjectOwner);
            pipelineInfoList.add(pipelineInfo);
        }

        log.debug("Built {} pipeline info objects", pipelineInfoList.size());

        // 7. 프로젝트 정보 구성
        ProjectInfo projectInfo = ProjectInfo.builder()
                .title(project.getTitle())
                .category(project.getCategory().name())
                .domain(project.getDomain().name())
                .version(currentPipeline != null ? currentPipeline.getVersion().toString() : "1.0")
                .projectPublicYn(project.getPublicYn())
                .pipelinePublicYn(currentPipeline != null ? currentPipeline.getPublicYn() : false)
                .ownerYn(isProjectOwner)
                .build();

        // 8. 최종 응답 구성
        GetProjectVersionsResponse response = GetProjectVersionsResponse.builder()
                .projectInfo(projectInfo)
                .pipelines(pipelineInfoList)
                .build();

        log.info("Returning response with {} pipelines", pipelineInfoList.size());
        return response;
    }

    private PipelineInfo buildPipelineInfo(
            PipelineEntity pipeline,
            ModelDocument model,
            ProjectEntity project,
            boolean isProjectOwner) {

        // 프로젝트 카테고리에 따라 성능 지표 설정
        Double accuracy = null;
        Double rSquared = null;

        if (pipeline.getResult() != null) {
            if (project.getCategory() == Category.CLASSIFICATION) {
                accuracy = pipeline.getResult().doubleValue();
            } else if (project.getCategory() == Category.REGRESSION) {
                rSquared = pipeline.getResult().doubleValue();
            }
        }

        // 학습 소요 시간은 ModelDocument에서 가져올게.
        Double runningDuration = null;
        if (model != null && model.getLearningDuration() != null) {
            runningDuration = model.getLearningDuration().doubleValue();
        }

        // parent_pipeline_id에 해당하는 버전 정보
        String parentVersion = "1.0"; // 기본값(부모 파이프라인 못 찾으면)
        if (pipeline.getParentPipelineId() != null && !pipeline.getParentPipelineId().isEmpty()) {
            Optional<PipelineEntity> parentPipeline = pipelineRepository.findById(pipeline.getParentPipelineId());
            if (parentPipeline.isPresent()) {
                parentVersion = parentPipeline.get().getVersion().toString();
            }
        }

        // 응답 객체
        return PipelineInfo.builder()
                .pipelineId(pipeline.getPipelineId())
                .version(pipeline.getVersion().toString())
                .publicYn(pipeline.getPublicYn())
                .deletedYn(pipeline.getDeletedYn())
                .parent(parentVersion)
                .accuracy(accuracy)
                .rSquared(rSquared)
                .dataCount(pipeline.getDataCount())
                .target(pipeline.getTargetFeature())
                .runnungDuration(runningDuration)
                .likeCount(pipeline.getLikeCount())
                .downloadCount(pipeline.getDownloadCount())
                .updatedAt(pipeline.getModifiedAt())
                .ownerYn(isProjectOwner) // 프로젝트 소유자 ==> 파이프라인 소유자
                .build();
    }
}