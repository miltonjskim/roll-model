package com.ccc.roll_model.project.infrastructure.entity.mongo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "datasets")
public class DatasetDocument {

    private ObjectId id; // MongoDB의 _id 필드 (ObjectId)
    private LocalDateTime registeredAt; // 등록 시간
    private Integer projectId;
    private Integer memberId; // 데이터셋 등록한 회원 ID
    private String category; // 카테고리 (예: CLASSIFICATION)
    private String domain; // 도메인 (예: MARKETING)

    private Metadata metadata; // 데이터셋 메타데이터

    private String datasetFilePath; // 데이터셋 파일 경로
    private Long fileSize; // 파일 크기
    private String fileType; // 파일 형식 (예: CSV, JSON 등)
    private Boolean isPreprocessed; // 전처리 여부
    private String etag;

    // ------ 중첩 클래스 정의 ------

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class Metadata {
        private Integer rowCount; // 행 수
        private Integer columnCount; // 열 수
        private Map<String, String> dataTypes; // 열과 데이터 타입 매핑 (예: {"age": "NUMERIC"})
        private Map<String, Integer> missingValueCount; // 열과 결측값 개수 매핑 (예: {"age": 5})
        private Statistics statistics; // 통계 정보

        @Getter
        @Setter
        @AllArgsConstructor
        @NoArgsConstructor
        @Builder
        public static class Statistics {
            private Map<String, NumericFeature> numericFeatures; // 숫자형 특성 통계
            private Map<String, CategoricalFeature> categoricalFeatures; // 범주형 특성 통계
            private List<List<Double>> correlationMatrix; // 상관 관계 매트릭스

            @Getter
            @Setter
            @AllArgsConstructor
            @NoArgsConstructor
            @Builder
            public static class NumericFeature {
                private Double mean; // 평균
                private Double median; // 중간값
                private Double std; // 표준편차
                private Double min; // 최소값
                private Double max; // 최대값
                private List<Integer> histogram; // 히스토그램 데이터
            }

            @Getter
            @Setter
            @AllArgsConstructor
            @NoArgsConstructor
            @Builder
            public static class CategoricalFeature {
                private Map<String, Integer> valueCounts; // 각 값과 빈도수 매핑 (예: {"M": 600, "F": 400})
                private Integer uniqueCount; // 고유 값 개수
            }
        }
    }
}
