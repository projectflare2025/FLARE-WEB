import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { getDatabase, ref, onChildAdded, update } from '@angular/fire/database';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
})
export class LayoutComponent implements OnInit, OnDestroy {
  stationName: string = '';
  stationDocId: string = '';
  db = getDatabase();
  unsubscribeFn: (() => void) | null = null;

  reports: any[] = []; // Table data
  toasts: any[] = [];  // Non-blocking notifications

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.stationName = sessionStorage.getItem('stationName') ?? '';
    this.stationDocId = sessionStorage.getItem('stationDocId') ?? '';
    this.listenForReports();
  }

  ngOnDestroy() {
    if (this.unsubscribeFn) this.unsubscribeFn();
  }

  /** LISTEN FOR NEW REPORTS */
  listenForReports() {
    const fireReportRef = ref(this.db, 'AllReport/FireReport');

    const listener = onChildAdded(fireReportRef, (snapshot) => {
      const report = snapshot.val();
      const reportId = snapshot.key;

      if (!report) return;
      if (report.fireStationId !== this.stationDocId) return;
      if (report.adminNotif === true) return;

      // Insert immediately into the table
      this.reports.unshift({ id: reportId, ...report });

      // Play sound automatically
      this.playSound();

      // Show non-blocking toast
      this.showToast(report);

      // Mark adminNotif = true
      const reportRef = ref(this.db, `AllReport/FireReport/${reportId}`);
      update(reportRef, { adminNotif: true });
    });

    this.unsubscribeFn = () => listener();
  }

  /** PLAY SOUND */
  playSound() {
    const audio = new Audio('sounds/alert.mp3');
    audio.play();
  }

  /** SHOW NON-BLOCKING TOAST */
  showToast(report: any) {
    const toast = {
      id: Date.now(),
      message: `🔥 New Incident at ${report.exactLocation} - ${report.contact}`,
    };
    this.toasts.push(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== toast.id);
    }, 5000);
  }

  /** DISMISS TOAST */
  dismissToast(toastId: number) {
    this.toasts = this.toasts.filter(t => t.id !== toastId);
  }

  /** LOGOUT */
  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
