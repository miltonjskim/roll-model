package com.ccc.roll_model.pipeline.ui;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ccc.roll_model.pipeline.application.ModelingService;
import com.ccc.roll_model.pipeline.application.command.ExecuteModelingCommand;
import com.ccc.roll_model.pipeline.ui.dto.request.ExecuteModelingRequest;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/pipelines")
public class ModelingController {
	private final ModelingService modelingService;

	@PostMapping("/{pipelineId}/modeling")
	public void executeModeling(@PathVariable String pipelineId, @RequestBody ExecuteModelingRequest request ,@AuthenticationPrincipal Integer memberId) {
		modelingService.executeModeling(ExecuteModelingCommand.builder()
			.memberId(memberId)
			.pipelineId(pipelineId)
			.modelingInfo(request.getModelingInfo())
			.build()
		);
	}
}

