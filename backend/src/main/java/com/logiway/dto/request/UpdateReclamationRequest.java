package com.logiway.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.logiway.entities.enums.PrioriteReclamation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateReclamationRequest {

    @NotBlank(message = "Sujet is required")
    @JsonProperty("sujet")
    private String sujet;

    @NotBlank(message = "Description is required")
    @JsonProperty("description")
    private String description;

    @NotNull(message = "Priorite is required")
    @JsonProperty("priorite")
    private PrioriteReclamation priorite;
}
