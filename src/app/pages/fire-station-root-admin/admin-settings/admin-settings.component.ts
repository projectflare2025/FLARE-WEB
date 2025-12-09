import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  Firestore,
  collection,
  query,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  addDoc
} from '@angular/fire/firestore';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.css'],
})
export class AdminSettingsComponent {

  // Firestore admin doc id
  adminDocId: string | null = null;

  // Bound to UI
  adminName = 'Administrator';
  adminEmail = 'admin@example.com';

  newPassword = '';
  confirmPassword = '';

  darkMode = false;
  alertsEnabled = true;

  constructor(private firestore: Firestore) {
    this.loadAdminProfile();
  }

  /* ---------- Load admin profile from Firestore (Admin collection) ---------- */
  loadAdminProfile() {
    const adminRef = collection(this.firestore, 'Admin'); // collection name: "Admin"
    const q = query(adminRef, limit(1));

    onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // no admin doc yet – keep defaults
        console.warn('No Admin document found yet.');
        return;
      }

      const docSnap = snapshot.docs[0];
      const data: any = docSnap.data();

      this.adminDocId = docSnap.id;
      this.adminName = data.name || 'Administrator';
      this.adminEmail = data.email || 'admin@example.com';
    });
  }

  /* ---------- Save profile to Firestore ---------- */
  async saveProfile() {
    try {
      const adminRef = collection(this.firestore, 'Admin');

      if (this.adminDocId) {
        // update existing admin doc
        const adminDocRef = doc(this.firestore, 'Admin', this.adminDocId);
        await updateDoc(adminDocRef, {
          name: this.adminName,
          email: this.adminEmail,
          updatedAt: new Date()
        });
      } else {
        // no admin doc yet – create one
        const newDocRef = await addDoc(adminRef, {
          name: this.adminName,
          email: this.adminEmail,
          createdAt: new Date()
        });
        this.adminDocId = newDocRef.id;
      }

      alert('Profile updated successfully from Firestore!');
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Error updating admin profile.');
    }
  }

  /* ---------- Password (still local / UI only) ---------- */
  changePassword() {
    if (!this.newPassword || !this.confirmPassword) {
      alert('Please fill in both password fields.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    // Here you could hook into Firebase Auth updatePassword later
    alert('Password updated! (UI only, not Firebase Auth yet)');
  }

  /* ---------- UI toggles ---------- */
  toggleDarkMode() {
    if (this.darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }

  clearLogs() {
    if (confirm('Are you sure you want to clear system logs?')) {
      alert('Logs cleared.');
    }
  }

  resetCounts() {
    if (confirm('Reset dashboard counters?')) {
      alert('Dashboard metrics reset.');
    }
  }
}
