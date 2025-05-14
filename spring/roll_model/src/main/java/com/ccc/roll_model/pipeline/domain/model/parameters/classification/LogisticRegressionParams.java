package com.ccc.roll_model.pipeline.domain.model.parameters.classification;

import java.util.Set;

import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
public class LogisticRegressionParams implements ModelParameter {
	@Builder.Default
	private String penalty = "l2";

	@Builder.Default
	private Double C = 1.0;

	@Builder.Default
	private String solver = "lbfgs";

	@Builder.Default
	private Integer max_iter = 100;

	@Override
	public boolean validateParameters() {
		// penalty 검증 - 유효한 값들 중 하나여야 함
		if (penalty == null ||
			!Set.of("l1", "l2", "elasticnet", "none").contains(penalty.toLowerCase())) {
			return false;
		}

		// C 검증 - 양수여야 함
		if (C == null || C <= 0.0) {
			return false;
		}

		// solver 검증 - 유효한 값들 중 하나여야 함
		if (solver == null || solver.isEmpty() ||
			!Set.of("liblinear", "lbfgs", "saga").contains(solver.toLowerCase())) {
			return false;
		}

		// max_iter 검증 - 양의 정수여야 함
		return max_iter != null && max_iter > 0;
	}
}