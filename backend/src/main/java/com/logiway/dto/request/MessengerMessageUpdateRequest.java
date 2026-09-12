package com.logiway.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MessengerMessageUpdateRequest(
    @NotBlank(message = "Le contenu ne peut pas etre vide")
    @Size(max = 4000, message = "Le contenu ne peut pas depasser 4000 caracteres")
    String contenu
) {
}