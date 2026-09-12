package com.logiway.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidateReclamationResponse {
    private ValidateReclamationFieldResponse sujet;
    private ValidateReclamationFieldResponse description;
}
