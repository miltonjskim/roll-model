package com.ccc.roll_model.pipeline.ui;

import com.ccc.roll_model.global.utils.ApiUtils;
import com.ccc.roll_model.pipeline.application.PipelineApiService;
import com.ccc.roll_model.pipeline.application.command.GetPipelineApiCommand;
import com.ccc.roll_model.pipeline.ui.dto.response.GetPipelineApiResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pipelines")
@RequiredArgsConstructor
@Slf4j
public class PipelineApiController {

    private final PipelineApiService pipelineApiService;

    @GetMapping("/{pipelineId}/api")
    public ResponseEntity<ApiUtils.ApiResponse<GetPipelineApiResponse>> getPipelineApi(
            @PathVariable String pipelineId,
            @AuthenticationPrincipal Integer memberId
    ) {

        log.info("파이프라인 api 요청 수신: pipelineId={}, memberId={}", pipelineId, memberId);

        GetPipelineApiCommand command = GetPipelineApiCommand.builder()
                .pipelineId(pipelineId)
                .memberId(memberId)
                .build();

        GetPipelineApiResponse response = pipelineApiService.getPipelineApi(command);
        return ResponseEntity.ok(ApiUtils.success(response));
    }
}