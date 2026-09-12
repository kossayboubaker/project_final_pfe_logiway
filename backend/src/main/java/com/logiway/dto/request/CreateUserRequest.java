package com.logiway.dto.request;

import com.logiway.entities.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
    @NotBlank @Size(max = 100) String prenom,
    @NotBlank @Size(max = 100) String nom,
    @NotBlank @Email String email,
    @Size(max = 20) String telephone,
    @Size(max = 100) String pays,
    String image,
    @NotNull Role role,
    Boolean estActif,
    Long managerId
) {
}
