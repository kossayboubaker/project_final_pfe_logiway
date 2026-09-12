package com.logiway.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.web.client.RestTemplate;

import java.lang.reflect.Field;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("OllamaConfig — Tests Unitaires")
class OllamaConfigTest {

    private void setField(Object target, String name, Object value) throws Exception {
        Field f = target.getClass().getDeclaredField(name);
        f.setAccessible(true);
        f.set(target, value);
    }

    @Test
    @DisplayName("Getters & ollamaRestTemplate → fonctionnement complet")
    void gettersAndRestTemplate() throws Exception {
        OllamaConfig cfg = new OllamaConfig();
        setField(cfg, "ollamaBaseUrl", "http://localhost:11434");
        setField(cfg, "ollamaModel", "qwen3:8b");
        setField(cfg, "ollamaTimeout", 60L);

        assertThat(cfg.getOllamaBaseUrl()).isEqualTo("http://localhost:11434");
        assertThat(cfg.getOllamaModel()).isEqualTo("qwen3:8b");
        assertThat(cfg.getOllamaTimeout()).isEqualTo(60L);

        RestTemplate rt = cfg.ollamaRestTemplate(new RestTemplateBuilder());
        assertThat(rt).isNotNull();
    }
}
