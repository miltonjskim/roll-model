package com.ccc.roll_model.project.ui;

import com.ccc.roll_model.global.utils.ApiUtils;
import com.ccc.roll_model.project.application.command.CreateProjectCommand;
import com.ccc.roll_model.project.application.ProjectService;
import com.ccc.roll_model.project.infrastructure.entity.mysql.ProjectEntity;
import com.ccc.roll_model.project.ui.request.CreateProjectRequest;
import com.ccc.roll_model.project.ui.response.CreateProjectResponse;
import com.ccc.roll_model.project.ui.response.GetMyProjectResponse;
import com.ccc.roll_model.project.ui.response.GetOpensourceResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ApiUtils.ApiResponse<CreateProjectResponse> createProject(
            @AuthenticationPrincipal Integer memberId,
            @RequestBody CreateProjectRequest request) {

        CreateProjectCommand command = CreateProjectCommand.builder()
                .memberId(memberId)
                .title(request.getTitle())
                .description(request.getDescription())
                .domain(request.getDomain())
                .category(request.getType())
                .publicYn(request.getIsPublic() != null ? request.getIsPublic() : true)
                .build();

        ProjectEntity projectEntity = projectService.createProject(command);

        CreateProjectResponse response = CreateProjectResponse.builder()
                .id(projectEntity.getProjectId())
                .title(projectEntity.getTitle())
                .description(projectEntity.getDescription())
                .domain(projectEntity.getDomain())
                .type(projectEntity.getCategory())
                .isPublic(projectEntity.getPublicYn())
                .createdAt(projectEntity.getRegisteredAt())
                .build();

        return ApiUtils.success(response);
    }

    @GetMapping("/my")
    public ApiUtils.ApiResponse<GetMyProjectResponse> getMyProjects(@AuthenticationPrincipal Integer memberId) {
//        if (memberId != null) {
//            throw new IllegalArgumentException("인증 정보(memberId): " + memberId);
//        }

        GetMyProjectResponse response = projectService.getMyProjects(memberId);

        return ApiUtils.success(response);
    }

    @GetMapping("/opensource")
    public ApiUtils.ApiResponse<GetOpensourceResponse> getOpensourceProjects(
            @AuthenticationPrincipal Integer memberId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String type,
            @RequestParam(required = false, defaultValue = "recent") String sort,
            @RequestParam(required = false) String domain,
            @RequestParam(required = false, defaultValue = "12") int size,
            @RequestParam(required = false, defaultValue = "1") int page,
            HttpServletRequest request) {

        // keyword: 프로젝트 이름 검색어
        // type: regression, classification, image 중 하나
        // sort: recent(최신순, 기본값), name(이름순), popular(인기순)
        // domain: 프로젝트 도메인 
        // size: 페이지당 아이템 수
        // page: 페이지 번호 (1부터 시작)

        log.info("Controller receiving parameters: keyword={}, type={}, sort={}, domain={}, size={}, page={}",
                keyword, type, sort, domain, size, page);

        // 요청 객체에서 직접 파라미터 확인
        log.info("Request query string: {}", request.getQueryString());
        log.info("Direct from request: keyword={}", request.getParameter("keyword"));

        GetOpensourceResponse response =
                projectService.getOpensourceProjects(memberId, keyword, type, sort, domain, size, page);

        return ApiUtils.success(response);
    }
}
