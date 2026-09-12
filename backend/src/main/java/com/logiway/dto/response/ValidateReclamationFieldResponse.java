package com.logiway.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidateReclamationFieldResponse {
    @JsonProperty("valide")
    private boolean valide;

    @JsonProperty("type_erreur")
    private String typeErreur;

    @JsonProperty("message")
    private String message;
}