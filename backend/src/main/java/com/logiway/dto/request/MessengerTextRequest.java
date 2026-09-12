package com.logiway.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MessengerTextRequest(
    @NotNull(message = "Le destinataire est obligatoire")
    Long destinataireId,

    @Size(max = 4000, message = "Le message texte ne doit pas depasser 4000 caracteres")
    String contenu
) {
}