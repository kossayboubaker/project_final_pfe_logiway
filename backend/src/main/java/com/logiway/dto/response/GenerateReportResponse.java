package com.logiway.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateReportResponse {
    
    private Boolean success;
    private String reportId;
    private String message;
    private ReportMetadataResponse metadata;
    private String urlDownload;
}
