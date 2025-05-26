package com.ccc.roll_model.pipeline.infrastructure.repository.mongo;

import java.util.Optional;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.ccc.roll_model.pipeline.infrastructure.entity.mongo.PipelineDocument;

public interface PipelineMongoRepository extends MongoRepository<PipelineDocument, ObjectId> {
	Optional<PipelineDocument> findById(ObjectId id, Integer memberId);

	 // id 필드를 사용하여 수정 일시 기준 가장 최신 문서를 조회
	 PipelineDocument findTopByIdOrderByModifiedAtDesc(ObjectId id);
}
