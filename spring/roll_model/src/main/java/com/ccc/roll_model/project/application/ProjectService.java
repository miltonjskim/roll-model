package com.ccc.roll_model.project.application;

import com.ccc.roll_model.like.infrastructure.repository.LikeRepository;
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
import com.ccc.roll_model.project.ui.response.GetOpensourceResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
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
    private final LikeRepository likeRepository;
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

            GetMyProjectResponse response = GetMyProjectResponse.builder()
                    .summary(GetMyProjectResponse.Summary.builder()
                            .totalProjects(0)
                            .completedProjectCount(0)
                            .inProgressProjectCount(0)
                            .publicProjectCount(0)
                            .build())
                    .projects(null)
                    .build();
            logger.info("Final GetMyProjectResponse for memberId {}: {}", memberId, response);

            return response;
        }

        // 초기 통계 값
        int[] stats = new int[3]; // [0]: completedProjects, [1]: inProgressProjects, [2]: publicProjects

        // 2. 개별 프로젝트 세부 정보 생성
        List<GetMyProjectResponse.Project> projectDetails = projects.stream()
                .filter(project -> project != null && pipelineRepository.countByProjectId(project.getProjectId()) > 0)
                .map(project -> {
                    try {
                        logger.info("Processing project with ID: {}", project.getProjectId());

                        // Pipeline 처리
                        PipelineEntity pipeline = pipelineRepository.findFirstByProjectIdOrderByRegisteredAtDescAndNotDeletedYn(project.getProjectId())
                                .orElse(null);
                        if (pipeline == null) {
                            logger.info("No pipeline found for project ID: {}", project.getProjectId());
                            return null;
                        }
                        logger.info("Fetched pipeline for project ID {}: {}", project.getProjectId(), pipeline.getPipelineId());
                        Integer dataCount = pipeline.getDataCount();

                        // MongoDB: 데이터셋 데이터 존재 여부 조회
                        if (!datasetRepository.existsByProjectId(project.getProjectId())) {
                            logger.info("No dataset found for project ID: {}", project.getProjectId());
                            return null;
                        }

                        // MongoDB: 모델 데이터
                        ModelDocument model = modelRepository.findByPipelineId(pipeline.getPipelineId());
                        logger.info("Fetched model for project ID {}: {}", project.getProjectId(), model);

                        // 모델 데이터가 없어도 status가 PREPROCESSED인 경우 응답에 포함
                        // model이 null이고 status가 PREPROCESSED가 아닌 경우에만 null을 반환
                        if (model == null && (pipeline.getStatus() == null || pipeline.getStatus() != Status.PREPROCESSED)) {
                            logger.info("Model is null and status is not PREPROCESSED for project ID: {}", project.getProjectId());
                            return null;
                        }

                        // Count 집계 및 상태 확인
                        if (pipeline.getStatus() != null) {
                            if (model != null && pipeline.getStatus() == Status.COMPLETED) {
                                stats[0]++; // completed
                            } else if (pipeline.getStatus() == Status.PREPROCESSED) {
                                stats[1]++; // in progress
                            }

                            // public 여부 체크 - completed, in progress 상관없이
                            if (Boolean.TRUE.equals(project.getPublicYn())) {
                                stats[2]++; // public projects
                            }
                        }
                        // 타겟 피처 정보 가져오기 - 모델 문서 사용
                        String targetFeature = null;
                        if (model != null && model.getTrainInfo() != null && model.getTrainInfo().getTargetFeature() != null) {
                            targetFeature = model.getTrainInfo().getTargetFeature();
                        }

                        // 모델에서 타겟 정보를 찾지 못한 경우 파이프라인의 값을 사용
                        if (targetFeature == null || targetFeature.isEmpty()) {
                            targetFeature = pipeline.getTargetFeature();
                        }

                        logger.info("Constructed project detail for project ID: {}", project.getProjectId());
                        // 최신 파이프라인 정보를 기반으로 프로젝트 상세 정보 생성
                        return GetMyProjectResponse.Project.builder()
                                .id(pipeline.getPipelineId())
                                .version(pipeline.getVersion() != null ? pipeline.getVersion().toString() : null)
                                .title(project.getTitle())
                                .category(project.getCategory() != null ? project.getCategory().name() : null)
                                .status(pipeline.getStatus() != null ? pipeline.getStatus().name() : null)
                                .domain(project.getDomain() != null ? project.getDomain().name() : null)
                                .accuracy(model != null && model.getPerformance() != null && model.getPerformance().getClassification() != null
                                        ? model.getPerformance().getClassification().getAccuracy()
                                        : null)
                                .rmse(model != null && model.getPerformance() != null && model.getPerformance().getRegression() != null
                                        ? model.getPerformance().getRegression().getRmse()
                                        : null)
                                .runningDuration(model != null && model.getLearningDuration() != null ? model.getLearningDuration() : 0)
                                .target(targetFeature)
                                .dataCount(dataCount)
                                .likeCount(pipeline.getLikeCount())
                                .downloadCount(pipeline.getDownloadCount())
                                .publicYn(Boolean.TRUE.equals(project.getPublicYn()))
                                .createdAt(project.getRegisteredAt() != null
                                        ? project.getRegisteredAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                                        : null)
                                .updatedAt(project.getModifiedAt() != null
                                        ? project.getModifiedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                                        : null)
                                .build();
                    } catch (Exception e) {
                        logger.warn("Error while processing project {}: {}", project.getProjectId(), e.getMessage());
                        return null;
                    }
                })
                .filter(project -> project != null)
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

    @Transactional(readOnly = true)
    public GetOpensourceResponse getOpensourceProjects(Integer memberId, String keyword, String type,
                                                       String sort, String domain, int size, int page) {
        logger.info("Fetching opensource projects with parameters: memberId={}, keyword={}, type={}, sort={}, domain={}, size={}, page={}", 
                memberId, keyword, type, sort, domain, size, page);

        // 페이지 번호는 0부터 시작하므로 1을 빼줌
        Pageable pageable;
        if ("name".equalsIgnoreCase(sort)) {
            pageable = PageRequest.of(page - 1, size, Sort.by("title").ascending());
        } else if ("popular".equalsIgnoreCase(sort)) {
            // 인기순은 파이프라인의 좋아요 수로 정렬하기 어려우므로 프로젝트 ID로 정렬
            pageable = PageRequest.of(page - 1, size, Sort.by("projectId").descending());
        } else {
            // 기본값은 최신순
            pageable = PageRequest.of(page - 1, size, Sort.by("registeredAt").descending());
        }

        // 카테고리와 도메인 변환
        Category category = null;
        if (type != null && !type.isEmpty()) {
            try {
                category = Category.valueOf(type.toUpperCase());
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid category: {}", type);
            }
        }

        Domain domainEnum = null;
        if (domain != null && !domain.isEmpty()) {
            try {
                domainEnum = Domain.valueOf(domain.toUpperCase());
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid domain: {}", domain);
            }
        }

        // 조건에 따라 적절한 레포지토리 메소드 호출
        Page<ProjectEntity> projectsPage;
        String calledMethod = "";
        if (keyword != null && !keyword.isEmpty()) {
            if (category != null && domainEnum != null) {
                calledMethod = "findAllPublicProjectsByKeywordAndCategoryAndDomain";
                projectsPage = projectRepository.findAllPublicProjectsByKeywordAndCategoryAndDomain(keyword, category, domainEnum, pageable);
            } else if (category != null) {
                calledMethod = "findAllPublicProjectsByKeywordAndCategory";
                projectsPage = projectRepository.findAllPublicProjectsByKeywordAndCategory(keyword, category, pageable);
            } else if (domainEnum != null) {
                calledMethod = "findAllPublicProjectsByKeywordAndDomain";
                projectsPage = projectRepository.findAllPublicProjectsByKeywordAndDomain(keyword, domainEnum, pageable);
            } else {
                calledMethod = "findAllPublicProjectsByKeyword";
                projectsPage = projectRepository.findAllPublicProjectsByKeyword(keyword, pageable);
            }
        } else {
            if (category != null && domainEnum != null) {
                calledMethod = "findAllPublicProjectsByCategoryAndDomain";
                projectsPage = projectRepository.findAllPublicProjectsByCategoryAndDomain(category, domainEnum, pageable);
            } else if (category != null) {
                calledMethod = "findAllPublicProjectsByCategory";
                projectsPage = projectRepository.findAllPublicProjectsByCategory(category, pageable);
            } else if (domainEnum != null) {
                calledMethod = "findAllPublicProjectsByDomain";
                projectsPage = projectRepository.findAllPublicProjectsByDomain(domainEnum, pageable);
            } else {
                calledMethod = "findAllPublicProjects";
                projectsPage = projectRepository.findAllPublicProjects(pageable);
            }
        }
        logger.info("Called repository method: {}", calledMethod);

        logger.info("Fetched {} projects", projectsPage.getContent().size());

        AtomicInteger elementsCount = new AtomicInteger();

        // 프로젝트 상세 정보 생성
        List<GetOpensourceResponse.Project> projectDetails = projectsPage.getContent().stream()
                .map(project -> {
                    // 가장 최신의 공개 파이프라인 가져오기
                    List<PipelineEntity> pipelines = pipelineRepository.findFirstCompletedPublicPipeline(project.getProjectId());
                    PipelineEntity pipeline = pipelines.isEmpty() ? null : pipelines.get(0);

                    // 파이프라인이 없으면 건너뜀
                    if (pipeline == null) {
                        logger.info("No public pipeline found for project {}", project.getProjectId());
                        return null;
                    }

                    // MongoDB: 모델 데이터
                    ModelDocument model = modelRepository.findByPipelineId(pipeline.getPipelineId());
                    if (model == null) {
                        logger.info("No model found for project {}", project.getProjectId());
                        return null;
                    }

                    // MongoDB: 데이터셋 데이터
                    DatasetDocument dataset = datasetRepository.findByProjectIdAndIsPreprocessed(project.getProjectId(), true);
                    if (dataset == null) {
                        logger.info("No dataset found for project {}", project.getProjectId());
                        return null;
                    }

                    elementsCount.getAndIncrement();

                    // 좋아요 여부 확인
                    boolean likeYn = false;
                    if (memberId != null) {
                        likeYn = likeRepository.existsByMemberEntityMemberIdAndPipelineEntityPipelineId(memberId, pipeline.getPipelineId());
                    }

                    // 작성자 정보
                    MemberEntity writer = project.getMemberEntity();

                    // 타겟 피처 정보 가져오기 - 모델 문서 사용
                    String targetFeature = null;
                    if (model != null && model.getTrainInfo() != null && model.getTrainInfo().getTargetFeature() != null) {
                        targetFeature = model.getTrainInfo().getTargetFeature();
                    }

                    // 모델에서 타겟 정보를 찾지 못한 경우 파이프라인의 값을 사용 (없으면 null 반환)
                    if (targetFeature == null || targetFeature.isEmpty()) {
                        targetFeature = pipeline.getTargetFeature();
                    }


                    // 프로젝트 상세 정보 생성
                    return GetOpensourceResponse.Project.builder()
                            .id(pipeline.getPipelineId())
                            .version(pipeline.getVersion() != null ? pipeline.getVersion().toString() : null)
                            .title(project.getTitle())
                            .writerId(writer.getMemberId())
                            .writerNickname(writer.getNickname())
                            .category(project.getCategory() != null ? project.getCategory().name() : null)
                            .status(pipeline.getStatus() != null ? pipeline.getStatus().name() : null)
                            .domain(project.getDomain() != null ? project.getDomain().name() : null)
                            .accuracy(model.getPerformance() != null && model.getPerformance().getClassification() != null
                                    ? model.getPerformance().getClassification().getAccuracy()
                                    : null)
                            .rmse(model.getPerformance() != null && model.getPerformance().getRegression() != null
                                    ? model.getPerformance().getRegression().getRmse()
                                    : null)
                            .target(targetFeature) // 수정된 부분
                            .dataCount(dataset.getMetadata() != null ? dataset.getMetadata().getRowCount() : 0)
                            .runningDuration(model.getLearningDuration() != null ? model.getLearningDuration() : 0)
                            .likeCount(pipeline.getLikeCount())
                            .downloadCount(pipeline.getDownloadCount())
                            .likeYn(likeYn)
                            .createdAt(project.getRegisteredAt() != null
                                    ? project.getRegisteredAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                                    : null)
                            .updatedAt(project.getModifiedAt() != null
                                    ? project.getModifiedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                                    : null)
                            .build();
                })
                .filter(project -> project != null)
                .collect(Collectors.toList());

        // 최종 응답 생성 부분 수정
        // 실제 표시할 프로젝트 수를 기준으로 페이지 수 계산
        int actualTotalElements = elementsCount.get();
        int actualTotalPages = size > 0 ? (int) Math.ceil((double) actualTotalElements / size) : 0;

        GetOpensourceResponse response = GetOpensourceResponse.builder()
                .currentPage(page)
                .totalPages(actualTotalPages) // 수정된 부분
                .totalElements(actualTotalElements)
                .last(page >= actualTotalPages) // 수정된 부분
                .projects(projectDetails)
                .build();

        logger.info("Returning response with {} projects", projectDetails.size());
        return response;
    }
}
