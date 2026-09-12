package com.logiway.dto.request;

import com.logiway.entities.enums.TypeConge;

import java.time.LocalDate;

public record UpdateCongeRequest(
    TypeConge type,
    LocalDate dateDebut,
    LocalDate dateFin,
    String motif
) {
}