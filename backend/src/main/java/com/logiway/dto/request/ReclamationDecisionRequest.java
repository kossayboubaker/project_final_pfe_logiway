package com.logiway.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReclamationDecisionRequest {
    @NotBlank(message = "Commentaire is required")
    @JsonProperty("commentaire")
    private String commentaire;
}
