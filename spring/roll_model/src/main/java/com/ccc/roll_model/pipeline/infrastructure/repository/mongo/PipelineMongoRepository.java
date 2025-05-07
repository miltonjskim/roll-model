package com.ccc.roll_model.pipeline.infrastructure.repository.mongo;

import java.util.Optional;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.ccc.roll_model.pipeline.infrastructure.entity.mongo.PipelineDocument;

public interface PipelineMongoRepository extends MongoRepository<PipelineDocument, ObjectId> {
	Optional<PipelineDocument> findById(ObjectId id, Integer memberId);

	// 소유자 여부와 상관없이 파이프라인 문서를 조회하는 메서드
	// 기본 findById 메서드를 사용하면 됨 (MongoRepository에서 상속)
}
