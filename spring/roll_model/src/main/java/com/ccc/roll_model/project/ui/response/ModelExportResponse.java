package com.ccc.roll_model.project.ui.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ModelExportResponse {
    private String downloadUrl;
    private String fileName;
    private long fileSize;
}