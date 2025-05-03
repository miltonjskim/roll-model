package com.ccc.roll_model.project.ui;

import com.ccc.roll_model.global.utils.ApiUtils;
import com.ccc.roll_model.project.application.command.CreateProjectCommand;
import com.ccc.roll_model.project.application.ProjectService;
import com.ccc.roll_model.project.infrastructure.entity.mysql.ProjectEntity;
import com.ccc.roll_model.project.ui.request.CreateProjectRequest;
import com.ccc.roll_model.project.ui.response.CreateProjectResponse;
import com.ccc.roll_model.project.ui.response.GetMyProjectResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects")
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
    public ApiUtils.ApiResponse<GetMyProjectResponse> getOpensourceProjects() {



        return null;
    }
}
