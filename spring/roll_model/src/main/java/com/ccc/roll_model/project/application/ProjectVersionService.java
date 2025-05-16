package com.ccc.roll_model.project.application;

import java.util.*;

import com.ccc.roll_model.project.infrastructure.entity.mysql.*;

import org.jetbrains.annotations.NotNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ccc.roll_model.global.exception.ApiException;
import com.ccc.roll_model.global.exception.ErrorCode;
import com.ccc.roll_model.member.domain.Member;
import com.ccc.roll_model.member.domain.MemberRepository;
import com.ccc.roll_model.project.application.command.GetProjectVersionsCommand;
import com.ccc.roll_model.project.infrastructure.entity.mongo.ModelDocument;
import com.ccc.roll_model.project.infrastructure.repository.mongo.ModelRepository;
import com.ccc.roll_model.project.infrastructure.repository.mysql.PipelineRepository;
import com.ccc.roll_model.project.infrastructure.repository.mysql.ProjectRepository;
import com.ccc.roll_model.project.infrastructure.repository.mysql.VersionRepository;
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
    private final VersionRepository versionRepository;

    String ROOT_VERSION = "1.0";

    @Transactional(readOnly = true)
    public GetProjectVersionsResponse getProjectVersions(GetProjectVersionsCommand command) {
        log.info("Getting project versions for pipelineId: {}, memberId: {}",
                command.getPipelineId(), command.getMemberId());

        // 1. 현재 사용자 조회
        Member member = memberRepository.findById(command.getMemberId())
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        // 2. 해당 파이프라인이 속한 그룹의 모든 파이프라인 조회
        VersionEntity versionEntity = versionRepository.findVersionEntityByPipelineId(command.getPipelineId());
        Integer groupId = versionEntity.getGroupId();
        List<VersionEntity> versionEntities =
            versionRepository.findVersionEntitiesByGroupId(groupId); // OrderBy 제거

        // 먼저 버전으로 정렬 (내림차순)
        versionEntities.sort((v1, v2) -> compareVersions(v2.getVersionNum(), v1.getVersionNum()));

        // 버전 엔티티와 파이프라인 ID를 매핑하는 맵 생성
        Map<String, VersionEntity> versionMap = new HashMap<>();
        for (VersionEntity ve : versionEntities) {
            versionMap.put(ve.getPipelineId(), ve);
        }

        List<PipelineEntity> pipelines = versionEntities.stream()
                .map(version -> pipelineRepository.findByPipelineId(version.getPipelineId()).orElse(null))
                .filter(Objects::nonNull)
                .filter(pipeline -> pipeline.getStatus() == Status.COMPLETED)
                .sorted(Comparator.comparing(PipelineEntity::getModifiedAt).reversed())
                .toList();
        log.debug("Found {} pipelines for project", pipelines.size());

        // 3. 파이프라인이 속한 프로젝트 조회
        PipelineEntity pipelineEntity = pipelineRepository.findByPipelineId(command.getPipelineId())
                .orElseThrow(() -> new ApiException(ErrorCode.PIPELINE_DATA_NOT_FOUND));

        Integer projectId = pipelineEntity.getProjectEntity().getProjectId();

        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ApiException(ErrorCode.INVALID_INPUT_PARAMETER));

        // 4. 프로젝트 소유자 여부 확인
        boolean isProjectOwner = project.getMemberEntity().getMemberId().equals(member.getMemberId());
        log.debug("User is project owner: {}", isProjectOwner);

        // 5. 파이프라인 정보 매핑 및 응답 구성
        List<PipelineInfo> pipelineInfoList = new ArrayList<>();

        for (PipelineEntity pipeline : pipelines) {
            // 삭제된 파이프라인 필터링 (프로젝트 소유자가 아닌 경우)
            if (pipeline.getDeletedYn() && !isProjectOwner) {
                continue;
            }

            // 모델 정보 조회 (runningDuration 용)
            ModelDocument model = modelRepository.findByPipelineId(pipeline.getPipelineId());

            PipelineInfo pipelineInfo = buildPipelineInfo(pipeline, model, project, isProjectOwner, versionMap);
            pipelineInfoList.add(pipelineInfo);
        }

        log.debug("Built {} pipeline info objects", pipelineInfoList.size());

        // 프로젝트 정보 구성
        ProjectInfo projectInfo = ProjectInfo.builder()
                .title(project.getTitle())
                .category(project.getCategory().name())
                .domain(project.getDomain().name())
                .version(versionEntity.getVersionNum())
                .projectPublicYn(project.getPublicYn())
                .pipelinePublicYn(pipelineEntity.getPublicYn())
                .ownerYn(isProjectOwner)
                .build();

        // 최종 응답 구성
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
            boolean isProjectOwner,
            Map<String, VersionEntity> versionMap) {

        // 맵에서 현재 파이프라인의 버전 정보 조회
        VersionEntity versionEntity = versionMap.get(pipeline.getPipelineId());
        String versionNum = versionEntity != null ? versionEntity.getVersionNum() : ROOT_VERSION;

        // 프로젝트 카테고리에 따라 성능 지표 설정
        Double accuracy = null;
        Double rSquared = null;

        if (pipeline.getResult() != null) {
            if (project.getCategory() == Category.CLASSIFICATION) {
                // 소수점 둘째 자리까지 반올림
                accuracy = Math.round(pipeline.getResult().doubleValue() * 100) / 100.0;
            } else if (project.getCategory() == Category.REGRESSION) {
                // 소수점 둘째 자리까지 반올림
                rSquared = Math.round(pipeline.getResult().doubleValue() * 100) / 100.0;
            }
        }

        // 학습 소요 시간은 ModelDocument에서 가져올게.
        Double runningDuration = null;
        if (model != null && model.getLearningDuration() != null) {
//            runningDuration = model.getLearningDuration().doubleValue();
            // 러닝 타임도 소수점 둘째 자리까지 반올림
            runningDuration = Math.round(model.getLearningDuration().doubleValue() * 100) / 100.0;
        }

        // parent_pipeline_id에 해당하는 버전 정보
        String parentVersion = ROOT_VERSION; // 기본값(부모 파이프라인 못 찾으면)
        if (pipeline.getParentPipelineId() != null && !pipeline.getParentPipelineId().isEmpty()) {
            // 맵에서 부모 파이프라인의 버전 정보 조회
            VersionEntity parentVersionEntity = versionMap.get(pipeline.getParentPipelineId());
            if (parentVersionEntity != null) {
                parentVersion = parentVersionEntity.getVersionNum();
            }
        }

        // 응답 객체
        return PipelineInfo.builder()
                .pipelineId(pipeline.getPipelineId())
                .version(versionNum)
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

    @Transactional
    public void savePipelineVersion(String pipelineId) {
        String newVersion;
        VersionEntity version;

        // 현재 파이프라인 정보 조회
        PipelineEntity pipeline = pipelineRepository.findByPipelineId(pipelineId)
            .orElseThrow(() -> new ApiException(ErrorCode.PIPELINE_NOT_FOUND));

        //부모가 없다 == 자기 자신이라면
        String parentPipelineId = pipeline.getParentPipelineId();
        if (parentPipelineId.equals(pipelineId)) {
            // 새로운 버전의 1.0 할듯함
            newVersion = ROOT_VERSION;
            Integer newGroupId = generateNewGroupId();

            version = VersionEntity.builder()
                .pipelineId(pipelineId)
                .versionNum(newVersion)
                .groupId(newGroupId)
                .parentVersion(newVersion)
                .build();
        } else {
            VersionEntity parentVersion = versionRepository.findVersionEntityByPipelineId(parentPipelineId);

            // 같은 그룹의 모든 버전들을 조회 (내림차순 정렬)
            if (parentVersion == null) {
                throw new ApiException(ErrorCode.PIPELINE_DATA_NOT_FOUND);
            }
            List<VersionEntity> pipelineGroup = versionRepository
                .findVersionEntitiesByGroupId(parentVersion.getGroupId());

            pipelineGroup.sort((v1, v2) -> compareVersions(v2.getVersionNum(), v1.getVersionNum()));
            // 새로운 버전 생성
            newVersion = createNewVersion(parentVersion.getVersionNum(), pipelineGroup);

            version = VersionEntity.builder()
                .pipelineId(pipelineId)
                .versionNum(newVersion)
                .groupId(parentVersion.getGroupId())
                .parentVersion(parentVersion.getVersionNum())
                .build();
        }

        versionRepository.save(version);
    }

    private String createNewVersion(String parentVersion, List<VersionEntity> pipelineGroup) {
        if (parentVersion == null) {
            return ROOT_VERSION;
        }

        if (pipelineGroup.isEmpty()) {
            throw new ApiException(ErrorCode.PIPELINE_NOT_FOUND);
        }

        String highestVersion = pipelineGroup.get(0).getVersionNum();

        if (parentVersion.equals(ROOT_VERSION)) {
            // 정수 버전 중 가장 높은 버전 찾기
            String[] parts = highestVersion.split("\\.");
            int majorVersion = Integer.parseInt(parts[0]);
            return (majorVersion + 1) + ".0";
        } else {
            // 해당 메이저 버전의 소수점 버전 중 가장 높은 버전 찾기
            String[] parentParts = parentVersion.split("\\.");
            int majorVersion = Integer.parseInt(parentParts[0]);
            return calculateMinorVersion(pipelineGroup, majorVersion);
        }
    }

    @NotNull
    private static String calculateMinorVersion(List<VersionEntity> pipelineGroup, int majorVersion) {
        String highestMinorVersion = majorVersion + ".0";

        for (VersionEntity group : pipelineGroup) {
            String version = group.getVersionNum();
            String[] parts = version.split("\\.");
            int versionMajor = Integer.parseInt(parts[0]);

            // 같은 메이저 버전인지 확인
            if (versionMajor == majorVersion) {
                if (compareVersions(version, highestMinorVersion) > 0) {
                    highestMinorVersion = version;
                }
            }
        }

        // String을 파싱해서 마이너 버전 증가
        String[] parts = highestMinorVersion.split("\\.");
        int major = Integer.parseInt(parts[0]);
        int minor = Integer.parseInt(parts[1]);

        // 마이너 버전 증가
        minor += 1;

        return major + "." + minor;
    }

    // 버전 문자열 비교 메서드
    private static int compareVersions(String v1, String v2) {
        String[] parts1 = v1.split("\\.");
        String[] parts2 = v2.split("\\.");

        // 메이저 버전 비교
        int major1 = Integer.parseInt(parts1[0]);
        int major2 = Integer.parseInt(parts2[0]);

        if (major1 != major2) {
            return Integer.compare(major1, major2);
        }

        // 마이너 버전 비교
        int minor1 = Integer.parseInt(parts1[1]);
        int minor2 = Integer.parseInt(parts2[1]);

        return Integer.compare(minor1, minor2);
    }

    private Integer generateNewGroupId() {
        return versionRepository.findHighestGroupId().orElse(0) + 1;  // +1 추가
    }
}