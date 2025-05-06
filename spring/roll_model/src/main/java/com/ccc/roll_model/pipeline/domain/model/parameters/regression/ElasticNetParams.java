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
public class ElasticNetParams implements ModelParameter {
	private Double alpha;
	private Double l1_ratio;

	@Override
	public boolean validateParameters() {
		// alpha와 l1Ratio가 필수 파라미터
		return alpha != null && l1_ratio != null;
	}
}