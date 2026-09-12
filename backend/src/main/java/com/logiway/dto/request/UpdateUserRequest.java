package com.logiway.dto.request;

import com.logiway.entities.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
    @Size(max = 100) String prenom,
    @Size(max = 100) String nom,
    @Email String email,
    @Size(max = 20) String telephone,
    @Size(max = 100) String pays,
    String image,
    Boolean estActif,
    @Size(max = 500) String rejectionReason,
    Role role,
    Long managerId
) {
}
