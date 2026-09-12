import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Clipboard } from '@angular/cdk/clipboard';

interface RapportType {
    id: string;
    titre: string;
    description: string;
    icon: string;
    hasDateRange?: boolean;
    hasMonthYear?: boolean;
}

interface RapportResponse {
    titre: string;
    dateGeneration: string;
    sections: { titre: string; contenu: string }[];
    resumeIA: string;
}

@Component({
    selector: 'app-rapport-generator',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatSnackBarModule
    ],
    templateUrl: './rapport-generator.component.html',
    styleUrls: ['./rapport-generator.component.css']
})
export class RapportGeneratorComponent implements OnInit, OnDestroy {
    
    rapportTypes: RapportType[] = [
        {
            id: 'semaine',
            titre: 'Congés de la Semaine',
            description: 'Affiche les congés approuvés pour la semaine en cours',
            icon: 'calendar_today'
        },
        {
            id: 'conges-periode',
            titre: 'Congés par Période',
            description: 'Rapport détaillé des congés sur une période donnée',
            icon: 'date_range',
            hasDateRange: true
        },
        {
            id: 'absences',
            titre: 'Taux d\'Absence des Chauffeurs',
            description: 'Analyse des taux d\'absence par mois et année',
            icon: 'trending_down',
            hasMonthYear: true
        },
        {
            id: 'reclamations',
            titre: 'Réclamations par Priorité',
            description: 'Résumé des réclamations ouvertes et résolues',
            icon: 'warning'
        },
        {
            id: 'vehicules',
            titre: 'Véhicules par Statut',
            description: 'Rapport complet sur l\'état du parc automobile',
            icon: 'directions_car'
        },
        {
            id: 'trajets',
            titre: 'Trajets par Secteur',
            description: 'Analyse des trajets sur une période donnée',
            icon: 'route',
            hasDateRange: true
        },
        {
            id: 'global',
            titre: 'Rapport Global',
            description: 'Bilan complet de toutes les gestions',
            icon: 'dashboard'
        }
    ];

    selectedRapport: RapportType | null = null;
    rapport: RapportResponse | null = null;
    isLoading = false;
    paramForm: FormGroup;

    private destroy$ = new Subject<void>();

    constructor(
        private http: HttpClient,
        private snackBar: MatSnackBar,
        private fb: FormBuilder,
        private clipboard: Clipboard,
        private route: ActivatedRoute
    ) {
        this.paramForm = this.fb.group({
            debut: ['', Validators.required],
            fin: ['', Validators.required],
            mois: ['', Validators.required],
            annee: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        this.route.queryParamMap
            .pipe(takeUntil(this.destroy$))
            .subscribe(params => {
                const rapportTypeParam = params.get('rapportType');
                if (!rapportTypeParam) {
                    return;
                }

                const rapportId = this.mapRapportTypeToId(rapportTypeParam);
                if (!rapportId) {
                    return;
                }

                const rapportSelectionne = this.rapportTypes.find(type => type.id === rapportId);
                if (!rapportSelectionne) {
                    return;
                }

                this.selectedRapport = rapportSelectionne;
                this.rapport = null;
                this.paramForm.reset();
                this.appliquerParametresParDefaut(rapportSelectionne);
                this.genererRapport();
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    selectRapport(rapportType: RapportType): void {
        this.selectedRapport = rapportType;
        this.rapport = null;
        this.paramForm.reset();
    }

    private mapRapportTypeToId(rapportType: string): string | null {
        const normalise = rapportType.toUpperCase();
        switch (normalise) {
            case 'CONGES':
                return 'semaine';
            case 'VEHICULES':
                return 'vehicules';
            case 'RECLAMATIONS':
                return 'reclamations';
            case 'TRAJETS':
                return 'trajets';
            case 'GLOBAL':
                return 'global';
            default:
                return null;
        }
    }

    private appliquerParametresParDefaut(rapportType: RapportType): void {
        const maintenant = new Date();
        const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
        const finMois = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0);

        if (rapportType.id === 'conges-periode' || rapportType.id === 'trajets') {
            this.paramForm.patchValue({
                debut: debutMois,
                fin: finMois
            });
        }

        if (rapportType.id === 'absences') {
            this.paramForm.patchValue({
                mois: maintenant.getMonth() + 1,
                annee: maintenant.getFullYear()
            });
        }
    }

    genererRapport(): void {
        if (!this.selectedRapport) return;

        this.isLoading = true;
        let url = '/api/rapports';

        switch (this.selectedRapport.id) {
            case 'semaine':
                url += '/conges/semaine';
                break;
            case 'conges-periode':
                const debut = this.paramForm.get('debut')?.value;
                const fin = this.paramForm.get('fin')?.value;
                if (!debut || !fin) {
                    this.snackBar.open('Veuillez sélectionner les dates', 'Fermer', { duration: 3000 });
                    this.isLoading = false;
                    return;
                }
                url += `/conges/periode?debut=${this.formatDate(debut)}&fin=${this.formatDate(fin)}`;
                break;
            case 'absences':
                const mois = this.paramForm.get('mois')?.value;
                const annee = this.paramForm.get('annee')?.value;
                if (!mois || !annee) {
                    this.snackBar.open('Veuillez sélectionner le mois et l\'année', 'Fermer', { duration: 3000 });
                    this.isLoading = false;
                    return;
                }
                url += `/absences?mois=${mois}&annee=${annee}`;
                break;
            case 'reclamations':
                url += '/reclamations';
                break;
            case 'vehicules':
                url += '/vehicules';
                break;
            case 'trajets':
                const debutT = this.paramForm.get('debut')?.value;
                const finT = this.paramForm.get('fin')?.value;
                if (!debutT || !finT) {
                    this.snackBar.open('Veuillez sélectionner les dates', 'Fermer', { duration: 3000 });
                    this.isLoading = false;
                    return;
                }
                url += `/trajets?debut=${this.formatDate(debutT)}&fin=${this.formatDate(finT)}`;
                break;
            case 'global':
                url += '/global';
                break;
        }

        this.http.get<RapportResponse>(url)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.rapport = response;
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Erreur lors de la génération du rapport:', error);
                    this.snackBar.open('Erreur lors de la génération du rapport', 'Fermer', { duration: 3000 });
                    this.isLoading = false;
                }
            });
    }

    actualiserRapport(): void {
        if (this.selectedRapport) {
            this.genererRapport();
        }
    }

    exporterPDF(): void {
        if (!this.rapport) return;

        const element = document.getElementById('rapport-contenu');
        if (!element) {
            this.snackBar.open('Erreur: contenu du rapport non trouvé', 'Fermer', { duration: 3000 });
            return;
        }

        // Utiliser html2canvas et jspdf pour exporter en PDF
        import('html2canvas').then((html2canvas: any) => {
            import('jspdf').then((jsPDF: any) => {
                html2canvas.default(element).then((canvas: HTMLCanvasElement) => {
                    const imgWidth = 210;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    const pdf = new jsPDF.jsPDF('p', 'mm', 'a4');
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    let heightLeft = imgHeight;
                    let position = 0;

                    const imgData = canvas.toDataURL('image/png');
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;

                    while (heightLeft >= 0) {
                        position = heightLeft - imgHeight;
                        pdf.addPage();
                        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                        heightLeft -= pageHeight;
                    }

                    pdf.save(`rapport_${this.rapport?.titre}.pdf`);
                    this.snackBar.open('PDF exporté avec succès', 'Fermer', { duration: 3000 });
                });
            });
        });
    }

    copierResume(): void {
        if (this.rapport && this.rapport.resumeIA) {
            this.clipboard.copy(this.rapport.resumeIA);
            this.snackBar.open('Résumé copié dans le presse-papier', 'Fermer', { duration: 3000 });
        }
    }

    private formatDate(date: Date): string {
        const d = new Date(date);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        return `${year}-${month}-${day}`;
    }

    getResumeGeneration(): string {
        return this.rapport?.dateGeneration ? 
            new Date(this.rapport.dateGeneration).toLocaleString('fr-FR') : '';
    }
}
