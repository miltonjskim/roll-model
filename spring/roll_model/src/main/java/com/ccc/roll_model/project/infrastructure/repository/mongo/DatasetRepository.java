package com.ccc.roll_model.project.infrastructure.repository.mongo;

import com.ccc.roll_model.project.infrastructure.entity.mongo.DatasetDocument;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface DatasetRepository extends MongoRepository<DatasetDocument, ObjectId> {

    // 특정 프로젝트 ID에 해당하는 데이터셋 정보 검색
    DatasetDocument findByMemberIdAndProjectId(Integer memberId, Integer projectId);
}
