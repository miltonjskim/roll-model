package com.ccc.roll_model.project.application;

import com.ccc.roll_model.global.exception.ApiException;
import com.ccc.roll_model.global.exception.ErrorCode;
import com.ccc.roll_model.project.application.command.ExportModelCommand;
import com.ccc.roll_model.project.infrastructure.entity.mongo.ModelDocument;
import com.ccc.roll_model.project.infrastructure.entity.mysql.PipelineEntity;
import com.ccc.roll_model.project.infrastructure.repository.mongo.ModelRepository;
import com.ccc.roll_model.project.infrastructure.repository.mysql.PipelineRepository;
import com.ccc.roll_model.project.ui.response.ModelExportResponse;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.StatObjectArgs;
import io.minio.StatObjectResponse;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ModelService {

    private final ModelRepository modelRepository;

    // 모델 전용 MinIO 클라이언트 주입
    @Qualifier("modelMinioClient")
    private final MinioClient minioClient;

    @Value("${spring.model-minio.bucket-name}")
    private String bucketName;

    private final PipelineRepository pipelineRepository;

    @Transactional
    public ModelExportResponse exportModel(ExportModelCommand command) {
        // 파이프라인 ID로 모델 검색
        ModelDocument modelDocument = modelRepository.findByPipelineId(command.getPipelineId());
        if (modelDocument == null) {
            throw new ApiException(ErrorCode.MODEL_NOT_FOUND);
        }

        try {
            // model_file_path에서 객체 이름 추출
            // ex) s3://roll-model/models/random_forest_regressor_681dbc5ddf4eb1c452358c6a_20250509.pkl
            String modelFilePath = modelDocument.getModelFilePath();
            String objectName = extractObjectName(modelFilePath);

            // MinIO에서 객체 정보 조회
            StatObjectResponse objectStat = minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );

            // 파일 다운로드 URL 생성 (minio 기본 만료 시간은 7일)
            String downloadUrl = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .method(Method.GET)
                            // .expiry(7, TimeUnit.DAYS) // 무한으로 하려면 3650 이렇게 하면 됨
                            .build()
            );

            // 파일 이름 추출
            String fileName = objectName.substring(objectName.lastIndexOf("/") + 1);

            // 파이프라인 다운로드 카운트 증가
            PipelineEntity pipeline = pipelineRepository.findById(command.getPipelineId())
                    .orElseThrow(() -> new ApiException(ErrorCode.PIPELINE_NOT_FOUND));
            pipeline.incrementDownloadCount();
            pipelineRepository.save(pipeline);

            return new ModelExportResponse(downloadUrl, fileName, objectStat.size());

        } catch (Exception e) {
            log.error("모델 내보내기 중 오류 발생", e);
            throw new ApiException(ErrorCode.MODEL_EXPORT_FAILED);
        }
    }

    // S3 형식 URL에서 객체 이름 추출
    private String extractObjectName(String modelFilePath) {
        if (modelFilePath.startsWith("s3://")) {
            String[] parts = modelFilePath.substring(5).split("/", 2);
            if (parts.length > 1) {
                return parts[1];
            }
        }
        return modelFilePath;
    }
}