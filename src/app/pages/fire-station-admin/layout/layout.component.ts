import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
})
export class LayoutComponent {
  stationName: string = '';
  constructor(private auth: AuthService, private router: Router) {}

    ngOnInit() {
    this.stationName = sessionStorage.getItem('stationName') ?? '';
  }

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
