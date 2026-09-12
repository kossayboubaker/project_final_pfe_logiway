package com.logiway.dto.response;

import java.time.LocalDateTime;

public record MessengerReadResponse(
    Long destinataireId,
    Long messagesMarquesLus,
    LocalDateTime dateLecture
) {
}