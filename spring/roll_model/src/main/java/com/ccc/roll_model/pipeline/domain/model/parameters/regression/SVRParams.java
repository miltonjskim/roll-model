package com.ccc.roll_model.pipeline.domain.model.parameters.regression;

import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SVRParams implements ModelParameter {
	private Double c;
	private Double epsilon;
	private String kernel;

	@Override
	public boolean validateParameters() {
		// c가 필수 파라미터
		return c != null;
	}
}