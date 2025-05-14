package com.ccc.roll_model.pipeline.domain.model.parameters.regression;

import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
public class ElasticNetParams implements ModelParameter {

	@Builder.Default
	private Double alpha = 1.0;

	@Builder.Default
	private Double l1_ratio = 0.5;

	@Override
	public boolean validateParameters() {
		if (alpha == null || alpha < 0.0) {
			return false;
		}

		return l1_ratio != null && !(l1_ratio < 0.0) && !(l1_ratio > 1.0);
	}
}