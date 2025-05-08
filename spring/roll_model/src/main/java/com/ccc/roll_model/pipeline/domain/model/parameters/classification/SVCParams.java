package com.ccc.roll_model.pipeline.domain.model.parameters.classification;

import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
public class SVCParams implements ModelParameter {
	private Double c;
	private String kernel;
	private String gamma;
	private Integer degree;

	@Override
	public boolean validateParameters() {
		// c가 필수 파라미터
		return c != null;
	}
}