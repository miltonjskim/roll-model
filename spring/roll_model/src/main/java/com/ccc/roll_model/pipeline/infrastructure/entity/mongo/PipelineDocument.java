package com.ccc.roll_model.pipeline.infrastructure.entity.mongo;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "pipelines")
public class PipelineDocument {
	@Id
	private ObjectId id;

	@Field("project_id")
	private Integer projectId;

	@Field("member_id")
	private Integer memberId;

	@Field("registered_at")
	private LocalDateTime registeredAt;

	@Field("modified_at")
	private LocalDateTime modifiedAt;

	@Field("original_dataset_id")
	private String originalDatasetId;

	@Field("original_dataset_etag")
	private String originalDatasetEtag;

	@Field("original_dataset_object_name")
	private String originalDatasetObjectName;

	private List<PipelineHistoryItem> history;

	@Getter
	@Setter
	@AllArgsConstructor
	@NoArgsConstructor
	@Builder
	public static class PipelineHistoryItem {
		@Field("model_id")
		private ObjectId modelId;

		@Field("preprocessing_steps")
		private List<PreprocessingStep> preprocessingSteps;

		@Field("modeling_info")
		private ModelingInfo modelingInfo;

		private String status;
	}

	@Getter
	@Setter
	@AllArgsConstructor
	@NoArgsConstructor
	@Builder
	public static class PreprocessingStep {
		private String type;
		private Map<String, Object> parameters;
		private int order;
		private boolean active;

		@Field("preprocessed_dataset_id")
		private String preprocessedDatasetId;

		@Field("preprocessed_dataset_etag")
		private String preprocessedDatasetEtag;

		@Field("preprocessed_dataset_object_name")
		private String preprocessedDatasetObjectName;
	}

	@Getter
	@Setter
	@AllArgsConstructor
	@NoArgsConstructor
	@Builder
	public static class ModelingInfo {
		private String algorithm;

		@Field("data_split")
		private DataSplit dataSplit;

		private Map<String, Object> parameters;

		@Field("target_feature")
		private String targetFeature;
	}

	@Getter
	@Setter
	@AllArgsConstructor
	@NoArgsConstructor
	@Builder
	public static class DataSplit {
		@Field("train_ratio")
		private double trainRatio;

		@Field("test_ratio")
		private double testRatio;

		@Field("validation_ratio")
		private double validationRatio;

		@Field("random_seed")
		private int randomSeed;
	}
}