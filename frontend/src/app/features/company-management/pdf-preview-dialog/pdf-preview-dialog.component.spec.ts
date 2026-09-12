import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PdfPreviewDialogComponent } from './pdf-preview-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

describe('PdfPreviewDialogComponent', () => {
    let component: PdfPreviewDialogComponent;
    let fixture: ComponentFixture<PdfPreviewDialogComponent>;
    const closeSpy = jasmine.createSpy('close');

    beforeEach(async () => {
        closeSpy.calls.reset();

        await TestBed.configureTestingModule({
            imports: [PdfPreviewDialogComponent, MatDialogModule, MatButtonModule],
            providers: [
                { provide: MatDialogRef, useValue: { close: closeSpy } },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: { pdfUrl: 'blob:http://localhost/abc-123', companyName: 'LogiPlus SARL' }
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PdfPreviewDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('bypass la sécurité pour l\u2019URL du PDF', () => {
        expect((component.safePdfUrl as any).changingThisBreaksApplicationSecurity)
            .toBe('blob:http://localhost/abc-123');
    });

    it('affiche le nom de l\u2019entreprise et l\u2019iframe', () => {
        const el: HTMLElement = fixture.nativeElement;
        expect(el.querySelector('h2')!.textContent).toContain('LogiPlus SARL');
        const iframe = el.querySelector('iframe.pdf-frame') as HTMLIFrameElement;
        expect(iframe).toBeTruthy();
    });

    it('retombe sur « Entreprise » sans nom', () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [PdfPreviewDialogComponent, MatDialogModule, MatButtonModule],
            providers: [
                { provide: MatDialogRef, useValue: { close: closeSpy } },
                { provide: MAT_DIALOG_DATA, useValue: { pdfUrl: 'blob:y' } }
            ]
        });
        const f2 = TestBed.createComponent(PdfPreviewDialogComponent);
        f2.detectChanges();
        expect(f2.nativeElement.querySelector('h2')!.textContent).toContain('Entreprise');
    });

    it('Fermer ferme le dialogue', () => {
        (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
        expect(closeSpy).toHaveBeenCalled();
    });
});
