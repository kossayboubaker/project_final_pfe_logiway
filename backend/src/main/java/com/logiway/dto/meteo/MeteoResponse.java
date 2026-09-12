package com.logiway.dto.meteo;

public record MeteoResponse(
    Double temperatureCelsius,
    String descriptionFr,
    String iconCode,
    Double windKmH,
    Integer humidity,
    Double visibilityKm,
    String etatGeneral,
    String risqueConduite,
    Boolean dangereux
) {
}