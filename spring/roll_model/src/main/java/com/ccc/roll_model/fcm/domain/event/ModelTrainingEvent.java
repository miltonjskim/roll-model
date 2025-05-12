package com.ccc.roll_model.fcm.domain.event;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class ModelTrainingEvent {
    private String modelId;
    private Integer memberId;
    private String modelName;
    private String status;
}