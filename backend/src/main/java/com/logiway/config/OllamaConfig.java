package com.logiway.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class OllamaConfig {

    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ollama.model:qwen3:8b}")
    private String ollamaModel;

    @Value("${ollama.timeout-seconds:60}")
    private Long ollamaTimeout;

    public String getOllamaBaseUrl() {
        return ollamaBaseUrl;
    }

    public String getOllamaModel() {
        return ollamaModel;
    }

    public Long getOllamaTimeout() {
        return ollamaTimeout;
    }

    @Bean(name = "ollamaRestTemplate")
    public RestTemplate ollamaRestTemplate(RestTemplateBuilder builder) {
        Duration timeout = Duration.ofSeconds(ollamaTimeout);
        return builder
            .setConnectTimeout(timeout)
            .setReadTimeout(timeout)
            .build();
    }
}
