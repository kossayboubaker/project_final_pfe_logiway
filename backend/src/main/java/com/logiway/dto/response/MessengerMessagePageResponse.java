package com.logiway.dto.response;

import java.util.List;

public record MessengerMessagePageResponse(
    List<MessengerMessageResponse> messages,
    int page,
    int size,
    long totalElements,
    boolean hasMore
) {
}