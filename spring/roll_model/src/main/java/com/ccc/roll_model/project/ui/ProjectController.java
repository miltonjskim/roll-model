package com.ccc.roll_model.project.ui;

import com.ccc.roll_model.global.security.utils.OAuth2UserDetails;
import com.ccc.roll_model.global.utils.ApiUtils;
import com.ccc.roll_model.project.application.CreateProjectCommand;
import com.ccc.roll_model.project.application.ProjectService;
import com.ccc.roll_model.project.infrastructure.entity.ProjectEntity;
import com.ccc.roll_model.project.ui.request.CreateProjectRequest;
import com.ccc.roll_model.project.ui.response.CreateProjectResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/projects")
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
                .build();

        ProjectEntity projectEntity = projectService.createProject(command);

        CreateProjectResponse response = CreateProjectResponse.builder()
                .id(projectEntity.getProjectId())
                .title(projectEntity.getTitle())
                .description(projectEntity.getDescription())
                .domain(projectEntity.getDomain())
                .type(projectEntity.getCategory())
                .createdAt(projectEntity.getRegisteredAt())
                .build();

        return ApiUtils.success(response);
    }
}
