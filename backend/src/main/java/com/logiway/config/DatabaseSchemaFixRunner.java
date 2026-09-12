package com.logiway.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSchemaFixRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            jdbcTemplate.execute("ALTER TABLE utilisateurs MODIFY COLUMN est_actif VARCHAR(20) NOT NULL");
            jdbcTemplate.execute("ALTER TABLE utilisateurs MODIFY COLUMN rejection_reason VARCHAR(500) NULL");

            Integer createdByColumnCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'utilisateurs' AND column_name = 'created_by_id'",
                Integer.class
            );

            if (createdByColumnCount == null || createdByColumnCount == 0) {
                jdbcTemplate.execute("ALTER TABLE utilisateurs ADD COLUMN created_by_id BIGINT NULL");
            }

            log.info("Database schema check applied for utilisateurs.est_actif, utilisateurs.rejection_reason and utilisateurs.created_by_id");
        } catch (Exception ex) {
            log.warn("Database schema fix could not be applied automatically: {}", ex.getMessage());
        }
    }
}