package com.logiway.dto.response;

import java.time.LocalDateTime;

public record MessengerPresenceResponse(
    Long utilisateurId,
    Boolean connecte,
    LocalDateTime derniereActivite
) {
}