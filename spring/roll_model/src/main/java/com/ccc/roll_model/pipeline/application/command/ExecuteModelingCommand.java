package com.ccc.roll_model.pipeline.application.command;


import com.ccc.roll_model.pipeline.domain.model.common.ModelingInfo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecuteModelingCommand {
	private String pipelineId;
	private Integer memberId;
	private ModelingInfo modelingInfo;

	// 유효성 검사 등 추가 로직이 필요하다면 여기에 구현
	public boolean validate() {
		System.out.println(pipelineId + ":" + memberId + ":" + modelingInfo);
		return pipelineId != null && memberId != null && modelingInfo != null;
	}

}