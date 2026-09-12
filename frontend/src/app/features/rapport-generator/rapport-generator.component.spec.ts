import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RapportGeneratorComponent } from './rapport-generator.component';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';
import { Subject, of, throwError } from 'rxjs';

// ─── Mocks des modules dynamiques html2canvas / jspdf ─────────────
jest.mock('html2canvas', () => {
  const defaultFn = jest.fn();
  return { __esModule: true, default: defaultFn };
});

jest.mock('jspdf', () => {
  const jsPDFCtor = jest.fn();
  return { __esModule: true, jsPDF: jsPDFCtor };
});

// Force le chargement des modules mockés et récupère les handles
const html2canvasMock: any = require('html2canvas');
const jspdfMock: any = require('jspdf');

describe('RapportGeneratorComponent', () => {
  let component: RapportGeneratorComponent;
  let fixture: ComponentFixture<RapportGeneratorComponent>;
  let httpGetSpy: any;
  let snackBarOpenSpy: any;
  let clipboardCopySpy: any;

  // Subject pilotant route.queryParamMap : chaque test émet ce qu'il veut
  const queryParamMap$ = new Subject<{ get: (key: string) => string | null }>();

  const emitQueryParam = (value: string | null) =>
    queryParamMap$.next({ get: (key: string) => (key === 'rapportType' ? value : null) });

  const rapportResponseFixture = {
    titre: 'Rapport Véhicules',
    dateGeneration: '2026-08-01T10:30:00Z',
    sections: [{ titre: 'Flotte', contenu: '10 véhicules' }],
    resumeIA: 'Synthèse automatique de la flotte.'
  };

  const makePdfInstance = () => ({
    internal: { pageSize: { getHeight: () => 297 } },
    addImage: jasmine.createSpy('addImage'),
    addPage: jasmine.createSpy('addPage'),
    save: jasmine.createSpy('save')
  });

  beforeEach(async () => {
    httpGetSpy = jasmine.createSpy('http.get').and.returnValue(of(rapportResponseFixture));
    snackBarOpenSpy = jasmine.createSpy('snackBar.open');
    clipboardCopySpy = jasmine.createSpy('clipboard.copy').and.returnValue(true);

    // Réinitialise les mocks des modules dynamiques
    html2canvasMock.default.mockReset();
    jspdfMock.jsPDF.mockReset();

    await TestBed.configureTestingModule({
      imports: [RapportGeneratorComponent],
      providers: [
        provideRouter([]),
        { provide: HttpClient, useValue: { get: httpGetSpy } },
        { provide: Clipboard, useValue: { copy: clipboardCopySpy } },
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParamMap$.asObservable() } }
      ]
    }).compileComponents();

    // NB : MatSnackBar est fourni par MatSnackBarModule importé dans le composant
    // standalone -> l'override doit passer par TestBed.overrideProvider
    TestBed.overrideProvider(MatSnackBar, { useValue: { open: snackBarOpenSpy } });

    fixture = TestBed.createComponent(RapportGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('should create with all report types and an initially invalid form', () => {
    expect(component).toBeTruthy();
    expect(component.rapportTypes.length).toBe(7);
    expect(component.selectedRapport).toBeNull();
    expect(component.rapport).toBeNull();
    expect(component.paramForm.invalid).toBeTrue();
    expect(httpGetSpy).not.toHaveBeenCalled(); // aucune émission de queryParamMap
  });

  // ─── ngOnInit : mapping des query params ──────────────────────
  it('should ignore unknown rapportType values', () => {
    emitQueryParam('INCONNU');

    expect(component.selectedRapport).toBeNull();
    expect(httpGetSpy).not.toHaveBeenCalled();
  });

  it.each([
    ['CONGES', 'semaine', '/api/rapports/conges/semaine'],
    ['VEHICULES', 'vehicules', '/api/rapports/vehicules'],
    ['RECLAMATIONS', 'reclamations', '/api/rapports/reclamations'],
    ['GLOBAL', 'global', '/api/rapports/global']
  ])('should auto-select "%s" and generate report at %s', (param, expectedId, expectedUrl) => {
    emitQueryParam(param);

    expect(component.selectedRapport?.id).toBe(expectedId);
    expect(component.rapport).toEqual(rapportResponseFixture);
    expect(component.isLoading).toBeFalse();
    expect(httpGetSpy).toHaveBeenCalledWith(expectedUrl);
  });

  it('should apply month defaults and generate trajets report from TRAJETS param', () => {
    emitQueryParam('TRAJETS');

    expect(component.selectedRapport?.id).toBe('trajets');
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const debut = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    const fin = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(lastDay)}`;
    expect(httpGetSpy).toHaveBeenCalledWith(`/api/rapports/trajets?debut=${debut}&fin=${fin}`);
  });

  // ─── selectRapport() ─────────────────────────────────────────
  it('selectRapport() should reset current report and form', () => {
    emitQueryParam('CONGES');
    component.paramForm.patchValue({ mois: 3, annee: 2026 });

    component.selectRapport(component.rapportTypes[1]);

    expect(component.selectedRapport?.id).toBe('conges-periode');
    expect(component.rapport).toBeNull();
    expect(component.paramForm.get('mois')?.value).toBeNull();
  });

  // ─── genererRapport() : validation des paramètres ─────────────
  it('genererRapport() should warn when conges-periode dates are missing', () => {
    component.selectRapport(component.rapportTypes[1]); // conges-periode

    component.genererRapport();

    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Veuillez sélectionner les dates',
      'Fermer',
      { duration: 3000 }
    );
    expect(component.isLoading).toBeFalse();
    expect(httpGetSpy).not.toHaveBeenCalled();
  });

  it('genererRapport() should build conges-periode URL with formatted dates', () => {
    component.selectRapport(component.rapportTypes[1]);
    component.paramForm.patchValue({
      debut: new Date(2026, 0, 15),
      fin: new Date(2026, 1, 20)
    });

    component.genererRapport();

    expect(httpGetSpy).toHaveBeenCalledWith(
      '/api/rapports/conges/periode?debut=2026-01-15&fin=2026-02-20'
    );
  });

  it('genererRapport() should warn when absences month/year are missing', () => {
    component.selectRapport(component.rapportTypes[2]); // absences

    component.genererRapport();

    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Veuillez sélectionner le mois et l\'année',
      'Fermer',
      { duration: 3000 }
    );
    expect(httpGetSpy).not.toHaveBeenCalled();
  });

  it('genererRapport() should build absences URL with mois/annee', () => {
    component.selectRapport(component.rapportTypes[2]);
    component.paramForm.patchValue({ mois: 8, annee: 2026 });
    /* seuls mois/annee comptent pour ce rapport (debut/fin restent requis par le form global) */
    expect(component.paramForm.get('mois')?.value).toBe(8);
    expect(component.paramForm.get('annee')?.value).toBe(2026);

    component.genererRapport();

    expect(httpGetSpy).toHaveBeenCalledWith('/api/rapports/absences?mois=8&annee=2026');
  });

  it('genererRapport() should warn when trajets dates are missing', () => {
    component.selectRapport(component.rapportTypes[5]); // trajets

    component.genererRapport();

    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Veuillez sélectionner les dates',
      'Fermer',
      { duration: 3000 }
    );
    expect(httpGetSpy).not.toHaveBeenCalled();
  });

  it('genererRapport() should handle HTTP errors with snackbar feedback', () => {
    httpGetSpy.and.returnValue(throwError(() => ({ status: 500 })));
    emitQueryParam('CONGES');

    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Erreur lors de la génération du rapport',
      'Fermer',
      { duration: 3000 }
    );
    expect(component.isLoading).toBeFalse();
    expect(component.rapport).toBeNull();
  });

  // ─── actualiserRapport() ──────────────────────────────────────
  it('actualiserRapport() should do nothing without selection and regenerate otherwise', () => {
    httpGetSpy.calls.reset();

    component.actualiserRapport();
    expect(httpGetSpy).not.toHaveBeenCalled();

    component.selectedRapport = component.rapportTypes[0];
    component.actualiserRapport();
    expect(httpGetSpy).toHaveBeenCalledWith('/api/rapports/conges/semaine');
  });

  // ─── exporterPDF() ────────────────────────────────────────────
  it('exporterPDF() should return silently when no report is loaded', () => {
    component.exporterPDF();

    expect(snackBarOpenSpy).not.toHaveBeenCalled();
    expect(html2canvasMock.default).not.toHaveBeenCalled();
  });

  it('exporterPDF() should show an error when the report DOM node is missing', () => {
    component.rapport = rapportResponseFixture as any;

    component.exporterPDF();

    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Erreur: contenu du rapport non trouvé',
      'Fermer',
      { duration: 3000 }
    );
  });

  it('exporterPDF() should build a single-page PDF from html2canvas output', async () => {
    const canvas = {
      width: 1000,
      height: 500,
      toDataURL: jasmine.createSpy('toDataURL').and.returnValue('data:image/png;base64,AAA')
    };
    html2canvasMock.default.mockResolvedValue(canvas);
    const pdf = makePdfInstance();
    jspdfMock.jsPDF.mockImplementation(() => pdf);

    component.rapport = rapportResponseFixture as any;
    fixture.detectChanges(); // rend #rapport-contenu dans le DOM

    component.exporterPDF();
    await new Promise(resolve => setTimeout(resolve)); // laisse la chaîne d'imports se résoudre

    expect(html2canvasMock.default).toHaveBeenCalled();
    expect(jspdfMock.jsPDF).toHaveBeenCalledWith('p', 'mm', 'a4');
    expect(pdf.addImage).toHaveBeenCalledTimes(1);
    expect(pdf.addImage).toHaveBeenCalledWith('data:image/png;base64,AAA', 'PNG', 0, 0, 210, 105);
    expect(pdf.addPage).not.toHaveBeenCalled();
    expect(pdf.save).toHaveBeenCalledWith('rapport_Rapport Véhicules.pdf');
    expect(snackBarOpenSpy).toHaveBeenCalledWith('PDF exporté avec succès', 'Fermer', { duration: 3000 });
  });

  it('exporterPDF() should paginate when content exceeds one A4 page', async () => {
    const canvas = { width: 1000, height: 2000, toDataURL: () => 'data:image/png;base64,BBB' };
    html2canvasMock.default.mockResolvedValue(canvas);
    const pdf = makePdfInstance();
    jspdfMock.jsPDF.mockImplementation(() => pdf);

    component.rapport = rapportResponseFixture as any;
    fixture.detectChanges();

    component.exporterPDF();
    await new Promise(resolve => setTimeout(resolve));

    // imgHeight = 420mm > 297mm -> une page supplémentaire est ajoutée
    expect(pdf.addImage).toHaveBeenCalledTimes(2);
    expect(pdf.addPage).toHaveBeenCalledTimes(1);
    /* args = (imgData, 'PNG', x, y, w, h) => la 2e page est dessinée à y = -297 */
    expect(pdf.addImage.calls.mostRecent().args[3]).toBe(-297);
  });

  // ─── copierResume() ───────────────────────────────────────────
  it('copierResume() should copy the AI summary and notify', () => {
    component.rapport = rapportResponseFixture as any;

    component.copierResume();

    expect(clipboardCopySpy).toHaveBeenCalledWith('Synthèse automatique de la flotte.');
    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Résumé copié dans le presse-papier',
      'Fermer',
      { duration: 3000 }
    );
  });

  it('copierResume() should skip empty summaries', () => {
    component.rapport = { ...rapportResponseFixture, resumeIA: '' } as any;

    component.copierResume();

    expect(clipboardCopySpy).not.toHaveBeenCalled();
  });

  // ─── getResumeGeneration() ────────────────────────────────────
  it('getResumeGeneration() should return "" without report or date, else a fr-FR date', () => {
    expect(component.getResumeGeneration()).toBe('');

    component.rapport = { ...rapportResponseFixture, dateGeneration: '' } as any;
    expect(component.getResumeGeneration()).toBe('');

    component.rapport = rapportResponseFixture as any;
    const formatted = component.getResumeGeneration();
    expect(formatted.length).toBeGreaterThan(0);
    expect(formatted).toContain('/');
  });

  // ─── ngOnDestroy ──────────────────────────────────────────────
  it('ngOnDestroy should stop reacting to further query param emissions', () => {
    fixture.destroy();
    httpGetSpy.calls.reset();

    emitQueryParam('GLOBAL');

    expect(httpGetSpy).not.toHaveBeenCalled();
    expect(component.selectedRapport).toBeNull();
  });
});
