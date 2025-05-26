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
}