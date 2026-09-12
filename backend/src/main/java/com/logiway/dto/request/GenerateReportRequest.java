package com.logiway.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateReportRequest {
    
    @NotBlank(message = "La requête naturelle ne peut pas être vide")
    private String requeteNaturelle;
    
    private String formatPrefere; // PDF, CSV, TXT
}
