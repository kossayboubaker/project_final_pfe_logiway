package com.logiway;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.boot.SpringApplication;

import static org.mockito.Mockito.*;

/**
 * Test unitaire de LogiwayApplication.
 * Couvre la méthode main() en mockant SpringApplication.run()
 * pour éviter de démarrer le contexte Spring complet.
 */
@DisplayName("LogiwayApplication — Tests Unitaires")
class LogiwayApplicationTest {

    @Test
    @DisplayName("main() → appelle SpringApplication.run() sans démarrer le contexte")
    void main_callsSpringApplicationRun() {
        try (MockedStatic<SpringApplication> mocked = mockStatic(SpringApplication.class)) {
            // Mock SpringApplication.run() pour ne rien faire
            mocked.when(() -> SpringApplication.run(LogiwayApplication.class, new String[]{}))
                  .thenReturn(null);

            // Appel direct à main()
            LogiwayApplication.main(new String[]{});

            // Vérifie que run() a bien été appelé
            mocked.verify(() -> SpringApplication.run(LogiwayApplication.class, new String[]{}));
        }
    }

    @Test
    @DisplayName("main() avec arguments → transmet les args à SpringApplication.run()")
    void main_withArgs_passesArgsToSpringApplication() {
        String[] args = {"--server.port=9090", "--spring.profiles.active=test"};
        try (MockedStatic<SpringApplication> mocked = mockStatic(SpringApplication.class)) {
            mocked.when(() -> SpringApplication.run(LogiwayApplication.class, args))
                  .thenReturn(null);

            LogiwayApplication.main(args);

            mocked.verify(() -> SpringApplication.run(LogiwayApplication.class, args));
        }
    }
}
