package com.ccc.roll_model.pipeline.ui.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

import com.ccc.roll_model.pipeline.domain.model.common.ModelingInfo;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecuteModelingRequest {

	private ModelingInfo modelingInfo;

	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class DataSplit {
		private double trainRatio;
		private double testRatio;
		private double validationRatio;
		private int randomSeed;
	}
}