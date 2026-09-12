package com.logiway.security;

import com.logiway.entities.Utilisateur;
import com.logiway.exceptions.UnauthorizedException;
import com.logiway.repositories.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthenticatedUserService {

    private final UtilisateurRepository utilisateurRepository;

    public Utilisateur getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("User is not authenticated");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");
            if (email != null) {
                return utilisateurRepository.findByEmailIgnoreCase(email)
                    .orElseThrow(() -> new UnauthorizedException("Authenticated user not found"));
            }
            String preferredUsername = jwt.getClaimAsString("preferred_username");
            if (preferredUsername != null) {
                return utilisateurRepository.findByEmailIgnoreCase(preferredUsername)
                    .orElseThrow(() -> new UnauthorizedException("Authenticated user not found"));
            }
            String subject = jwt.getSubject();
            if (subject != null) {
                return utilisateurRepository.findAll().stream()
                    .filter(u -> subject.equals(u.getKeycloakId()))
                    .findFirst()
                    .orElseThrow(() -> new UnauthorizedException("Authenticated user not found"));
            }
        }

        String name = authentication.getName();
        return utilisateurRepository.findByEmailIgnoreCase(name)
            .orElseThrow(() -> new UnauthorizedException("Authenticated user not found"));
    }
}
