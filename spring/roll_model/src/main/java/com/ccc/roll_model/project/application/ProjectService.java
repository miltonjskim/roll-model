package com.ccc.roll_model.project.application;

import com.ccc.roll_model.member.domain.Member;
import com.ccc.roll_model.member.domain.MemberRepository;
import com.ccc.roll_model.member.infrastructure.MemberEntity;
import com.ccc.roll_model.member.infrastructure.MemberMapper;
import com.ccc.roll_model.project.application.command.CreateProjectCommand;
import com.ccc.roll_model.project.infrastructure.entity.mongo.DatasetDocument;
import com.ccc.roll_model.project.infrastructure.entity.mongo.ModelDocument;
import com.ccc.roll_model.project.infrastructure.entity.mysql.*;
import com.ccc.roll_model.project.infrastructure.repository.mongo.DatasetRepository;
import com.ccc.roll_model.project.infrastructure.repository.mongo.ModelRepository;
import com.ccc.roll_model.project.infrastructure.repository.mysql.PipelineRepository;
import com.ccc.roll_model.project.infrastructure.repository.mysql.ProjectRepository;
import com.ccc.roll_model.project.ui.response.GetMyProjectResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final PipelineRepository pipelineRepository;
    private final ModelRepository modelRepository;
    private final DatasetRepository datasetRepository;
    private final MemberRepository memberRepository;
    private final MemberMapper memberMapper;
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    public ProjectEntity createProject(CreateProjectCommand command) {

        if (command == null) {
            throw new IllegalArgumentException("CreateProjectCommand는 null일 수 없습니다.");
        }

        Member member = memberRepository.findById(command.getMemberId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원 ID입니다."));
        MemberEntity memberEntity = memberMapper.toEntity(member);

        Category category = Arrays.stream(Category.values())
                .filter(c -> c.name().equalsIgnoreCase(command.getCategory()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("잘못된 카테고리 입력 값입니다: " + command.getCategory()));

        Domain domain = Arrays.stream(Domain.values())
                .filter(d -> d.name().equalsIgnoreCase(command.getDomain()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("잘못된 도메인 입력 값입니다: " + command.getDomain()));

        ProjectEntity projectEntity = ProjectEntity.builder()
                .memberEntity(memberEntity)
                .title(command.getTitle())
                .description(command.getDescription())
                .category(category)
                .domain(domain)
                .publicYn(command.getPublicYn())
                .deletedYn(false)
                .build();
        return projectRepository.save(projectEntity);
    }

    @Transactional(readOnly = true)
    public GetMyProjectResponse getMyProjects(Integer memberId) {

        if (memberId == null) {
            logger.info("Input parameter 'memberId' is null.");
            throw new IllegalArgumentException("memberId는 null이 될 수 없습니다.");
        }

        // 1. MySQL: 프로젝트 데이터
        List<ProjectEntity> projects = projectRepository.findAllByMemberEntityMemberId(memberId);
        logger.info("Fetched projects from MySQL for memberId {}: {}", memberId, projects);

        if (projects == null || projects.isEmpty()) {
            logger.info("No projects found for memberId {}.", memberId);
            throw new IllegalArgumentException("해당 memberId로 등록된 프로젝트가 없습니다.");
        }

        // 초기 통계 값
        int[] stats = new int[3]; // [0]: completedProjects, [1]: inProgressProjects, [2]: publicProjects

        // 2. 개별 프로젝트 세부 정보 생성
        List<GetMyProjectResponse.Project> projectDetails = projects.stream()
                .filter(project -> {
                    if (project == null) {
                        logger.info("Found a null project in the list for memberId {}.", memberId);
                        throw new IllegalArgumentException("프로젝트 데이터가 null입니다.");
                    }
                    return pipelineRepository.countByProjectId(project.getProjectId()) > 0;
                })
                .map(project -> {
                    // Pipeline 처리 개선
                    PipelineEntity pipeline = pipelineRepository.findFirstByProjectIdOrderByRegisteredAtDesc(project.getProjectId())
                            .orElseThrow(() -> new IllegalArgumentException("해당 프로젝트에 대한 파이프라인 데이터가 없습니다."));
                    logger.info("Fetched pipeline for projectId {}: {}", project.getProjectId(), pipeline);

                    if (pipeline.getStatus() != null) {
                        switch (pipeline.getStatus()) {
                            case COMPLETED -> stats[0]++;
                            case LEARNING -> stats[1]++;
                        }
                    }
                    if (Boolean.TRUE.equals(pipeline.getPublicYn())) {
                        stats[2]++;
                    }

                    // MongoDB: 모델 데이터
                    ModelDocument model = Optional.ofNullable(modelRepository.findByProjectId(project.getProjectId()))
                            .orElseThrow(() -> new IllegalArgumentException("해당 프로젝트에 대한 모델 데이터가 없습니다."));
                    logger.info("Fetched model for projectId {}: {}", project.getProjectId(), model);

                    // MongoDB: 데이터셋 데이터
                    DatasetDocument dataset = Optional.ofNullable(
                                    datasetRepository.findByMemberIdAndProjectId(memberId, project.getProjectId()))
                            .orElseThrow(() -> new IllegalArgumentException("해당 프로젝트에 대한 데이터셋 데이터가 없습니다."));
                    logger.info("Fetched dataset for projectId {}, memberId {}: {}", project.getProjectId(), memberId, dataset);

                    // 최신 파이프라인 정보를 기반으로 프로젝트 상세 정보 생성
                    return GetMyProjectResponse.Project.builder()
                            .id(pipeline.getPipelineId())
                            .version(pipeline.getVersion() != null ? pipeline.getVersion().toString() : null)
                            .title(project.getTitle())
                            .category(project.getCategory() != null ? project.getCategory().name().toLowerCase() : null)
                            .status(pipeline.getStatus() != null ? pipeline.getStatus().name().toLowerCase() : null)
                            .domain(project.getDomain() != null ? project.getDomain().name().toLowerCase() : null)
                            .accuracy(model.getPerformance() != null && model.getPerformance().getClassification() != null
                                    ? model.getPerformance().getClassification().getAccuracy()
                                    : null)
                            .rmse(model.getPerformance() != null && model.getPerformance().getRegression() != null
                                    ? model.getPerformance().getRegression().getRmse()
                                    : null)
                            .runningDuration(model.getLearningDuration() != null ? model.getLearningDuration() : 0)
                            .target(pipeline.getTargetFeature() != null ? pipeline.getTargetFeature() : "N/A")
                            .dataCount(dataset.getMetadata() != null ? dataset.getMetadata().getRowCount() : 0)
                            .likeCount(pipeline.getLikeCount())
                            .downloadCount(pipeline.getDownloadCount())
                            .publicYn(Boolean.TRUE.equals(project.getPublicYn()))
                            .createdAt(project.getRegisteredAt())
                            .updatedAt(project.getModifiedAt())
                            .build();
                })
                .collect(Collectors.toList());
        logger.info("Constructed project details for memberId {}: {}", memberId, projectDetails);

        // 4. 최종 Response 조합
        GetMyProjectResponse response = GetMyProjectResponse.builder()
                .summary(GetMyProjectResponse.Summary.builder()
                        .totalProjects(projectDetails.size())
                        .completedProjectCount(stats[0])
                        .inProgressProjectCount(stats[1])
                        .publicProjectCount(stats[2])
                        .build())
                .projects(projectDetails)
                .build();
        logger.info("Final GetMyProjectResponse for memberId {}: {}", memberId, response);

        return response;
    }
}
