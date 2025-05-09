package com.ccc.roll_model.pipeline.ui;

import com.ccc.roll_model.pipeline.ui.dto.request.PipelineLikeRequest;
import com.ccc.roll_model.pipeline.ui.dto.request.UpdatePipelineVisibilityRequest;
import com.ccc.roll_model.pipeline.ui.dto.response.PipelineLikeResponse;
import com.ccc.roll_model.pipeline.ui.dto.response.UpdatePipelineVisibilityResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping("/{pipelineId}/visibility")
    public ResponseEntity<ApiResponse<UpdatePipelineVisibilityResponse>> updatePipelineVisibility(
            @PathVariable String pipelineId,
            @AuthenticationPrincipal Integer memberId,
            @RequestBody UpdatePipelineVisibilityRequest request
    ) {
        UpdatePipelineVisibilityResponse response = pipelineService.updatePipelineVisibility(
                pipelineId,
                memberId,
                request.getPublicYn()
        );
        return ResponseEntity.ok(ApiUtils.success(response));
    }

    @PostMapping("/{pipelineId}/likes")
    public ResponseEntity<ApiResponse<PipelineLikeResponse>> updatePipelineLike(
            @PathVariable String pipelineId,
            @AuthenticationPrincipal Integer memberId,
            @RequestBody PipelineLikeRequest request) {

        PipelineLikeResponse response = pipelineService.updatePipelineLike(
                pipelineId,
                memberId,
                request
        );

        return ResponseEntity.ok(ApiUtils.success(response));
    }
}

