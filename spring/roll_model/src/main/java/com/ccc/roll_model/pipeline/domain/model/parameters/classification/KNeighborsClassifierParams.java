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
public class KNeighborsClassifierParams implements ModelParameter {
	@Builder.Default
	private Integer n_neighbors = 1;

	@Builder.Default
	private String weights = "uniform";

	@Builder.Default
	private String metric = "minkowski";

	@Override
	public boolean validateParameters() {

		if (n_neighbors == null || n_neighbors <= 0) {
			return false;
		}

		// weights는 선택사항이지만 있다면 유효한 값이어야 함
		if (!("uniform".equalsIgnoreCase(weights) || "distance".equalsIgnoreCase(weights))) {
			return false;
		}

		// metric은 선택사항이지만 있다면 유효한 값이어야 함
		return metric != null &&
			Set.of("minkowski", "euclidean", "manhattan", "cosine", "hamming")
				.contains(metric.toLowerCase());
	}
}