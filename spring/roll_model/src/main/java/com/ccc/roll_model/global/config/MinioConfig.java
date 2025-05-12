package com.ccc.roll_model.global.config;

import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MinioConfig {

    // 기본 MinIO 설정
    @Value("${spring.minio.endpoint}")
    private String endpoint;

    @Value("${spring.minio.access-key}")
    private String accessKey;

    @Value("${spring.minio.secret-key}")
    private String secretKey;

    @Value("${spring.minio.secure}")
    private boolean secure;

    // 모델 전용 MinIO 설정
    @Value("${spring.model-minio.endpoint}")
    private String modelEndpoint;

    @Value("${spring.model-minio.access-key}")
    private String modelAccessKey;

    @Value("${spring.model-minio.secret-key}")
    private String modelSecretKey;

    @Value("${spring.model-minio.secure}")
    private boolean modelSecure;

    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
    }

    @Bean
    public MinioClient modelMinioClient() {
        return MinioClient.builder()
                .endpoint(modelEndpoint)
                .credentials(modelAccessKey, modelSecretKey)
                .build();
    }
}