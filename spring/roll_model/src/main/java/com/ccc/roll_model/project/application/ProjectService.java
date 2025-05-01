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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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

    public ProjectEntity createProject(CreateProjectCommand command) {

        Member member = memberRepository.findById(command.getMemberId()).orElse(null);
        MemberEntity memberEntity = memberMapper.toEntity(member);

        Category category = null;
        switch(command.getCategory()) {
            case "REGRESSION": category = Category.REGRESSION; break;
            case "CLASSIFICATION": category = Category.CLASSIFICATION; break;
            default: break;
        }
        if(category == null) {
            throw new IllegalArgumentException("카테고리 입력이 잘못되었습니다람쥐");
        }

        Domain domain = null;
        switch(command.getDomain()) {
            case "FINANCE": domain = Domain.FINANCE; break;
            case "HEALTHCARE": domain = Domain.HEALTHCARE; break;
            case "RETAIL": domain = Domain.RETAIL; break;
            case "MARKETING": domain = Domain.MARKETING; break;
            case "MANUFACTURING": domain = Domain.MANUFACTURING; break;
            case "EDUCATION": domain = Domain.EDUCATION; break;
            case "REAL_ESTATE": domain = Domain.REAL_ESTATE; break;
            case "LOGISTICS": domain = Domain.LOGISTICS; break;
            case "ENTERTAINMENT": domain = Domain.ENTERTAINMENT; break;
            case "GENERAL": domain = Domain.GENERAL; break;
            default: break;
        }
        if(domain == null) {
            throw new IllegalArgumentException("도메인 입력이 잘못되었습니다람쥐");
        }

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

    public GetMyProjectResponse getMyProjects(Integer memberId) {
        // 1. MySQL: 프로젝트 데이터
        List<ProjectEntity> projects = projectRepository.findAllByMemberEntityMemberId(memberId);

        // 초기 통계 값
        AtomicInteger completedProjects = new AtomicInteger();
        AtomicInteger inProgressProjects = new AtomicInteger();
        AtomicInteger publicProjects = new AtomicInteger();

        // 2. 개별 프로젝트 세부 정보 생성
        List<GetMyProjectResponse.Project> projectDetails = projects.stream().map(project -> {
            // 최신 파이프라인 가져오기 (PipelineRepository 메서드 사용)
            PipelineEntity pipeline = pipelineRepository.findFirstByProjectEntityProjectIdOrderByRegisteredAtDesc(project.getProjectId());

            // 최신 파이프라인이 없다면 null 처리
            if (pipeline != null) {
                // 파이프라인 상태에 따라 통계 값 갱신
                switch (pipeline.getStatus()) {
                    case COMPLETED -> completedProjects.getAndIncrement();
                    case LEARNING -> inProgressProjects.getAndIncrement();
                }

                if (pipeline.getPublicYn()) {
                    publicProjects.getAndIncrement();
                }
            }

            // MongoDB: 모델 데이터
            ModelDocument model = modelRepository.findByProjectId(project.getProjectId());

            // MongoDB: 데이터셋 데이터
            DatasetDocument dataset = datasetRepository.findByMemberIdAndProjectId(memberId, project.getProjectId());

            // 최신 파이프라인 정보를 기반으로 프로젝트 상세 정보 생성
            return GetMyProjectResponse.Project.builder()
                    .id(pipeline != null ? pipeline.getPipelineId() : null)
                    .version(pipeline != null ? pipeline.getVersion().toString() : null)
                    .title(project.getTitle())
                    .category(project.getCategory().name().toLowerCase())
                    .status(pipeline != null ? pipeline.getStatus().name().toLowerCase() : null)
                    .domain(project.getDomain().name().toLowerCase())
                    .accuracy(model != null && model.getPerformance() != null ? model.getPerformance().getClassification().getAccuracy() : null)
                    .rmse(model != null && model.getPerformance() != null ? model.getPerformance().getRegression().getRmse() : null)
                    .runningDuration(model != null ? model.getLearningDuration() : null)
                    .target(pipeline != null ? pipeline.getTargetFeature() : null)
                    .dataCount(dataset != null && dataset.getMetadata() != null ? dataset.getMetadata().getRowCount() : null)
                    .likeCount(pipeline != null ? pipeline.getLikeCount() : 0)
                    .downloadCount(pipeline != null ? pipeline.getDownloadCount() : 0)
                    .publicYn(project.getPublicYn())
                    .createdAt(project.getRegisteredAt())
                    .updatedAt(project.getModifiedAt())
                    .build();
        }).collect(Collectors.toList());

        // 4. 최종 Response 조합
        return GetMyProjectResponse.builder()
                .summary(GetMyProjectResponse.Summary.builder()
                        .totalProjects(projects.size())
                        .completedProjectCount(completedProjects.get())
                        .inProgressProjectCount(inProgressProjects.get())
                        .publicProjectCount(publicProjects.get())
                        .build())
                .projects(projectDetails)
                .build();
    }
}
