package com.logiway.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.logiway.dto.request.CreateUserRequest;
import com.logiway.dto.request.UpdateUserRequest;
import com.logiway.dto.response.ApiMessageResponse;
import com.logiway.dto.response.UserResponse;
import com.logiway.entities.enums.Role;
import com.logiway.entities.enums.StatutCompte;
import com.logiway.services.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("Controller User — Tests Unitaires")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    private static UserResponse buildUserResponse(Long id, String prenom, String nom) {
        return new UserResponse(
            id, "kc-1", prenom, nom, "jean@test.com", "+33612345678", "France", null,
            StatutCompte.ACTIF, true, true, null,
            Role.CHAUFFEUR, null, 2L, "Manager", "Test",
            null, null, null, null, LocalDateTime.now()
        );
    }

    @Test
    @DisplayName("GET /api/users → Retourne liste des utilisateurs")
    void listUsersReturnsCollection() throws Exception {
        UserResponse user1 = buildUserResponse(1L, "Jean", "Dupont");
        when(userService.getUsers()).thenReturn(List.of(user1));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].email").value("jean@test.com"));
    }

    @Test
    @DisplayName("POST /api/users/create → Crée nouvel utilisateur")
    void createUser_returnsOk() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
            "Jean", "Dupont", "jean@test.com", "+33612345678", "France",
            null, Role.CHAUFFEUR, true, null
        );
        UserResponse user = buildUserResponse(1L, "Jean", "Dupont");
        when(userService.createUser(any(CreateUserRequest.class))).thenReturn(user);

        mockMvc.perform(post("/api/users/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("jean@test.com"));
    }

    @Test
    @DisplayName("PUT /api/users/{id} → Met à jour utilisateur")
    void updateUser_returnsOk() throws Exception {
        UpdateUserRequest request = new UpdateUserRequest(
            "Jean", "Martin", "jean@test.com", "+33612345678", "France",
            null, true, null, Role.CHAUFFEUR, null
        );
        UserResponse user = buildUserResponse(1L, "Jean", "Martin");
        when(userService.updateUser(eq(1L), any(UpdateUserRequest.class))).thenReturn(user);

        mockMvc.perform(put("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Martin"));
    }

    @Test
    @DisplayName("DELETE /api/users/{id} → Supprime utilisateur")
    void deleteUser_returnsOk() throws Exception {
        ApiMessageResponse response = new ApiMessageResponse("User deleted successfully");
        when(userService.deleteUser(1L)).thenReturn(response);

        mockMvc.perform(delete("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User deleted successfully"));
    }
}
