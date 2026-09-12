package com.logiway.dto.request;

import com.logiway.entities.enums.TypeConge;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateCongeRequest(
    @NotNull TypeConge type,
    @NotNull LocalDate dateDebut,
    @NotNull LocalDate dateFin,
    @NotNull @Size(min = 5, max = 500) String motif
) {
}