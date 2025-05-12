package com.ccc.roll_model.project.infrastructure.repository.mongo;

import com.ccc.roll_model.project.infrastructure.entity.mongo.ModelDocument;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ModelRepository extends MongoRepository<ModelDocument, ObjectId> {

    // 특정 프로젝트 ID에 해당하는 모델 데이터 검색
    ModelDocument findByProjectId(Integer projectId);

    // 특정 파이프라인 ID에 해당하는 모델 데이터 검색
    ModelDocument findByPipelineId(String pipelineId);

    List<ModelDocument> findAllByPipelineId(String pipelineId);
}
