package com.logiway.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotMessageRequest {
    
    @NotBlank(message = "La question ne peut pas être vide")
    private String question;
}
