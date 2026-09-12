package com.logiway.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @Size(max = 100) String prenom,
    @Size(max = 100) String nom,
    @Size(max = 20) String telephone,
    @Size(max = 2_000_000) String image
) {
}
