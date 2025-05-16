package com.ccc.roll_model.pipeline.domain.model.vo;

import lombok.Builder;

public record ModelPerformanceSummary(String modelId, Double learningDuration, Double result) {
	@Builder
	public ModelPerformanceSummary {
	}

	@Override
	public String toString() {
		return "ModelPerformanceSummary{"
			+ "modelId='" + modelId + '\''
			+ ", learningDuration=" + learningDuration
			+ '}';
	}

	@Override
	public boolean equals(Object o) {
		if (this == o)
			return true;
		if (o == null || getClass() != o.getClass())
			return false;
		ModelPerformanceSummary that = (ModelPerformanceSummary)o;
		return this.modelId.equals(that.modelId) &&
			this.learningDuration.equals(that.learningDuration);
	}
}