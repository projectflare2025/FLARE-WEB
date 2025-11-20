import { Component } from '@angular/core';

@Component({
  selector: 'app-incident-reports',
  standalone: true,                  // ✅ REQUIRED for standalone components
  imports: [],                       // keep empty for now
  templateUrl: './incident-reports.component.html',
  styleUrls: ['./incident-reports.component.css'],   // ✅ must be styleUrls
})
export class IncidentReportsComponent { }
