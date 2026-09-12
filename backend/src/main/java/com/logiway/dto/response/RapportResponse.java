package com.logiway.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RapportResponse {
    
    private String titre;
    private LocalDateTime dateGeneration;
    private List<RapportSection> sections;
    private String resumeIA;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RapportSection {
        private String titre;
        private String contenu;
    }
}
