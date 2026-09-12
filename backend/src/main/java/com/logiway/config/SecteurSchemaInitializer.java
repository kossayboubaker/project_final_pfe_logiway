package com.logiway.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
@RequiredArgsConstructor
@Slf4j
public class SecteurSchemaInitializer {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void ensureSecteurCreatedAtDefault() {
        try {
            Integer columnExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.COLUMNS " +
                "WHERE TABLE_SCHEMA = DATABASE() " +
                "AND TABLE_NAME = 'secteurs' " +
                "AND COLUMN_NAME = 'created_at'",
                Integer.class
            );

            if (columnExists != null && columnExists > 0) {
                jdbcTemplate.execute("ALTER TABLE secteurs MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
                log.info("Secteur schema check: ensured default value on secteurs.created_at");
            }
        } catch (Exception ex) {
            log.warn("Secteur schema check skipped or failed: {}", ex.getMessage());
        }
    }
}
