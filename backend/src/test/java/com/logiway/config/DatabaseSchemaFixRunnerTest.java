package com.logiway.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DatabaseSchemaFixRunner — Tests Unitaires")
class DatabaseSchemaFixRunnerTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private DatabaseSchemaFixRunner runner;

    @Test
    @DisplayName("run → table modifiée et colonne créée car absente")
    void run_columnDoesNotExist_createsColumn() {
        // Arrange
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class))).thenReturn(0);

        // Act
        runner.run();

        // Assert
        verify(jdbcTemplate, times(1)).execute("ALTER TABLE utilisateurs MODIFY COLUMN est_actif VARCHAR(20) NOT NULL");
        verify(jdbcTemplate, times(1)).execute("ALTER TABLE utilisateurs MODIFY COLUMN rejection_reason VARCHAR(500) NULL");
        verify(jdbcTemplate, times(1)).execute("ALTER TABLE utilisateurs ADD COLUMN created_by_id BIGINT NULL");
    }

    @Test
    @DisplayName("run → table modifiée mais colonne non créée car déjà existante")
    void run_columnExists_doesNotCreateColumn() {
        // Arrange
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class))).thenReturn(1);

        // Act
        runner.run();

        // Assert
        verify(jdbcTemplate, times(1)).execute("ALTER TABLE utilisateurs MODIFY COLUMN est_actif VARCHAR(20) NOT NULL");
        verify(jdbcTemplate, times(1)).execute("ALTER TABLE utilisateurs MODIFY COLUMN rejection_reason VARCHAR(500) NULL");
        verify(jdbcTemplate, never()).execute("ALTER TABLE utilisateurs ADD COLUMN created_by_id BIGINT NULL");
    }

    @Test
    @DisplayName("run → queryForObject retourne null → colonne créée par précaution")
    void run_columnQueryReturnsNull_createsColumn() {
        // Arrange
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class))).thenReturn(null);

        // Act
        runner.run();

        // Assert
        verify(jdbcTemplate, times(1)).execute("ALTER TABLE utilisateurs ADD COLUMN created_by_id BIGINT NULL");
    }

    @Test
    @DisplayName("run → levée d'exception → catchée sans propagation")
    void run_throwsException_caughtSuccessfully() {
        // Arrange
        doThrow(new RuntimeException("DB Connection lost")).when(jdbcTemplate).execute(anyString());

        // Act & Assert
        runner.run();
        
        verify(jdbcTemplate, never()).queryForObject(anyString(), eq(Integer.class));
    }
}
