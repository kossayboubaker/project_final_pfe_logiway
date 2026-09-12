package com.logiway.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ValidateReclamationRequest {
    @JsonProperty("sujet")
    private String sujet;

    @JsonProperty("description")
    private String description;
}
