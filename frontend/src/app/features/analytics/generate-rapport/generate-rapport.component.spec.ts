import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GenerateRapportComponent } from './generate-rapport.component';
import { provideRouter } from '@angular/router';
import { ReportService } from '../../../core/services/report.service';
import { ReportMetadata, ReportFormat, ReportDomain } from '../../../models/report.models';
import { of, throwError } from 'rxjs';

describe('GenerateRapportComponent', () => {
  let component: GenerateRapportComponent;
  let fixture: ComponentFixture<GenerateRapportComponent>;
  let reportServiceMock: {
    genererRapport: any;
    listerRapports: any;
    downloadAndSave: any;
    supprimerRapport: any;
    formatFileSize: any;
    formatGenerationTime: any;
  };

  // File d'attente des setTimeout : exécutée manuellement pour couvrir les callbacks
  let pendingTimeouts: Array<() => void>;
  const flushTimeouts = () => {
    const queue = pendingTimeouts;
    pendingTimeouts = [];
    queue.forEach(fn => fn());
  };

  const rapportFixture: ReportMetadata = {
    reportId: 'rpt-001',
    titre: 'Rapport Vehicules',
    format: 'PDF',
    domaine: 'vehicules',
    statut: 'completed',
    userId: 'u1',
    dateCreation: new Date('2026-08-01T10:00:00Z'),
    tailleFichierKo: 2048,
    tempsGenerationMs: 1500
  };

  beforeEach(async () => {
    pendingTimeouts = [];
    spyOn(window, 'setTimeout').and.callFake(((fn: () => void) => {
      pendingTimeouts.push(fn);
      return pendingTimeouts.length as any;
    }) as any);
    // Silencie les logs volontaires du composant ([FRONTEND] ...)
    spyOn(console, 'log').and.stub();
    spyOn(console, 'error').and.stub();

    reportServiceMock = {
      genererRapport: jasmine.createSpy('genererRapport'),
      listerRapports: jasmine.createSpy('listerRapports').and.returnValue(of({ total: 1, rapports: [rapportFixture] })),
      downloadAndSave: jasmine.createSpy('downloadAndSave'),
      supprimerRapport: jasmine.createSpy('supprimerRapport').and.returnValue(of(undefined)),
      formatFileSize: jasmine.createSpy('formatFileSize').and.returnValue('2.00 Mo'),
      formatGenerationTime: jasmine.createSpy('formatGenerationTime').and.returnValue('1.50 s')
    };

    await TestBed.configureTestingModule({
      imports: [GenerateRapportComponent],
      providers: [
        provideRouter([]),
        { provide: ReportService, useValue: reportServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GenerateRapportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => flushTimeouts());

  it('should create with default state and load reports on init', () => {
    expect(component).toBeTruthy();
    expect(component.viewMode).toBe('list');
    expect(component.formatSelectionne).toBe(ReportFormat.PDF);
    expect(component.formats).toEqual(['PDF', 'CSV', 'TXT']);
    expect(component.domaines).toEqual(['', ...Object.values(ReportDomain)]);
    expect(component.exempleRequetes.length).toBe(6);
    expect(component.rapports).toEqual([rapportFixture]);
    expect(component.isLoading).toBeFalse();
    expect(reportServiceMock.listerRapports).toHaveBeenCalledWith('', 50);
  });

  // ─── switchView() / utiliserExemple() ─────────────────────────
  it('switchView("generate") should switch without reloading', () => {
    reportServiceMock.listerRapports.calls.reset();

    component.switchView('generate');

    expect(component.viewMode).toBe('generate');
    expect(reportServiceMock.listerRapports).not.toHaveBeenCalled();
  });

  it('switchView("list") should reload the reports', () => {
    reportServiceMock.listerRapports.calls.reset();

    component.switchView('list');

    expect(component.viewMode).toBe('list');
    expect(reportServiceMock.listerRapports).toHaveBeenCalled();
  });

  it('utiliserExemple() should fill requeteNaturelle', () => {
    component.utiliserExemple('Liste CSV de tous les chauffeurs');
    expect(component.requeteNaturelle).toBe('Liste CSV de tous les chauffeurs');
  });

  // ─── genererRapport() ─────────────────────────────────────────
  it('genererRapport() with empty query should show validation error and skip service call', () => {
    component.requeteNaturelle = '   ';

    component.genererRapport();

    expect(component.messageErreur).toBe('Veuillez saisir une requête');
    expect(reportServiceMock.genererRapport).not.toHaveBeenCalled();
    expect(component.isGenerating).toBeFalse();
  });

  it('genererRapport() on success should schedule download, reload and switch to list view', () => {
    component.requeteNaturelle = 'Rapport PDF des véhicules';
    reportServiceMock.genererRapport.and.returnValue(of({
      success: true,
      reportId: 'rpt-77',
      message: 'Rapport prêt',
      metadata: { titre: 'Véhicules', format: 'PDF' }
    }));

    component.genererRapport();

    // of() est synchrone : la réponse est déjà traitée, seuls les setTimeout restent en attente
    expect(component.isGenerating).toBeFalse();
    expect(component.messageSucces).toContain('Rapport généré avec succès');
    expect(component.messageErreur).toBe('');
    expect(reportServiceMock.downloadAndSave).not.toHaveBeenCalled();

    flushTimeouts();

    expect(reportServiceMock.downloadAndSave).toHaveBeenCalledWith('rpt-77', 'Véhicules_rpt-77.pdf');
    expect(component.isGenerating).toBeFalse();
    expect(component.viewMode).toBe('list');
    expect(component.requeteNaturelle).toBe('');
  });

  it('genererRapport() on success without metadata should skip download only', () => {
    component.requeteNaturelle = 'Statistiques trajets';
    reportServiceMock.genererRapport.and.returnValue(of({
      success: true,
      reportId: 'rpt-78',
      message: 'OK'
    }));

    component.genererRapport();
    flushTimeouts();

    expect(reportServiceMock.downloadAndSave).not.toHaveBeenCalled();
    expect(component.viewMode).toBe('list');
  });

  it('genererRapport() should surface response message when success is false', () => {
    component.requeteNaturelle = 'requête';
    reportServiceMock.genererRapport.and.returnValue(of({
      success: false,
      reportId: '',
      message: 'Domaine non supporté'
    }));

    component.genererRapport();

    expect(component.isGenerating).toBeFalse();
    expect(component.messageErreur).toBe('Domaine non supporté');
    expect(reportServiceMock.downloadAndSave).not.toHaveBeenCalled();
  });

  it('genererRapport() should fall back to default message when response has no message', () => {
    component.requeteNaturelle = 'requête';
    reportServiceMock.genererRapport.and.returnValue(of({
      success: false,
      reportId: '',
      message: ''
    }));

    component.genererRapport();

    expect(component.messageErreur).toBe('Erreur lors de la génération');
  });

  it.each([400, 403, 401])('genererRapport() should map HTTP %i to a dedicated message', status => {
    component.requeteNaturelle = 'requête';
    reportServiceMock.genererRapport.and.returnValue(throwError(() => ({ status })));

    component.genererRapport();

    const expected =
      status === 400 ? 'Requête invalide. Vérifiez votre saisie.' :
      status === 403 ? 'Accès refusé. Vous n\'avez pas les droits nécessaires.' :
        'Session expirée. Veuillez vous reconnecter.';
    expect(component.messageErreur).toBe(expected);
    expect(component.isGenerating).toBeFalse();
  });

  it('genererRapport() should show technical message for unexpected HTTP errors', () => {
    component.requeteNaturelle = 'requête';
    reportServiceMock.genererRapport.and.returnValue(
      throwError(() => ({ status: 500, message: 'Internal Server Error' }))
    );

    component.genererRapport();

    expect(component.messageErreur).toBe('Erreur technique lors de la génération du rapport');
    expect(component.isGenerating).toBeFalse();
  });

  // ─── chargerRapports() / appliquerFiltre() ────────────────────
  it('chargerRapports() should handle list errors gracefully', () => {
    reportServiceMock.listerRapports.and.returnValue(throwError(() => new Error('ko')));

    component.chargerRapports();

    expect(component.isLoading).toBeFalse();
    expect(component.messageErreur).toBe('Erreur lors du chargement des rapports');
  });

  it('appliquerFiltre() should reload with selected domain filter', () => {
    reportServiceMock.listerRapports.calls.reset();
    component.filtreDomaineSelectionne = 'trajets';

    component.appliquerFiltre();

    expect(reportServiceMock.listerRapports).toHaveBeenCalledWith('trajets', 50);
  });

  // ─── telechargerRapport() / supprimerRapport() ────────────────
  it('telechargerRapport() should trigger download and success feedback', () => {
    component.telechargerRapport(rapportFixture);

    expect(reportServiceMock.downloadAndSave).toHaveBeenCalledWith('rpt-001', 'Rapport Vehicules_rpt-001.pdf');
    expect(component.messageSucces).toBe('Téléchargement en cours...');
  });

  it('supprimerRapport() should abort when confirmation is declined', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.supprimerRapport(rapportFixture);

    expect(window.confirm).toHaveBeenCalled();
    expect(reportServiceMock.supprimerRapport).not.toHaveBeenCalled();
  });

  it('supprimerRapport() should delete, refresh and notify on confirmed success', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    reportServiceMock.listerRapports.calls.reset();

    component.supprimerRapport(rapportFixture);

    expect(reportServiceMock.supprimerRapport).toHaveBeenCalledWith('rpt-001');
    expect(component.messageSucces).toBe('Rapport supprimé avec succès');
    expect(reportServiceMock.listerRapports).toHaveBeenCalled();
  });

  it('supprimerRapport() should show error when deletion fails', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    reportServiceMock.supprimerRapport.and.returnValue(throwError(() => new Error('ko')));

    component.supprimerRapport(rapportFixture);

    expect(component.messageErreur).toBe('Erreur lors de la suppression du rapport');
    expect(component.messageSucces).toBe('');
  });

  // ─── helpers de formatage ─────────────────────────────────────
  it('formatFileSize()/formatGenerationTime() should delegate or return "-" for falsy values', () => {
    expect(component.formatFileSize(undefined)).toBe('-');
    expect(component.formatFileSize(0)).toBe('-');
    expect(component.formatFileSize(2048)).toBe('2.00 Mo');
    expect(reportServiceMock.formatFileSize).toHaveBeenCalledWith(2048);

    expect(component.formatGenerationTime(undefined)).toBe('-');
    expect(component.formatGenerationTime(0)).toBe('-');
    expect(component.formatGenerationTime(1500)).toBe('1.50 s');
    expect(reportServiceMock.formatGenerationTime).toHaveBeenCalledWith(1500);
  });

  it('getFormatBadgeClass() should map each format and default', () => {
    expect(component.getFormatBadgeClass('PDF')).toBe('badge-pdf');
    expect(component.getFormatBadgeClass('CSV')).toBe('badge-csv');
    expect(component.getFormatBadgeClass('TXT')).toBe('badge-txt');
    expect(component.getFormatBadgeClass('XLSX')).toBe('badge-default');
  });

  it('getDomaineBadgeClass() should map known domains and default', () => {
    expect(component.getDomaineBadgeClass('vehicules')).toBe('badge-vehicules');
    expect(component.getDomaineBadgeClass('chauffeurs')).toBe('badge-chauffeurs');
    expect(component.getDomaineBadgeClass('trajets')).toBe('badge-trajets');
    expect(component.getDomaineBadgeClass('conges')).toBe('badge-conges');
    expect(component.getDomaineBadgeClass('reclamations')).toBe('badge-reclamations');
    expect(component.getDomaineBadgeClass('managers')).toBe('badge-managers');
    expect(component.getDomaineBadgeClass('global')).toBe('badge-global');
    expect(component.getDomaineBadgeClass('inconnu')).toBe('badge-default');
  });

  it('getFormatIcon() should map each format and default', () => {
    expect(component.getFormatIcon('PDF')).toBe('📄');
    expect(component.getFormatIcon('CSV')).toBe('📊');
    expect(component.getFormatIcon('TXT')).toBe('📝');
    expect(component.getFormatIcon('XML')).toBe('📁');
  });
});
