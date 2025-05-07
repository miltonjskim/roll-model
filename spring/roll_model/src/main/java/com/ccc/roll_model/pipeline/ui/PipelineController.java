package com.ccc.roll_model.pipeline.ui;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ccc.roll_model.global.utils.ApiUtils;
import com.ccc.roll_model.global.utils.ApiUtils.ApiResponse;
import com.ccc.roll_model.pipeline.application.PipelineService;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/pipelines")
public class PipelineController {
    private final PipelineService pipelineService;

    @DeleteMapping("/{pipelineId}")
    public ResponseEntity<ApiResponse<Void>> deletePipeline(
            @PathVariable String pipelineId,
            @AuthenticationPrincipal Integer memberId) {
        
        pipelineService.deletePipeline(pipelineId, memberId);
        
        return ResponseEntity.ok(ApiUtils.success(null));
    }
}