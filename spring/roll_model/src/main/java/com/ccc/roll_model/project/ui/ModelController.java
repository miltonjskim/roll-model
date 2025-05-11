package com.ccc.roll_model.project.ui;

import com.ccc.roll_model.global.utils.ApiUtils;
import com.ccc.roll_model.project.application.ModelService;
import com.ccc.roll_model.project.application.command.ExportModelCommand;
import com.ccc.roll_model.project.ui.response.ModelExportResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/models")
@RequiredArgsConstructor
public class ModelController {

    private final ModelService modelService;

    @GetMapping("/{pipelineId}/export")
    public ResponseEntity<ApiUtils.ApiResponse<ModelExportResponse>> exportModel(
            @PathVariable String pipelineId,
            @AuthenticationPrincipal UserDetails userDetails) {

        // 사용자 ID 추출 (JWT에서 추출된 사용자 정보)
        Integer memberId = Integer.valueOf(userDetails.getUsername());

        // 모델 내보내기 명령 생성
        ExportModelCommand command = new ExportModelCommand(pipelineId, memberId);

        // 서비스 호출
        ModelExportResponse response = modelService.exportModel(command);

        // API 응답 생성
        return ResponseEntity.ok(ApiUtils.success(response));
    }
}