package com.logiway.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("BeanConfig — Tests Unitaires")
class BeanConfigTest {

    private final BeanConfig beanConfig = new BeanConfig();

    @Test
    @DisplayName("passwordEncoder() → retourne un BCryptPasswordEncoder fonctionnel")
    void passwordEncoder_returnsBCrypt() {
        PasswordEncoder encoder = beanConfig.passwordEncoder();
        assertThat(encoder).isNotNull();
        assertThat(encoder).isInstanceOf(BCryptPasswordEncoder.class);

        String raw = "superSecret123";
        String hashed = encoder.encode(raw);
        assertThat(hashed).isNotEqualTo(raw);
        assertThat(encoder.matches(raw, hashed)).isTrue();
        assertThat(encoder.matches("wrongSecret", hashed)).isFalse();
    }

    @Test
    @DisplayName("restTemplate() → retourne des instances distinctes de RestTemplate")
    void restTemplate_returnsNewInstance() {
        RestTemplate rt1 = beanConfig.restTemplate();
        RestTemplate rt2 = beanConfig.restTemplate();
        assertThat(rt1).isNotNull();
        assertThat(rt2).isNotNull();
        assertThat(rt1).isNotSameAs(rt2);
    }
}
