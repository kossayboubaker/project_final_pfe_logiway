import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompanyDialogComponent } from './company-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CompanyDialogComponent', () => {
  let component: CompanyDialogComponent;
  let fixture: ComponentFixture<CompanyDialogComponent>;
  let dialogRefMock: jasmine.SpyObj<MatDialogRef<CompanyDialogComponent>>;
  let data: any;

  const configure = async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: data }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(CompanyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(() => {
    dialogRefMock = jasmine.createSpyObj('MatDialogRef', ['close']);
  });

  describe('empty data (create mode)', () => {
    beforeEach(async () => {
      data = {};
      await configure();
    });

    it('should create with default form', () => {
      expect(component).toBeTruthy();
      expect(component.company.name).toBe('');
      expect(component.company.sector).toBe('Logistique');
      expect(component.currentRole).toBeNull();
      expect(component.imageFileName).toBe('');
      expect(component.legalDocFileName).toBe('');
    });

    it('onCancel closes dialog', () => {
      component.onCancel();
      expect(dialogRefMock.close).toHaveBeenCalledWith();
    });

    it('onSave closes with company', () => {
      component.company.name = 'NewCo';
      component.onSave();
      expect(dialogRefMock.close).toHaveBeenCalledWith(component.company);
    });

    it('onImageSelected with no file returns', () => {
      component.onImageSelected({ target: { files: [] } } as any);
      expect(component.imageFileName).toBe('');
      expect(component.company.image).toBe('');
    });

    it('onLegalDocSelected with no file returns', () => {
      component.onLegalDocSelected({ target: { files: [] } } as any);
      expect(component.legalDocFileName).toBe('');
    });

    it('isImageDataUrl / isPdfDataUrl', () => {
      expect(component.isImageDataUrl('data:image/png;base64,x')).toBeTrue();
      expect(component.isImageDataUrl('data:application/pdf;base64,x')).toBeFalse();
      expect(component.isImageDataUrl(undefined)).toBeFalse();
      expect(component.isPdfDataUrl('data:application/pdf;base64,x')).toBeTrue();
      expect(component.isPdfDataUrl('data:image/png;base64,x')).toBeFalse();
    });
  });

  describe('with existing company (edit mode)', () => {
    beforeEach(async () => {
      data = {
        company: {
          name: 'Trans', email: 'e@e.com', sector: 'Transport', fleetSize: 5,
          status: 'Actif', address: 'T', number: '1', codeTVA: 'V',
          representantLegal: 'data:application/pdf;base64,doc',
          image: 'data:image/png;base64,img', documentJustificatif: 'data:application/pdf;base64,doc', managerOwnerId: 9
        },
        managers: [{ id: 9, name: 'Ali' }],
        currentRole: 'SUPERADMIN'
      };
      await configure();
    });

    it('loads company data and file names', () => {
      expect(component.company.name).toBe('Trans');
      expect(component.currentRole).toBe('SUPERADMIN');
      expect(component.managers).toEqual([{ id: 9, name: 'Ali' }]);
      expect(component.imageFileName).toBe('Fichier déjà chargé');
      expect(component.legalDocFileName).toBe('Fichier déjà chargé');
      expect(component.company.managerOwnerId).toBe(9);
    });

    it('extractFileName returns raw value when not data URI', () => {
      (component as any).imageFileName = '';
      expect((component as any).extractFileName('fichier.pdf')).toBe('fichier.pdf');
      expect((component as any).extractFileName(null)).toBe('');
      expect((component as any).extractFileName(undefined)).toBe('');
    });

    it('onImageSelected reads file and sets image', (done) => {
      const file = new File(['abc'], 'photo.png', { type: 'image/png' });
      const event = { target: { files: [file] } } as any;
      component.onImageSelected(event);
      expect(component.imageFileName).toBe('photo.png');
      setTimeout(() => {
        expect(String(component.company.image)).toContain('data:image/png;base64');
        done();
      }, 50);
    });

    it('onLegalDocSelected reads file and sets documentJustificatif', (done) => {
      const file = new File(['pdf'], 'doc.pdf', { type: 'application/pdf' });
      const event = { target: { files: [file] } } as any;
      component.onLegalDocSelected(event);
      expect(component.legalDocFileName).toBe('doc.pdf');
      setTimeout(() => {
        expect(String(component.company.documentJustificatif)).toContain('data:application/pdf;base64');
        done();
      }, 50);
    });

    it('readAsDataUrl resolves reader result', (done) => {
      const file = new File(['x'], 'x.txt', { type: 'text/plain' });
      (component as any).readAsDataUrl(file).then((content: string) => {
        expect(content).toContain('data:text/plain;base64');
        done();
      });
    });
  });

  describe('non-superadmin role defaults', () => {
    beforeEach(async () => {
      data = { currentRole: 'MANAGER' };
      await configure();
    });

    it('status defaults to En Attente for manager', () => {
      expect(component.company.status).toBe('En Attente');
    });
  });

  describe('readAsDataUrl error path', () => {
    beforeEach(async () => {
      data = {};
      await configure();
    });

    it('rejects on reader error', (done) => {
      const originalCreate = global.FileReader;
      const mockReader: any = {
        onload: null,
        onerror: null,
        readAsDataURL: function (this: any) { (this as any).error = new Error('bad'); this.onerror && this.onerror(); }
      };
      (global as any).FileReader = jest.fn(() => mockReader);
      const file = new File(['x'], 'x.png', { type: 'image/png' });
      (component as any).readAsDataUrl(file).then(
        () => { fail('should reject'); done(); },
        (err: any) => { expect(err).toBeTruthy(); done(); }
      );
      (global as any).FileReader = originalCreate;
    });
  });
});
