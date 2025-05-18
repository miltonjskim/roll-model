package com.ccc.roll_model.pipeline.domain.model.parameters.classification;

import java.util.Set;

import com.ccc.roll_model.pipeline.domain.model.common.ModelParameter;
import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
public class LogisticRegressionParams implements ModelParameter {

	private String penalty;

	@JsonProperty("C")
	private Double C;

	private String solver;

	private Integer max_iter;

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

	@JsonGetter("C")
	public Double getC() {
		return C;
	}
}