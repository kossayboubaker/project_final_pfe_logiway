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
@DisplayName("SecteurSchemaInitializer — Tests Unitaires")
class SecteurSchemaInitializerTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private SecteurSchemaInitializer initializer;

    @Test
    @DisplayName("ensureSecteurCreatedAtDefault → colonne existante → alter table exécuté")
    void columnExists_runsAlterTable() {
        // Arrange
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class))).thenReturn(1);

        // Act
        initializer.ensureSecteurCreatedAtDefault();

        // Assert
        verify(jdbcTemplate, times(1)).execute("ALTER TABLE secteurs MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
    }

    @Test
    @DisplayName("ensureSecteurCreatedAtDefault → colonne absente (0) → pas d'alter table")
    void columnDoesNotExist_doesNotRunAlterTable() {
        // Arrange
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class))).thenReturn(0);

        // Act
        initializer.ensureSecteurCreatedAtDefault();

        // Assert
        verify(jdbcTemplate, never()).execute(anyString());
    }

    @Test
    @DisplayName("ensureSecteurCreatedAtDefault → queryForObject retourne null → pas d'alter table")
    void columnQueryReturnsNull_doesNotRunAlterTable() {
        // Arrange
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class))).thenReturn(null);

        // Act
        initializer.ensureSecteurCreatedAtDefault();

        // Assert
        verify(jdbcTemplate, never()).execute(anyString());
    }

    @Test
    @DisplayName("ensureSecteurCreatedAtDefault → exception levée → catchée sans propagation")
    void throwsException_caughtSuccessfully() {
        // Arrange
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class))).thenThrow(new RuntimeException("DB offline"));

        // Act & Assert
        initializer.ensureSecteurCreatedAtDefault();
        
        verify(jdbcTemplate, never()).execute(anyString());
    }
}
