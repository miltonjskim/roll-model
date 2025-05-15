package com.ccc.roll_model.project.application;

import com.ccc.roll_model.global.exception.ApiException;
import com.ccc.roll_model.global.exception.ErrorCode;
import com.ccc.roll_model.pipeline.domain.model.vo.ModelPerformanceSummary;
import com.ccc.roll_model.project.application.command.ExportModelCommand;
import com.ccc.roll_model.project.infrastructure.entity.mongo.ModelDocument;
import com.ccc.roll_model.project.infrastructure.entity.mysql.PipelineEntity;
import com.ccc.roll_model.project.infrastructure.repository.mongo.ModelRepository;
import com.ccc.roll_model.project.infrastructure.repository.mysql.PipelineRepository;
import com.ccc.roll_model.project.ui.response.ModelExportResponse;
import io.minio.*;
import io.minio.errors.ErrorResponseException;
import io.minio.messages.Item;
import io.minio.http.Method;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.actuate.logging.LoggersEndpoint;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
public class ModelService {

    private final ModelRepository modelRepository;
    private final MinioClient minioClient;
    private final String bucketName = "ml-models";
    private final PipelineRepository pipelineRepository;

    public ModelService(
            ModelRepository modelRepository,
            @Qualifier("modelMinioClient") MinioClient minioClient,
            PipelineRepository pipelineRepository, LoggersEndpoint loggersEndpoint) {
        this.modelRepository = modelRepository;
        this.minioClient = minioClient;
        this.pipelineRepository = pipelineRepository;
    }

    @Transactional
    public ModelExportResponse exportModel(ExportModelCommand command) {
        log.info("파이프라인 ID: {}에 대한 모델 내보내기 시작", command.getPipelineId());

        ModelDocument modelDocument = modelRepository.findByPipelineId(command.getPipelineId());
        if (modelDocument == null) {
            throw new ApiException(ErrorCode.MODEL_NOT_FOUND);
        }

        try {
            String modelFilePath = modelDocument.getModelFilePath();
            String objectName = extractObjectName(modelFilePath);

            // 객체가 실제로 존재하는지 확인
            boolean objectExists = checkObjectExists(bucketName, objectName);

            if (!objectExists) {
                String fileId = getFileIdFromPath(objectName);
                if (fileId != null && !fileId.isEmpty()) {
                    String folderPrefix = objectName.substring(0, objectName.lastIndexOf('/') + 1);
                    String alternativeObject = findAlternativeObject(bucketName, folderPrefix, fileId);

                    if (alternativeObject != null) {
                        objectName = alternativeObject;
                    } else {
                        throw new ApiException(ErrorCode.MODEL_NOT_FOUND);
                    }
                } else {
                    throw new ApiException(ErrorCode.MODEL_NOT_FOUND);
                }
            }

            // 객체 정보 조회
            StatObjectResponse objectStat = minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );

            // 다운로드 URL 생성
            GetPresignedObjectUrlArgs urlArgs = GetPresignedObjectUrlArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .method(Method.GET)
                    .expiry(60 * 60) // 1시간 유효
                    .build();

            String downloadUrl = minioClient.getPresignedObjectUrl(urlArgs);
            String fileName = objectName.substring(objectName.lastIndexOf("/") + 1);

            // 다운로드 횟수 업데이트
            PipelineEntity pipeline = pipelineRepository.findById(command.getPipelineId())
                    .orElseThrow(() -> new ApiException(ErrorCode.PIPELINE_NOT_FOUND));
            pipeline.incrementDownloadCount();
            pipelineRepository.save(pipeline);

            return new ModelExportResponse(downloadUrl, fileName, objectStat.size());
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("모델 내보내기 실패: {}", e.getMessage(), e);
            throw new ApiException(ErrorCode.MODEL_EXPORT_FAILED);
        }
    }

    private boolean checkObjectExists(String bucket, String objectName) {
        try {
            minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .build()
            );
            return true;
        } catch (ErrorResponseException e) {
            if (e.getMessage().contains("Object does not exist")) {
                return false;
            }
            throw new RuntimeException("MinIO 객체 조회 중 오류 발생", e);
        } catch (Exception e) {
            throw new RuntimeException("MinIO 객체 조회 중 오류 발생", e);
        }
    }

    private String getFileIdFromPath(String objectPath) {
        if (objectPath == null || objectPath.isEmpty()) {
            return null;
        }

        // 파일명 추출 (마지막 / 이후 문자열)
        String fileName = objectPath.substring(objectPath.lastIndexOf('/') + 1);

        // 확장자 제거
        int extIndex = fileName.lastIndexOf('.');
        if (extIndex > 0) {
            return fileName.substring(0, extIndex);
        }

        return fileName;
    }

    private String findAlternativeObject(String bucket, String prefix, String fileId) {
        try {
            Iterable<Result<Item>> results = minioClient.listObjects(
                    ListObjectsArgs.builder()
                            .bucket(bucket)
                            .prefix(prefix)
                            .recursive(false)
                            .build()
            );

            for (Result<Item> result : results) {
                Item item = result.get();
                String objName = item.objectName();

                // 객체명에 파일 ID가 포함되어 있는지 확인
                String fileName = objName.substring(objName.lastIndexOf('/') + 1);
                if (fileName.contains(fileId)) {
                    return objName;
                }
            }

            return null;
        } catch (Exception e) {
            log.error("대체 객체 검색 실패: {}", e.getMessage());
            return null;
        }
    }

    private String extractObjectName(String modelFilePath) {
        if (modelFilePath.startsWith("s3://")) {
            // s3://ml-models/project5/681dc05b94fed8acc6f1dc6d.pkl 형식에서
            // ml-models는 버킷 이름이고, project5/681dc05b94fed8acc6f1dc6d.pkl는 객체 이름
            String withoutPrefix = modelFilePath.substring(5);

            // MinIO 버킷 이름 추출
            String[] parts = withoutPrefix.split("/", 2);
            if (parts.length > 1) {
                return parts[1]; // 객체 이름만 반환
            }
        }
        return modelFilePath;
    }

    @Transactional(readOnly = true)
    public ModelPerformanceSummary getModelPerformanceSummary(String pipelineId) {
        ModelDocument modelDocument = modelRepository.findByPipelineId(pipelineId);

        return ModelPerformanceSummary.builder()
            .modelId(String.valueOf(modelDocument.getId()))
            .learningDuration(modelDocument.getLearningDuration())
            .result(extractPerformanceResult(modelDocument))
            .build();
    }

    private Double extractPerformanceResult(ModelDocument model) {
        if (model.getPerformance() == null) {
            log.info("Not Found Performance Data : {}", model.getId());
            return null;
        }

        // Classification 모델인 경우 accuracy 추출
        if ("CLASSIFICATION".equals(model.getModelType()) &&
            model.getPerformance().getClassification() != null) {
            return model.getPerformance().getClassification().getAccuracy();
        }

        // Regression 모델인 경우 r_squared 추출
        if ("REGRESSION".equals(model.getModelType()) &&
            model.getPerformance().getRegression() != null) {
            return model.getPerformance().getRegression().getRSquared();
        }

        log.info("Not Found ModelType : {}", model.getModelType());
        return null;
    }

}