package com.logiway.dto.request;

public record CongeDecisionRequest(
    String commentaire,
    Long notificationId
) {
}