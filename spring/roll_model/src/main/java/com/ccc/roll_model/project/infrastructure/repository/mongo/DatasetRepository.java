package com.ccc.roll_model.project.infrastructure.repository.mongo;

import com.ccc.roll_model.project.infrastructure.entity.mongo.DatasetDocument;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface DatasetRepository extends MongoRepository<DatasetDocument, ObjectId> {

    // 특정 프로젝트 ID에 해당하는 데이터셋 정보 검색
    DatasetDocument findByMemberIdAndProjectId(Integer memberId, Integer projectId);

    // 프로젝트 ID로만 데이터셋 정보 검색
    DatasetDocument findByProjectId(Integer projectId);

    // 프로젝트 ID와 전처리 여부로 데이터셋 검색
    DatasetDocument findByProjectIdAndIsPreprocessed(Integer projectId, Boolean isPreprocessed);

    // DatasetDocument 엔티티에는 'originalDatasetId' 필드가 없으므로 아래 메서드는 삭제
    // 또는 실제 엔티티 필드명에 맞게 수정해야 함
    // DatasetDocument findByOriginalDatasetId(String originalDatasetId);

    DatasetDocument findByEtag(String etag);

    boolean existsByProjectId(Integer projectId);
}