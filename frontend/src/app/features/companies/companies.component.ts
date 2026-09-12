import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './companies.component.html',
  styleUrls: ['./companies.component.css']
})
export class CompaniesComponent {
  companies = [
    { name: 'LogiCorp Express', sector: 'Transport Int.', fleet: 12, drivers: 15 },
    { name: 'TransVite Global', sector: 'Logistique Urbaine', fleet: 8, drivers: 10 },
    { name: 'GeoShip', sector: 'F fret Maritime/Routier', fleet: 25, drivers: 40 },
    { name: 'SwiftTrack', sector: 'Livraison Express', fleet: 5, drivers: 7 }
  ];
}
