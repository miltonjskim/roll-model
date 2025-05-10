package com.ccc.roll_model.project.ui;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ccc.roll_model.global.utils.ApiUtils;
import com.ccc.roll_model.project.application.ProjectVersionService;
import com.ccc.roll_model.project.application.command.GetProjectVersionsCommand;
import com.ccc.roll_model.project.ui.request.GetProjectVersionsRequest;
import com.ccc.roll_model.project.ui.response.GetProjectVersionsResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/projects")
public class ProjectVersionController {

    private final ProjectVersionService projectVersionService;

    @GetMapping("/{projectId}/versions")
    public ApiUtils.ApiResponse<GetProjectVersionsResponse> getProjectVersions(
            @PathVariable Integer projectId,
            @RequestBody GetProjectVersionsRequest request,
            @AuthenticationPrincipal Integer memberId) {

        log.info("Received request for project versions, projectId: {}, memberId: {}", projectId, memberId);

        GetProjectVersionsCommand command = GetProjectVersionsCommand.builder()
                .projectId(projectId)
                .pipelineId(request.getPipelineId())
                .memberId(memberId)
                .build();

        GetProjectVersionsResponse response = projectVersionService.getProjectVersions(command);

        return ApiUtils.success(response);
    }
}