package com.ccc.roll_model.pipeline.domain.model.parameters.classification;

import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
public class LogisticRegressionParams implements ModelParameter {
	private String penalty;
	private Double c;
	private String solver;
	private Integer max_iter;

	@Override
	public boolean validateParameters() {
		// solver가 필수 파라미터
		return solver != null && !solver.isEmpty();
	}
}