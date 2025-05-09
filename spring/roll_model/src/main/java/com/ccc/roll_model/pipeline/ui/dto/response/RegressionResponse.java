package com.ccc.roll_model.pipeline.ui.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 모델링 평가 응답 중 회귀 응답 Response
 */
@Getter
@NoArgsConstructor
public class RegressionResponse extends GetModelAndMetricResponse{

    private ActualVsPredicted actualVsPredicted;
    private ResidualPlot residualPlot;

    @Builder(builderMethodName = "regressionBuilder")
    public RegressionResponse(ProjectInfo projectInfo, String algorithm,
                              List<ModelParameters> modelParameters,List<Map<String, String>> targetInfo,
                              List<PerformanceMetric> performanceMetrics,
                              ActualVsPredicted actualVsPredicted, ResidualPlot residualPlot,
                              List<FeatureImportance> featureImportance) {
        super(projectInfo, algorithm, modelParameters, targetInfo, performanceMetrics, featureImportance);
        this.actualVsPredicted = actualVsPredicted;
        this.residualPlot = residualPlot;
    }
    @Getter
    @NoArgsConstructor
    public static class ActualVsPredicted {
        private List<DataPoint> data;
        private String xAxisLabel;
        private String yAxisLabel;
        private List<PointXY> perfectLinePoints;

        @Builder
        public ActualVsPredicted(List<DataPoint> data, String xAxisLabel, String yAxisLabel
                , List<PointXY> perfectLinePoints) {
            this.data = data;
            this.xAxisLabel = xAxisLabel;
            this.yAxisLabel = yAxisLabel;
            this.perfectLinePoints = perfectLinePoints;
        }

        @Getter
        @NoArgsConstructor
        public static class DataPoint {
            private double actual;
            private double predicted;
            private int id;

            @Builder
            public DataPoint(double actual, double predicted, int id) {
                this.actual = actual;
                this.predicted = predicted;
                this.id = id;
            }
        }

        @Getter
        @NoArgsConstructor
        public static class PointXY {
            private double x;
            private double y;

            @Builder
            public PointXY(double x, double y) {
                this.x = x;
                this.y = y;
            }
        }
    }

    @Getter
    @NoArgsConstructor
    public static class ResidualPlot {
        private List<ResidualDataPoint> data;
        private Histogram histogram;
        private String xAxisLabel;
        private String yAxisLabel;
        private double zeroLineY;

        @Builder
        public ResidualPlot(List<ResidualDataPoint> data,Histogram histogram,
                            String xAxisLabel, String yAxisLabel, double zeroLineY) {
            this.data = data;
            this.histogram = histogram;
            this.xAxisLabel = xAxisLabel;
            this.yAxisLabel = yAxisLabel;
            this.zeroLineY = zeroLineY;

        }
        @Getter
        @NoArgsConstructor
        public static class ResidualDataPoint {
            private double predicted;
            private double residual;
            private int id;

            @Builder
            public ResidualDataPoint(double predicted, double residual, int id) {
                this.predicted = predicted;
                this.residual = residual;
                this.id = id;
            }
        }

        @Getter
        @NoArgsConstructor
        public static class Histogram {
            private List<Double> bins;
            private List<Integer> frequencies;

            @Builder
            public Histogram(List<Double> bins, List<Integer> frequencies) {
                this.bins = bins;
                this.frequencies = frequencies;
            }
        }
    }

}
