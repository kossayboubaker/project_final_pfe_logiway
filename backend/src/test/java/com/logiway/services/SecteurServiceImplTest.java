package com.logiway.services;

import com.logiway.dto.request.CreateSectorRequest;
import com.logiway.dto.request.UpdateSectorRequest;
import com.logiway.dto.response.SectorResponse;
import com.logiway.entities.Chauffeur;
import com.logiway.entities.Entreprise;
import com.logiway.entities.Manager;
import com.logiway.entities.Notification;
import com.logiway.entities.Secteur;
import com.logiway.entities.Utilisateur;
import com.logiway.entities.enums.Role;
import com.logiway.exceptions.BadRequestException;
import com.logiway.exceptions.ResourceNotFoundException;
import com.logiway.exceptions.UnauthorizedException;
import com.logiway.repositories.ChauffeurRepository;
import com.logiway.repositories.EntrepriseRepository;
import com.logiway.repositories.ManagerRepository;
import com.logiway.repositories.NotificationRepository;
import com.logiway.repositories.SecteurRepository;
import com.logiway.repositories.UtilisateurRepository;
import com.logiway.security.AuthenticatedUserService;
import com.logiway.services.impl.SecteurServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Method;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SecteurServiceImplTest {

    @Mock
    private SecteurRepository secteurRepository;
    @Mock
    private EntrepriseRepository entrepriseRepository;
    @Mock
    private ManagerRepository managerRepository;
    @Mock
    private ChauffeurRepository chauffeurRepository;
    @Mock
    private UtilisateurRepository utilisateurRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private NotificationRealtimeService notificationRealtimeService;
    @Mock
    private AuthenticatedUserService authenticatedUserService;

    private SecteurServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new SecteurServiceImpl(secteurRepository, entrepriseRepository, managerRepository,
            chauffeurRepository, utilisateurRepository, notificationRepository, notificationRealtimeService,
            authenticatedUserService);
    }

    private Utilisateur user(Long id, Role role) {
        Utilisateur u = new Utilisateur();
        u.setId(id);
        u.setRole(role);
        u.setPrenom("Jean");
        u.setNom("Dupont");
        u.setEmail("jean@logiway.fr");
        return u;
    }

    private Entreprise entreprise(Long id) {
        Entreprise e = new Entreprise();
        e.setId(id);
        e.setNomEntreprise("Logiway " + id);
        return e;
    }

    private Secteur secteur(Long id, String nom, Entreprise entreprise) {
        Secteur s = new Secteur();
        s.setId(id);
        s.setNom(nom);
        s.setDescription("desc");
        s.setZoneGeographique("Paris");
        s.setCodesPostaux("75000");
        s.setEntreprise(entreprise);
        return s;
    }

    private Manager manager(Long id, Secteur secteur, Entreprise entreprise) {
        Manager m = new Manager();
        m.setId(id);
        m.setPrenom("Paul");
        m.setNom("Martin");
        m.setEmail("paul@logiway.fr");
        m.setRole(Role.MANAGER);
        m.setSecteur(secteur);
        m.setEntreprise(entreprise);
        return m;
    }

    private Chauffeur chauffeur(Long id, Secteur secteur, Manager manager, Entreprise entreprise) {
        Chauffeur c = new Chauffeur();
        c.setId(id);
        c.setPrenom("Marie");
        c.setNom("Martin");
        c.setEmail("marie@logiway.fr");
        c.setRole(Role.CHAUFFEUR);
        c.setSecteur(secteur);
        c.setManager(manager);
        c.setEntreprise(entreprise);
        return c;
    }

    @Test
    void getAccessibleSectors_superAdmin_returnsAll() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Entreprise e = entreprise(1L);
        Secteur s1 = secteur(1L, "Paris", e);
        Secteur s2 = secteur(2L, "Lyon", e);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findAllWithRelations()).thenReturn(List.of(s1, s2));

        List<SectorResponse> result = service.getAccessibleSectors();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).nom()).isEqualTo("Paris");
        assertThat(result.get(1).entrepriseId()).isEqualTo(1L);
    }

    @Test
    void getAccessibleSectors_manager_returnsEnterpriseSectors() {
        Utilisateur current = user(2L, Role.MANAGER);
        current.setEntreprise(entreprise(5L));
        Secteur s = secteur(3L, "Marseille", entreprise(5L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByEntrepriseIdWithRelations(5L)).thenReturn(List.of(s));

        List<SectorResponse> result = service.getAccessibleSectors();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(3L);
    }

    @Test
    void getAccessibleSectors_managerWithoutEnterprise_returnsEmpty() {
        Utilisateur current = user(2L, Role.MANAGER);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);

        List<SectorResponse> result = service.getAccessibleSectors();

        assertThat(result).isEmpty();
    }

    @Test
    void getAccessibleSectors_chauffeur_directSector() {
        Utilisateur current = user(10L, Role.CHAUFFEUR);
        Secteur s = secteur(4L, "Toulouse", entreprise(1L));
        Chauffeur chauffeur = chauffeur(10L, s, null, entreprise(1L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(chauffeurRepository.findById(10L)).thenReturn(Optional.of(chauffeur));
        when(secteurRepository.findByIdWithRelations(4L)).thenReturn(Optional.of(s));

        List<SectorResponse> result = service.getAccessibleSectors();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(4L);
    }

    @Test
    void getAccessibleSectors_chauffeur_sectorViaManager() {
        Utilisateur current = user(11L, Role.CHAUFFEUR);
        Secteur managerSector = secteur(5L, "Nantes", entreprise(2L));
        Manager manager = manager(7L, managerSector, entreprise(2L));
        Chauffeur chauffeur = chauffeur(11L, null, manager, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(chauffeurRepository.findById(11L)).thenReturn(Optional.of(chauffeur));
        when(secteurRepository.findByIdWithRelations(5L)).thenReturn(Optional.of(managerSector));

        List<SectorResponse> result = service.getAccessibleSectors();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(5L);
    }

    @Test
    void getAccessibleSectors_chauffeur_fallbackEnterprise() {
        Utilisateur current = user(12L, Role.CHAUFFEUR);
        Secteur fallback = secteur(6L, "Bordeaux", entreprise(3L));
        Chauffeur chauffeur = chauffeur(12L, null, null, entreprise(3L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(chauffeurRepository.findById(12L)).thenReturn(Optional.of(chauffeur));
        when(secteurRepository.findByEntrepriseIdWithRelations(3L)).thenReturn(List.of(fallback));

        List<SectorResponse> result = service.getAccessibleSectors();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(6L);
    }

    @Test
    void getAccessibleSectors_chauffeur_notFound_returnsEmpty() {
        Utilisateur current = user(13L, Role.CHAUFFEUR);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(chauffeurRepository.findById(13L)).thenReturn(Optional.empty());

        List<SectorResponse> result = service.getAccessibleSectors();

        assertThat(result).isEmpty();
    }

    @Test
    void getAccessibleSectors_chauffeur_noSectorResolved_returnsEmpty() {
        Utilisateur current = user(14L, Role.CHAUFFEUR);
        Chauffeur chauffeur = chauffeur(14L, null, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(chauffeurRepository.findById(14L)).thenReturn(Optional.of(chauffeur));

        List<SectorResponse> result = service.getAccessibleSectors();

        assertThat(result).isEmpty();
    }

    @Test
    void getAccessibleSectors_chauffeur_enterpriseWithoutSectors_returnsEmpty() {
        Utilisateur current = user(15L, Role.CHAUFFEUR);
        Chauffeur chauffeur = chauffeur(15L, null, null, entreprise(9L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(chauffeurRepository.findById(15L)).thenReturn(Optional.of(chauffeur));
        when(secteurRepository.findByEntrepriseIdWithRelations(9L)).thenReturn(List.of());

        List<SectorResponse> result = service.getAccessibleSectors();

        assertThat(result).isEmpty();
    }

    @Test
    void getSectorById_success() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Secteur s = secteur(1L, "Paris", entreprise(1L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(1L)).thenReturn(Optional.of(s));

        SectorResponse result = service.getSectorById(1L);

        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void getSectorById_notFound_throws() {
        when(secteurRepository.findByIdWithRelations(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getSectorById(1L))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getSectorById_managerAuthorized() {
        Utilisateur current = user(2L, Role.MANAGER);
        current.setEntreprise(entreprise(5L));
        Secteur s = secteur(1L, "Paris", entreprise(5L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(1L)).thenReturn(Optional.of(s));

        SectorResponse result = service.getSectorById(1L);

        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void getSectorById_managerNotAuthorized_throws() {
        Utilisateur current = user(2L, Role.MANAGER);
        current.setEntreprise(entreprise(6L));
        Secteur s = secteur(1L, "Paris", entreprise(5L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(1L)).thenReturn(Optional.of(s));

        assertThatThrownBy(() -> service.getSectorById(1L))
            .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void getSectorById_chauffeurAuthorized() {
        Utilisateur current = user(10L, Role.CHAUFFEUR);
        Secteur s = secteur(4L, "Toulouse", entreprise(1L));
        Chauffeur chauffeur = chauffeur(10L, s, null, entreprise(1L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(4L)).thenReturn(Optional.of(s));
        when(chauffeurRepository.findById(10L)).thenReturn(Optional.of(chauffeur));

        SectorResponse result = service.getSectorById(4L);

        assertThat(result.id()).isEqualTo(4L);
    }

    @Test
    void getSectorById_chauffeurNotAuthorized_throws() {
        Utilisateur current = user(11L, Role.CHAUFFEUR);
        Secteur s = secteur(4L, "Toulouse", entreprise(1L));
        Chauffeur chauffeur = chauffeur(11L, null, null, entreprise(1L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(4L)).thenReturn(Optional.of(s));
        when(chauffeurRepository.findById(11L)).thenReturn(Optional.of(chauffeur));

        assertThatThrownBy(() -> service.getSectorById(4L))
            .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void createSector_success() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Entreprise e = entreprise(5L);
        Secteur s = secteur(9L, "Lille", e);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.existsByNomIgnoreCaseAndEntreprise_Id("Lille", 5L)).thenReturn(false);
        when(entrepriseRepository.findById(5L)).thenReturn(Optional.of(e));
        when(secteurRepository.save(any(Secteur.class))).thenReturn(s);
        when(secteurRepository.findByIdWithRelations(null)).thenReturn(Optional.of(s));

        SectorResponse result = service.createSector(
            new CreateSectorRequest("  Lille  ", "desc", "Nord", "59000", 5L, null));

        assertThat(result.id()).isEqualTo(9L);
        verify(secteurRepository).save(any(Secteur.class));
    }

    @Test
    void createSector_withManager_assignsManager() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Utilisateur superAdmin2 = user(99L, Role.SUPERADMIN);
        Entreprise e = entreprise(5L);
        Secteur s = secteur(9L, "Lille", e);
        Manager manager = manager(3L, null, e);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.existsByNomIgnoreCaseAndEntreprise_Id("Lille", 5L)).thenReturn(false);
        when(entrepriseRepository.findById(5L)).thenReturn(Optional.of(e));
        when(secteurRepository.save(any(Secteur.class))).thenReturn(s);
        when(secteurRepository.findByIdWithRelations(null)).thenReturn(Optional.of(s));
        when(managerRepository.findById(3L)).thenReturn(Optional.of(manager));
        when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of(superAdmin2));

        SectorResponse result = service.createSector(
            new CreateSectorRequest("Lille", "desc", "Nord", "59000", 5L, 3L));

        assertThat(result.id()).isEqualTo(9L);
        assertThat(manager.getSecteur()).isSameAs(s);
        assertThat(manager.getEntreprise()).isSameAs(e);
        verify(managerRepository).save(manager);
        verify(notificationRepository, org.mockito.Mockito.atLeast(2)).save(any(Notification.class));
    }

    @Test
    void createSector_notSuperAdmin_throws() {
        Utilisateur current = user(2L, Role.MANAGER);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);

        assertThatThrownBy(() -> service.createSector(
            new CreateSectorRequest("Lille", "desc", "Nord", "59000", 5L, null)))
            .isInstanceOf(UnauthorizedException.class)
            .hasMessage("Only SuperAdmin can manage sectors");
    }

    @Test
    void createSector_missingEntreprise_throws() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);

        assertThatThrownBy(() -> service.createSector(
            new CreateSectorRequest("Lille", "desc", "Nord", "59000", null, null)))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Entreprise is required");
    }

    @Test
    void createSector_duplicateName_throws() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.existsByNomIgnoreCaseAndEntreprise_Id("Lille", 5L)).thenReturn(true);

        assertThatThrownBy(() -> service.createSector(
            new CreateSectorRequest("Lille", "desc", "Nord", "59000", 5L, null)))
            .isInstanceOf(BadRequestException.class);
    }

    @Test
    void createSector_entrepriseNotFound_throws() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.existsByNomIgnoreCaseAndEntreprise_Id("Lille", 5L)).thenReturn(false);
        when(entrepriseRepository.findById(5L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.createSector(
            new CreateSectorRequest("Lille", "desc", "Nord", "59000", 5L, null)))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateSector_allFieldsChanged() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Entreprise e = entreprise(5L);
        Secteur s = secteur(9L, "Lille", e);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));

        SectorResponse result = service.updateSector(9L,
            new UpdateSectorRequest("  Roubaix  ", "newdesc", "Nord2", "59100", null, null));

        assertThat(result.id()).isEqualTo(9L);
        assertThat(s.getNom()).isEqualTo("Roubaix");
        assertThat(s.getDescription()).isEqualTo("newdesc");
        assertThat(s.getZoneGeographique()).isEqualTo("Nord2");
        assertThat(s.getCodesPostaux()).isEqualTo("59100");
        verify(secteurRepository).save(s);
    }

    @Test
    void updateSector_duplicateName_throws() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Secteur s = secteur(9L, "Lille", entreprise(5L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));
        when(secteurRepository.existsByNomIgnoreCaseAndEntreprise_IdAndIdNot("Roubaix", 5L, 9L)).thenReturn(true);

        assertThatThrownBy(() -> service.updateSector(9L,
            new UpdateSectorRequest("Roubaix", null, null, null, null, null)))
            .isInstanceOf(BadRequestException.class);
    }

    @Test
    void updateSector_enterpriseChanged_detachesUsers() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Entreprise oldE = entreprise(5L);
        Entreprise newE = entreprise(6L);
        Secteur s = secteur(9L, "Lille", oldE);
        Manager manager = manager(3L, s, oldE);
        Chauffeur chauffeur = chauffeur(7L, s, null, oldE);
        s.getManagers().add(manager);
        s.getChauffeurs().add(chauffeur);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));
        when(entrepriseRepository.findById(6L)).thenReturn(Optional.of(newE));
        when(chauffeurRepository.findByManagerIdIn(anyList())).thenReturn(List.of());
        lenient().when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        SectorResponse result = service.updateSector(9L,
            new UpdateSectorRequest(null, null, null, null, 6L, null));

        assertThat(result.id()).isEqualTo(9L);
        assertThat(s.getEntreprise()).isSameAs(newE);
        assertThat(manager.getSecteur()).isNull();
        assertThat(chauffeur.getSecteur()).isNull();
        verify(managerRepository, org.mockito.Mockito.atLeastOnce()).save(manager);
        verify(chauffeurRepository, org.mockito.Mockito.atLeastOnce()).save(chauffeur);
    }

    @Test
    void deleteSector_success() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Secteur s = secteur(9L, "Lille", entreprise(5L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));

        service.deleteSector(9L);

        verify(secteurRepository).delete(s);
    }

    @Test
    void deleteSector_withAssignedUsers_throws() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Secteur s = secteur(9L, "Lille", entreprise(5L));
        s.getManagers().add(manager(3L, s, entreprise(5L)));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));

        assertThatThrownBy(() -> service.deleteSector(9L))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Suppression impossible");
        verify(secteurRepository, never()).delete(any());
    }

    @Test
    void assignManager_newAssignment() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Entreprise e = entreprise(5L);
        Secteur s = secteur(9L, "Lille", e);
        Manager manager = manager(3L, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));
        when(managerRepository.findById(3L)).thenReturn(Optional.of(manager));

        SectorResponse result = service.assignManager(9L, 3L);

        assertThat(result.id()).isEqualTo(9L);
        assertThat(manager.getSecteur()).isSameAs(s);
        assertThat(manager.getEntreprise()).isSameAs(e);
        verify(managerRepository).save(manager);
    }

    @Test
    void assignManager_transferFromAnotherSector() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Entreprise e = entreprise(5L);
        Secteur s = secteur(9L, "Lille", e);
        Secteur other = secteur(2L, "Nantes", e);
        Manager manager = manager(3L, other, e);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));
        when(managerRepository.findById(3L)).thenReturn(Optional.of(manager));

        SectorResponse result = service.assignManager(9L, 3L);

        assertThat(result.id()).isEqualTo(9L);
        assertThat(manager.getSecteur()).isSameAs(s);
        verify(managerRepository).save(manager);
    }

    @Test
    void assignManager_managerNotFound_throws() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Secteur s = secteur(9L, "Lille", entreprise(5L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));
        when(managerRepository.findById(3L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.assignManager(9L, 3L))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void removeManager_inSector_detaches() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Secteur s = secteur(9L, "Lille", entreprise(5L));
        Manager manager = manager(3L, s, entreprise(5L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));
        when(managerRepository.findById(3L)).thenReturn(Optional.of(manager));

        SectorResponse result = service.removeManager(9L, 3L);

        assertThat(result.id()).isEqualTo(9L);
        assertThat(manager.getSecteur()).isNull();
        verify(managerRepository).save(manager);
    }

    @Test
    void removeManager_notInSector_noChange() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Secteur s = secteur(9L, "Lille", entreprise(5L));
        Secteur other = secteur(2L, "Nantes", entreprise(5L));
        Manager manager = manager(3L, other, entreprise(5L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));
        when(managerRepository.findById(3L)).thenReturn(Optional.of(manager));

        service.removeManager(9L, 3L);

        assertThat(manager.getSecteur()).isSameAs(other);
        verify(managerRepository, never()).save(any(Manager.class));
    }

    @Test
    void assignChauffeur_success() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Entreprise e = entreprise(5L);
        Secteur s = secteur(9L, "Lille", e);
        Chauffeur chauffeur = chauffeur(7L, null, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));
        when(chauffeurRepository.findById(7L)).thenReturn(Optional.of(chauffeur));

        SectorResponse result = service.assignChauffeur(9L, 7L);

        assertThat(result.id()).isEqualTo(9L);
        assertThat(chauffeur.getSecteur()).isSameAs(s);
        assertThat(chauffeur.getEntreprise()).isSameAs(e);
        verify(chauffeurRepository).save(chauffeur);
    }

    @Test
    void removeChauffeur_inSector_detaches() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Secteur s = secteur(9L, "Lille", entreprise(5L));
        Chauffeur chauffeur = chauffeur(7L, s, null, entreprise(5L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));
        when(chauffeurRepository.findById(7L)).thenReturn(Optional.of(chauffeur));

        SectorResponse result = service.removeChauffeur(9L, 7L);

        assertThat(result.id()).isEqualTo(9L);
        assertThat(chauffeur.getSecteur()).isNull();
        verify(chauffeurRepository).save(chauffeur);
    }

    @Test
    void removeChauffeur_notInSector_noChange() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Secteur s = secteur(9L, "Lille", entreprise(5L));
        Secteur other = secteur(2L, "Nantes", entreprise(5L));
        Chauffeur chauffeur = chauffeur(7L, other, null, entreprise(5L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));
        when(chauffeurRepository.findById(7L)).thenReturn(Optional.of(chauffeur));

        service.removeChauffeur(9L, 7L);

        assertThat(chauffeur.getSecteur()).isSameAs(other);
        verify(chauffeurRepository, never()).save(any(Chauffeur.class));
    }

    @Test
    void getAccessibleSectors_managerWithEnterprise_noSectors_returnsEmpty() {
        Utilisateur current = user(2L, Role.MANAGER);
        current.setEntreprise(entreprise(5L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByEntrepriseIdWithRelations(5L)).thenReturn(List.of());

        List<SectorResponse> result = service.getAccessibleSectors();

        assertThat(result).isEmpty();
    }

    @Test
    void getAccessibleSectors_unknownRole_returnsEmpty() {
        Utilisateur current = user(2L, Role.SUPERADMIN);
        current.setRole(null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);

        List<SectorResponse> result = service.getAccessibleSectors();

        assertThat(result).isEmpty();
    }

    @Test
    void updateSector_withManagerId_assignsManager() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Entreprise e = entreprise(5L);
        Secteur s = secteur(9L, "Lille", e);
        Manager manager = manager(3L, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));
        when(managerRepository.findById(3L)).thenReturn(Optional.of(manager));

        SectorResponse result = service.updateSector(9L,
            new UpdateSectorRequest(null, null, null, null, null, 3L));

        assertThat(result.id()).isEqualTo(9L);
        assertThat(manager.getSecteur()).isSameAs(s);
        assertThat(manager.getEntreprise()).isSameAs(e);
        verify(managerRepository).save(manager);
    }

    @Test
    void assignChauffeur_fromAnotherSector_success() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Entreprise e = entreprise(5L);
        Secteur s = secteur(9L, "Lille", e);
        Secteur other = secteur(2L, "Nantes", e);
        Chauffeur chauffeur = chauffeur(7L, other, null, entreprise(5L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));
        when(chauffeurRepository.findById(7L)).thenReturn(Optional.of(chauffeur));

        SectorResponse result = service.assignChauffeur(9L, 7L);

        assertThat(result.id()).isEqualTo(9L);
        assertThat(chauffeur.getSecteur()).isSameAs(s);
        verify(chauffeurRepository).save(chauffeur);
    }

    @Test
    void notifySectorUser_nullUser_noNotificationSaved() throws Exception {
        Method m = SecteurServiceImpl.class.getDeclaredMethod("notifySectorUser", Utilisateur.class, String.class);
        m.setAccessible(true);

        m.invoke(service, new Object[]{ null, "message" });

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void notifyUsersSector_recipientWithNullId_skipsNotification() throws Exception {
        Utilisateur u = user(1L, Role.CHAUFFEUR);
        u.setId(null);
        Method m = SecteurServiceImpl.class.getDeclaredMethod("notifyUsersSector", java.util.Collection.class, String.class);
        m.setAccessible(true);

        m.invoke(service, new Object[]{ List.of(u), "message" });

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void notifyUsersSector_duplicateRecipientId_skipsDuplicate() throws Exception {
        Utilisateur u1 = user(7L, Role.CHAUFFEUR);
        Utilisateur u2 = user(7L, Role.CHAUFFEUR);
        Method m = SecteurServiceImpl.class.getDeclaredMethod("notifyUsersSector", java.util.Collection.class, String.class);
        m.setAccessible(true);

        m.invoke(service, new Object[]{ List.of(u1, u2), "message" });

        verify(notificationRepository).save(any(Notification.class));
        verify(notificationRealtimeService).publishToUsers(anyList(), any(Notification.class));
    }

    @Test
    void resolveChauffeurSectorWithRelations_null_returnsNull() throws Exception {
        Method m = SecteurServiceImpl.class.getDeclaredMethod("resolveChauffeurSectorWithRelations", Chauffeur.class);
        m.setAccessible(true);

        Object result = m.invoke(service, new Object[]{ null });

        assertThat(result).isNull();
    }

    @Test
    void getAccessibleSectors_chauffeur_fallbackManagerEnterprise() {
        Utilisateur current = user(12L, Role.CHAUFFEUR);
        Secteur fallback = secteur(6L, "Bordeaux", entreprise(3L));
        Manager manager = manager(7L, null, entreprise(3L));
        Chauffeur chauffeur = chauffeur(12L, null, manager, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(chauffeurRepository.findById(12L)).thenReturn(Optional.of(chauffeur));
        when(secteurRepository.findByEntrepriseIdWithRelations(3L)).thenReturn(List.of(fallback));

        List<SectorResponse> result = service.getAccessibleSectors();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(6L);
    }

    @Test
    void resolveChauffeurSector_null_returnsNull() throws Exception {
        Method m = SecteurServiceImpl.class.getDeclaredMethod("resolveChauffeurSector", Chauffeur.class);
        m.setAccessible(true);

        Object result = m.invoke(service, new Object[]{ null });

        assertThat(result).isNull();
    }

    @Test
    void resolveChauffeurSector_withDirectSecteur_returnsSecteur() throws Exception {
        Secteur s = secteur(9L, "Lille", entreprise(5L));
        Chauffeur chauffeur = chauffeur(7L, s, null, entreprise(5L));
        Method m = SecteurServiceImpl.class.getDeclaredMethod("resolveChauffeurSector", Chauffeur.class);
        m.setAccessible(true);

        Object result = m.invoke(service, new Object[]{ chauffeur });

        assertThat(result).isSameAs(s);
    }

    @Test
    void resolveChauffeurSector_viaManagerSecteur_returnsManagerSecteur() throws Exception {
        Secteur managerSecteur = secteur(2L, "Nantes", entreprise(5L));
        Manager manager = manager(7L, managerSecteur, entreprise(5L));
        Chauffeur chauffeur = chauffeur(8L, null, manager, null);
        Method m = SecteurServiceImpl.class.getDeclaredMethod("resolveChauffeurSector", Chauffeur.class);
        m.setAccessible(true);

        Object result = m.invoke(service, new Object[]{ chauffeur });

        assertThat(result).isSameAs(managerSecteur);
    }

    @Test
    void resolveChauffeurSector_fallbackEnterprise_returnsFirstSecteur() throws Exception {
        Secteur s = secteur(9L, "Lille", entreprise(5L));
        Chauffeur chauffeur = chauffeur(8L, null, null, entreprise(5L));
        when(secteurRepository.findByEntreprise_Id(5L)).thenReturn(List.of(s));
        Method m = SecteurServiceImpl.class.getDeclaredMethod("resolveChauffeurSector", Chauffeur.class);
        m.setAccessible(true);

        Object result = m.invoke(service, new Object[]{ chauffeur });

        assertThat(result).isSameAs(s);
    }

    @Test
    void resolveChauffeurSector_fallbackManagerEnterprise_returnsFirstSecteur() throws Exception {
        Secteur s = secteur(9L, "Lille", entreprise(5L));
        Manager manager = manager(7L, null, entreprise(5L));
        Chauffeur chauffeur = chauffeur(8L, null, manager, null);
        when(secteurRepository.findByEntreprise_Id(5L)).thenReturn(List.of(s));
        Method m = SecteurServiceImpl.class.getDeclaredMethod("resolveChauffeurSector", Chauffeur.class);
        m.setAccessible(true);

        Object result = m.invoke(service, new Object[]{ chauffeur });

        assertThat(result).isSameAs(s);
    }

    @Test
    void resolveChauffeurSector_noEntreprise_returnsNull() throws Exception {
        Chauffeur chauffeur = chauffeur(8L, null, null, null);
        Method m = SecteurServiceImpl.class.getDeclaredMethod("resolveChauffeurSector", Chauffeur.class);
        m.setAccessible(true);

        Object result = m.invoke(service, new Object[]{ chauffeur });

        assertThat(result).isNull();
    }

    @Test
    void resolveChauffeurSector_enterpriseWithoutSectors_returnsNull() throws Exception {
        Chauffeur chauffeur = chauffeur(8L, null, null, entreprise(5L));
        when(secteurRepository.findByEntreprise_Id(5L)).thenReturn(List.of());
        Method m = SecteurServiceImpl.class.getDeclaredMethod("resolveChauffeurSector", Chauffeur.class);
        m.setAccessible(true);

        Object result = m.invoke(service, new Object[]{ chauffeur });

        assertThat(result).isNull();
    }

    @Test
    void getSectorById_superAdmin_withDriversViaManager() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Entreprise e = entreprise(5L);
        Secteur s = secteur(9L, "Lille", e);
        s.getManagers().add(manager(3L, s, e));
        Chauffeur chauffeur = chauffeur(7L, null, null, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));
        when(chauffeurRepository.findByManagerIdIn(anyList())).thenReturn(List.of(chauffeur));

        SectorResponse result = service.getSectorById(9L);

        assertThat(result.id()).isEqualTo(9L);
        assertThat(result.chauffeurs()).hasSize(1);
        assertThat(result.chauffeurs().get(0).id()).isEqualTo(7L);
    }

    @Test
    void secteurLabel_null_returnsDefaultLabel() throws Exception {
        Method m = SecteurServiceImpl.class.getDeclaredMethod("secteurLabel", Secteur.class);
        m.setAccessible(true);

        Object result = m.invoke(service, new Object[]{ null });

        assertThat(result).isEqualTo("Secteur");
    }

    @Test
    void userLabel_null_returnsDefaultLabel() throws Exception {
        Method m = SecteurServiceImpl.class.getDeclaredMethod("userLabel", Utilisateur.class);
        m.setAccessible(true);

        Object result = m.invoke(service, new Object[]{ null });

        assertThat(result).isEqualTo("Utilisateur");
    }

    @Test
    void userLabel_noName_emailSet_returnsEmail() throws Exception {
        Utilisateur u = user(1L, Role.SUPERADMIN);
        u.setPrenom(null);
        u.setNom(null);
        u.setEmail("x@y.fr");
        Method m = SecteurServiceImpl.class.getDeclaredMethod("userLabel", Utilisateur.class);
        m.setAccessible(true);

        Object result = m.invoke(service, new Object[]{ u });

        assertThat(result).isEqualTo("x@y.fr");
    }

    @Test
    void getAccessibleSectors_chauffeur_managerWithNullEnterprise_fallbackFails() {
        Utilisateur current = user(16L, Role.CHAUFFEUR);
        Manager managerNoEnterprise = manager(8L, null, null);
        Chauffeur chauffeur = chauffeur(16L, null, managerNoEnterprise, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(chauffeurRepository.findById(16L)).thenReturn(Optional.of(chauffeur));

        List<SectorResponse> result = service.getAccessibleSectors();

        assertThat(result).isEmpty();
    }

    @Test
    void createSector_trimWhitespace_savesCleanName() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Entreprise e = entreprise(5L);
        Secteur s = secteur(9L, "Lille", e);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.existsByNomIgnoreCaseAndEntreprise_Id("Lille", 5L)).thenReturn(false);
        when(entrepriseRepository.findById(5L)).thenReturn(Optional.of(e));
        when(secteurRepository.save(any(Secteur.class))).thenReturn(s);
        when(secteurRepository.findByIdWithRelations(null)).thenReturn(Optional.of(s));

        service.createSector(new CreateSectorRequest("  Lille  ", "  desc  ", "Nord", "59000", 5L, null));

        verify(secteurRepository).save(any(Secteur.class));
    }

    @Test
    void updateSector_nullFields_keepsOldValues() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Entreprise e = entreprise(5L);
        Secteur s = secteur(9L, "Lille", e);
        s.setDescription("old desc");
        s.setZoneGeographique("old zone");
        s.setCodesPostaux("old codes");
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));

        service.updateSector(9L, new UpdateSectorRequest(null, null, null, null, null, null));

        assertThat(s.getNom()).isEqualTo("Lille");
        assertThat(s.getDescription()).isEqualTo("old desc");
        assertThat(s.getZoneGeographique()).isEqualTo("old zone");
        assertThat(s.getCodesPostaux()).isEqualTo("old codes");
    }

    @Test
    void updateSector_enterpriseNotChanged_noDetach() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Entreprise e = entreprise(5L);
        Secteur s = secteur(9L, "Lille", e);
        Manager manager = manager(3L, s, e);
        s.getManagers().add(manager);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));

        service.updateSector(9L, new UpdateSectorRequest("New Name", null, null, null, 5L, null));

        assertThat(s.getEntreprise()).isSameAs(e);
        assertThat(manager.getSecteur()).isSameAs(s);
        verify(managerRepository, never()).save(manager);
    }

    @Test
    void updateSector_enterpriseChangedWithNoUsers_noNotifications() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Entreprise oldE = entreprise(5L);
        Entreprise newE = entreprise(6L);
        Secteur s = secteur(9L, "Lille", oldE);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));
        when(entrepriseRepository.findById(6L)).thenReturn(Optional.of(newE));

        service.updateSector(9L, new UpdateSectorRequest(null, null, null, null, 6L, null));

        assertThat(s.getEntreprise()).isSameAs(newE);
    }

    @Test
    void deleteSector_withOnlyChauffeurs_throws() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Secteur s = secteur(9L, "Lille", entreprise(5L));
        s.getChauffeurs().add(chauffeur(7L, s, null, entreprise(5L)));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));

        assertThatThrownBy(() -> service.deleteSector(9L))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Suppression impossible");
        verify(secteurRepository, never()).delete(any());
    }

    @Test
    void assignManager_sameManager_noChange() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Entreprise e = entreprise(5L);
        Secteur s = secteur(9L, "Lille", e);
        Manager manager = manager(3L, s, e);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));
        when(managerRepository.findById(3L)).thenReturn(Optional.of(manager));

        service.assignManager(9L, 3L);

        assertThat(manager.getSecteur()).isSameAs(s);
        verify(managerRepository).save(manager);
    }

    @Test
    void assignChauffeur_chauffeurNotFound_throws() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Secteur s = secteur(9L, "Lille", entreprise(5L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));
        when(chauffeurRepository.findById(7L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.assignChauffeur(9L, 7L))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void collectSectorDrivers_withManagerDrivers_includesBoth() throws Exception {
        Entreprise e = entreprise(5L);
        Secteur s = secteur(9L, "Lille", e);
        Manager manager = manager(3L, s, e);
        Chauffeur directDriver = chauffeur(7L, s, null, e);
        directDriver.setId(7L);
        Chauffeur managerDriver = chauffeur(8L, null, manager, e);
        managerDriver.setId(8L);
        s.getManagers().add(manager);
        s.getChauffeurs().add(directDriver);
        when(chauffeurRepository.findByManagerIdIn(List.of(3L))).thenReturn(List.of(managerDriver));

        SectorResponse response = toResponse(s);

        assertThat(response.chauffeurs()).hasSize(2);
        assertThat(response.chauffeurs().stream().map(SectorResponse.SectorDriverInfo::id))
            .containsExactlyInAnyOrder(7L, 8L);
    }

    @Test
    void collectSectorDrivers_duplicateDrivers_onlyOneEntry() throws Exception {
        Entreprise e = entreprise(5L);
        Secteur s = secteur(9L, "Lille", e);
        Manager manager = manager(3L, s, e);
        Chauffeur driver = chauffeur(7L, s, manager, e);
        driver.setId(7L);
        s.getManagers().add(manager);
        s.getChauffeurs().add(driver);
        when(chauffeurRepository.findByManagerIdIn(List.of(3L))).thenReturn(List.of(driver));

        SectorResponse response = toResponse(s);

        assertThat(response.chauffeurs()).hasSize(1);
    }

    @Test
    void secteurLabel_nullSecteur_returnsFallback() throws Exception {
        Method m = SecteurServiceImpl.class.getDeclaredMethod("secteurLabel", Secteur.class);
        m.setAccessible(true);

        String result = (String) m.invoke(service, new Object[]{ null });

        assertThat(result).isEqualTo("Secteur");
    }

    @Test
    void secteurLabel_nullNom_returnsFallback() throws Exception {
        Secteur s = new Secteur();
        s.setNom(null);
        Method m = SecteurServiceImpl.class.getDeclaredMethod("secteurLabel", Secteur.class);
        m.setAccessible(true);

        String result = (String) m.invoke(service, s);

        assertThat(result).isEqualTo("Secteur");
    }

    @Test
    void secteurLabel_blankNom_returnsFallback() throws Exception {
        Secteur s = new Secteur();
        s.setNom("   ");
        Method m = SecteurServiceImpl.class.getDeclaredMethod("secteurLabel", Secteur.class);
        m.setAccessible(true);

        String result = (String) m.invoke(service, s);

        assertThat(result).isEqualTo("Secteur");
    }

    @Test
    void userLabel_nullUser_returnsFallback() throws Exception {
        Method m = SecteurServiceImpl.class.getDeclaredMethod("userLabel", Utilisateur.class);
        m.setAccessible(true);

        String result = (String) m.invoke(service, new Object[]{ null });

        assertThat(result).isEqualTo("Utilisateur");
    }

    @Test
    void userLabel_noName_fallsBackToEmail() throws Exception {
        Utilisateur u = user(1L, Role.CHAUFFEUR);
        u.setPrenom(null);
        u.setNom(null);
        u.setEmail("test@test.com");
        Method m = SecteurServiceImpl.class.getDeclaredMethod("userLabel", Utilisateur.class);
        m.setAccessible(true);

        String result = (String) m.invoke(service, u);

        assertThat(result).isEqualTo("test@test.com");
    }

    @Test
    void userLabel_noNameNoEmail_returnsFallback() throws Exception {
        Utilisateur u = user(1L, Role.CHAUFFEUR);
        u.setPrenom(null);
        u.setNom(null);
        u.setEmail(null);
        Method m = SecteurServiceImpl.class.getDeclaredMethod("userLabel", Utilisateur.class);
        m.setAccessible(true);

        String result = (String) m.invoke(service, u);

        assertThat(result).isEqualTo("Utilisateur");
    }

    // ═══════════════════════════════════════════════════════════════
    // TESTS DE COUVERTURE COMPLÉMENTAIRES — Branches / Lines manquantes
    // ═══════════════════════════════════════════════════════════════

    @Test
    void resolveChauffeurSectorWithRelations_directSecteurNotFound_fallsToManager() throws Exception {
        Utilisateur current = user(20L, Role.CHAUFFEUR);
        Secteur managerSecteur = secteur(10L, "Strasbourg", entreprise(5L));
        Manager mgr = manager(4L, managerSecteur, entreprise(5L));
        Secteur directSecteur = secteur(8L, "Direct", entreprise(5L));
        Chauffeur chauffeur = chauffeur(20L, directSecteur, mgr, entreprise(5L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(chauffeurRepository.findById(20L)).thenReturn(Optional.of(chauffeur));
        when(secteurRepository.findByIdWithRelations(8L)).thenReturn(Optional.empty());
        when(secteurRepository.findByIdWithRelations(10L)).thenReturn(Optional.of(managerSecteur));

        List<SectorResponse> result = service.getAccessibleSectors();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(10L);
    }

    @Test
    void resolveChauffeurSectorWithRelations_managerSecteurNotFound_fallsToEnterprise() throws Exception {
        Utilisateur current = user(21L, Role.CHAUFFEUR);
        Secteur managerSecteur = secteur(11L, "Lyon", entreprise(5L));
        Manager mgr = manager(5L, managerSecteur, entreprise(5L));
        Chauffeur chauffeur = chauffeur(21L, null, mgr, entreprise(5L));
        Secteur fallback = secteur(12L, "Fallback", entreprise(5L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(chauffeurRepository.findById(21L)).thenReturn(Optional.of(chauffeur));
        when(secteurRepository.findByIdWithRelations(11L)).thenReturn(Optional.empty());
        when(secteurRepository.findByEntrepriseIdWithRelations(5L)).thenReturn(List.of(fallback));

        List<SectorResponse> result = service.getAccessibleSectors();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(12L);
    }

    @Test
    void authorizeRead_managerWithNullEnterprise_throws() {
        Utilisateur current = user(2L, Role.MANAGER);
        current.setEntreprise(null);
        Secteur s = secteur(1L, "Paris", entreprise(5L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(1L)).thenReturn(Optional.of(s));

        assertThatThrownBy(() -> service.getSectorById(1L))
            .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void authorizeRead_chauffeurNotFoundInDb_throws() {
        Utilisateur current = user(30L, Role.CHAUFFEUR);
        Secteur s = secteur(1L, "Paris", entreprise(5L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(1L)).thenReturn(Optional.of(s));
        when(chauffeurRepository.findById(30L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getSectorById(1L))
            .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void collectSectorDrivers_driverWithNullId_isSkipped() throws Exception {
        Entreprise e = entreprise(5L);
        Secteur s = secteur(9L, "Lille", e);
        Chauffeur driverNoId = chauffeur(1L, s, null, e);
        driverNoId.setId(null);
        s.getChauffeurs().add(driverNoId);

        SectorResponse response = toResponse(s);

        assertThat(response.chauffeurs()).isEmpty();
    }

    @Test
    void collectSectorDrivers_managerWithNullId_filtered() throws Exception {
        Entreprise e = entreprise(5L);
        Secteur s = secteur(9L, "Lille", e);
        Manager mgrNoId = manager(1L, s, e);
        mgrNoId.setId(null);
        s.getManagers().add(mgrNoId);

        SectorResponse response = toResponse(s);

        assertThat(response.chauffeurs()).isEmpty();
    }

    @Test
    void deleteSector_withManagersAndChauffeurs_throws() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Secteur s = secteur(9L, "Lille", entreprise(5L));
        s.getManagers().add(manager(3L, s, entreprise(5L)));
        s.getChauffeurs().add(chauffeur(7L, s, null, entreprise(5L)));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));

        assertThatThrownBy(() -> service.deleteSector(9L))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Suppression impossible");
    }

    @Test
    void updateSector_enterpriseChangedFromNull_detachesUsers() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Entreprise newE = entreprise(6L);
        Secteur s = secteur(9L, "Lille", null);
        Manager mgr = manager(3L, s, null);
        s.getManagers().add(mgr);
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));
        when(entrepriseRepository.findById(6L)).thenReturn(Optional.of(newE));
        when(chauffeurRepository.findByManagerIdIn(anyList())).thenReturn(List.of());
        lenient().when(utilisateurRepository.findByRole(Role.SUPERADMIN)).thenReturn(List.of());

        service.updateSector(9L, new UpdateSectorRequest(null, null, null, null, 6L, null));

        assertThat(s.getEntreprise()).isSameAs(newE);
    }

    @Test
    void updateSector_targetEntrepriseNotFound_throws() {
        Utilisateur current = user(1L, Role.SUPERADMIN);
        Secteur s = secteur(9L, "Lille", entreprise(5L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));
        when(entrepriseRepository.findById(6L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateSector(9L,
            new UpdateSectorRequest(null, null, null, null, 6L, null)))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Entreprise not found");
    }

    @Test
    void notifyUsersSector_nullRecipients_noNotification() throws Exception {
        Method m = SecteurServiceImpl.class.getDeclaredMethod("notifyUsersSector", java.util.Collection.class, String.class);
        m.setAccessible(true);

        m.invoke(service, new Object[]{ null, "message" });

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void notifyUsersSector_emptyRecipients_noNotification() throws Exception {
        Method m = SecteurServiceImpl.class.getDeclaredMethod("notifyUsersSector", java.util.Collection.class, String.class);
        m.setAccessible(true);

        m.invoke(service, new Object[]{ List.of(), "message" });

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void notifyUsersSector_nullRecipientInList_skipsNull() throws Exception {
        Utilisateur valid = user(5L, Role.MANAGER);
        Method m = SecteurServiceImpl.class.getDeclaredMethod("notifyUsersSector", java.util.Collection.class, String.class);
        m.setAccessible(true);

        m.invoke(service, new Object[]{ java.util.Arrays.asList(null, valid), "message" });

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void resolveChauffeurSectorWithRelations_directSecteurIdNull_fallsToManager() throws Exception {
        Utilisateur current = user(22L, Role.CHAUFFEUR);
        Secteur managerSecteur = secteur(10L, "Strasbourg", entreprise(5L));
        Manager mgr = manager(6L, managerSecteur, entreprise(5L));
        Secteur directSecteur = secteur(8L, "Direct", entreprise(5L));
        directSecteur.setId(null);
        Chauffeur chauffeur = chauffeur(22L, directSecteur, mgr, entreprise(5L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(chauffeurRepository.findById(22L)).thenReturn(Optional.of(chauffeur));
        when(secteurRepository.findByIdWithRelations(10L)).thenReturn(Optional.of(managerSecteur));

        List<SectorResponse> result = service.getAccessibleSectors();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(10L);
    }

    @Test
    void resolveChauffeurSectorWithRelations_managerSecteurIdNull_fallsToEnterprise() throws Exception {
        Utilisateur current = user(23L, Role.CHAUFFEUR);
        Secteur managerSecteur = secteur(11L, "Lyon", entreprise(5L));
        managerSecteur.setId(null);
        Manager mgr = manager(7L, managerSecteur, entreprise(5L));
        Chauffeur chauffeur = chauffeur(23L, null, mgr, entreprise(5L));
        Secteur fallback = secteur(12L, "Fallback", entreprise(5L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(current);
        when(chauffeurRepository.findById(23L)).thenReturn(Optional.of(chauffeur));
        when(secteurRepository.findByEntrepriseIdWithRelations(5L)).thenReturn(List.of(fallback));

        List<SectorResponse> result = service.getAccessibleSectors();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(12L);
    }

    @Test
    void requireSuperAdmin_nullUser_throws() {
        when(authenticatedUserService.getCurrentUser()).thenReturn(null);

        assertThatThrownBy(() -> service.createSector(
            new CreateSectorRequest("Test", "desc", "zone", "00000", 5L, null)))
            .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void userLabel_nullOrEmptyNames_fallsBackToEmail() throws Exception {
        Method m = SecteurServiceImpl.class.getDeclaredMethod("userLabel", Utilisateur.class);
        m.setAccessible(true);

        Utilisateur u1 = user(10L, Role.CHAUFFEUR);
        u1.setPrenom("   ");
        u1.setNom("");
        u1.setEmail("fallback@test.fr");
        assertThat((String) m.invoke(service, u1)).isEqualTo("fallback@test.fr");

        u1.setEmail(null);
        assertThat((String) m.invoke(service, u1)).isEqualTo("Utilisateur");

        assertThat((String) m.invoke(service, (Object) null)).isEqualTo("Utilisateur");
    }

    @Test
    void secteurLabel_nullOrEmptyNom_returnsDefault() throws Exception {
        Method m = SecteurServiceImpl.class.getDeclaredMethod("secteurLabel", Secteur.class);
        m.setAccessible(true);

        assertThat((String) m.invoke(service, (Object) null)).isEqualTo("Secteur");

        Secteur s = new Secteur();
        s.setNom("   ");
        assertThat((String) m.invoke(service, s)).isEqualTo("Secteur");
    }

    @Test
    void authorizeRead_unauthorizedBranches_throws() {
        Secteur s = secteur(9L, "Secteur", entreprise(5L));
        when(secteurRepository.findByIdWithRelations(9L)).thenReturn(Optional.of(s));

        Utilisateur managerOtherComp = user(2L, Role.MANAGER);
        managerOtherComp.setEntreprise(entreprise(10L));
        when(authenticatedUserService.getCurrentUser()).thenReturn(managerOtherComp);
        assertThatThrownBy(() -> service.getSectorById(9L)).isInstanceOf(UnauthorizedException.class);

        Utilisateur chauffeurNoSecteur = user(3L, Role.CHAUFFEUR);
        when(authenticatedUserService.getCurrentUser()).thenReturn(chauffeurNoSecteur);
        when(chauffeurRepository.findById(3L)).thenReturn(Optional.of(chauffeur(3L, null, null, entreprise(5L))));
        assertThatThrownBy(() -> service.getSectorById(9L)).isInstanceOf(UnauthorizedException.class);

        Utilisateur unknownRole = user(4L, null);
        when(authenticatedUserService.getCurrentUser()).thenReturn(unknownRole);
        assertThatThrownBy(() -> service.getSectorById(9L)).isInstanceOf(UnauthorizedException.class);
    }

    @Deprecated
    @Test
    void resolveChauffeurSector_deprecated_branches() throws Exception {
        Method m = SecteurServiceImpl.class.getDeclaredMethod("resolveChauffeurSector", Chauffeur.class);
        m.setAccessible(true);

        assertThat(m.invoke(service, (Object) null)).isNull();

        Chauffeur c = chauffeur(1L, null, null, null);
        assertThat(m.invoke(service, c)).isNull();

        c.setEntreprise(entreprise(5L));
        when(secteurRepository.findByEntreprise_Id(5L)).thenReturn(List.of());
        assertThat(m.invoke(service, c)).isNull();

        Secteur s = secteur(1L, "S", entreprise(5L));
        when(secteurRepository.findByEntreprise_Id(5L)).thenReturn(List.of(s));
        assertThat(m.invoke(service, c)).isEqualTo(s);
    }

    private SectorResponse toResponse(Secteur secteur) throws Exception {
        Method m = SecteurServiceImpl.class.getDeclaredMethod("toResponse", Secteur.class);
        m.setAccessible(true);
        return (SectorResponse) m.invoke(service, secteur);
    }
}

