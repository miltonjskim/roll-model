package com.ccc.roll_model.pipeline.infrastructure;

import org.springframework.stereotype.Component;

import com.ccc.roll_model.pipeline.domain.model.common.ModelingInfo;
import com.ccc.roll_model.pipeline.infrastructure.entity.mongo.PipelineDocument;

@Component
public class ModelingInfoMapper {

	public PipelineDocument.ModelingInfo toDocumentModelingInfo(ModelingInfo domainModelingInfo) {
		// null 체크
		if (domainModelingInfo == null) {
			return null;
		}

		// DataSplit 객체 변환
		PipelineDocument.DataSplit dataSplit = toDocumentDataSplit(domainModelingInfo.getDataSplit());

		// ModelingInfo 생성 및 반환
		return PipelineDocument.ModelingInfo.builder()
			.algorithm(domainModelingInfo.getAlgorithm())
			.dataSplit(dataSplit)
			.parameters(domainModelingInfo.getParameters())
			.targetFeature(domainModelingInfo.getTargetFeature())
			.build();
	}

	public PipelineDocument.DataSplit toDocumentDataSplit(ModelingInfo.DataSplit domainDataSplit) {
		if (domainDataSplit == null) {
			return null;
		}

		return PipelineDocument.DataSplit.builder()
			.trainRatio(domainDataSplit.getTrainRatio())
			.testRatio(domainDataSplit.getTestRatio())
			.validationRatio(domainDataSplit.getValidationRatio())
			.randomSeed(domainDataSplit.getRandomSeed())
			.build();
	}

	private String determineModelType(String algorithm) {
		if (algorithm == null) {
			return null;
		}

		// 알고리즘에 따라 모델 타입 결정 (예시)
		return switch (algorithm.toUpperCase()) {
			case "RANDOM_FOREST", "DECISION_TREE", "LOGISTIC_REGRESSION", "SVM", "KNN", "NAIVE_BAYES" ->
				"CLASSIFICATION";
			case "LINEAR_REGRESSION", "RIDGE", "LASSO", "ELASTIC_NET", "SVR" -> "REGRESSION";
			default ->
				// 기본값 또는 알 수 없는 알고리즘의 경우
				"UNKNOWN";
		};
	}
}