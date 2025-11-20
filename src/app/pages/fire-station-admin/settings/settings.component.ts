import { Component } from '@angular/core';

@Component({
  selector: 'app-settings',
  standalone: true,                       // ✅ required for standalone component
  imports: [],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'], // ✅ must be styleUrls
})
export class SettingsComponent { }
