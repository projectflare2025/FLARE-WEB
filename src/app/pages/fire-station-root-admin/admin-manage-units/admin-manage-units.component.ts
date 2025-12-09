// admin-manage-units.component.ts
import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  Auth,
  createUserWithEmailAndPassword,
  sendEmailVerification
} from '@angular/fire/auth';

import {
  Firestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';

@Component({
  selector: 'app-admin-manage-units',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-manage-units.component.html',
  styleUrls: ['./admin-manage-units.component.css'],
})
export class AdminManageUnitsComponent implements AfterViewInit {

  constructor(private firestore: Firestore, private auth: Auth) {
    this.loadStations();
    this.loadUnits();
  }

  // UI state
  showModal = false;
  isEditMode = false;
  isLoading = false;

  showDeleteConfirm = false;
  deleteTarget: any = null;

  // Data
  unitList: any[] = [];
  stationList: any[] = [];

  // Form fields
  unitId = ''; // used for edit
  unitName = '';
  unitEmail = '';
  unitPassword = '';
  unitConfirmPassword = '';
  selectedStationId = '';
  selectedStationName = '';
  status = 'Active';

  ngAfterViewInit() {}

  /* ---------- Modal control ---------- */
  openAddModal() {
    this.isEditMode = false;
    this.resetForm();
    this.showModal = true;
  }

  openEditModal(unit: any) {
    this.isEditMode = true;
    this.showModal = true;

    // populate form from Firestore record (editing Firestore only)
    this.unitId = unit.id || '';
    this.unitName = unit.unitName || '';
    this.unitEmail = unit.email || '';
    this.selectedStationId = unit.stationId || '';
    this.selectedStationName = unit.stationName || '';
    this.status = unit.status || 'Active';

    // clear password fields (we do NOT change Auth here)
    this.unitPassword = '';
    this.unitConfirmPassword = '';
  }

  closeModal() {
    this.showModal = false;
    this.isEditMode = false;
    this.resetForm();
  }

  resetForm() {
    this.unitId = '';
    this.unitName = '';
    this.unitEmail = '';
    this.unitPassword = '';
    this.unitConfirmPassword = '';
    this.selectedStationId = '';
    this.selectedStationName = '';
    this.status = 'Active';
  }

  setStationName() {
    const station = this.stationList.find(s => s.id === this.selectedStationId);
    this.selectedStationName = station ? station.stationName : '';
  }

  /* ---------- Load data (real-time) ---------- */
  loadStations() {
    const stationsRef = collection(this.firestore, 'fireStations');
    const q = query(stationsRef, orderBy('createdAt', 'desc'));
    onSnapshot(q, (snapshot) => {
      this.stationList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    });
  }

  loadUnits() {
    const unitsRef = collection(this.firestore, 'units');
    const q = query(unitsRef, orderBy('createdAt', 'desc'));
    onSnapshot(q, (snapshot) => {
      this.unitList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    });
  }

  /* ---------- Create Unit (Auth + Firestore) ---------- */
  async saveUnit() {
    // VALIDATION
    if (!this.unitName.trim() || !this.unitEmail.trim() || !this.selectedStationId) {
      alert("Please fill in all required fields.");
      return;
    }
    if (!this.unitPassword || !this.unitConfirmPassword) {
      alert("Please enter and confirm password.");
      return;
    }
    if (this.unitPassword !== this.unitConfirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (!confirm("Are you sure you want to add this unit?")) return;

    this.isLoading = true;

    try {
      // CREATE AUTH ACCOUNT
      const userCred = await createUserWithEmailAndPassword(
        this.auth,
        this.unitEmail,
        this.unitPassword
      );
      const user = userCred.user;

      // SEND VERIFICATION EMAIL
      await sendEmailVerification(user, {
        url: 'https://flare-tagum-web-app-51c7a.firebaseapp.com',
        handleCodeInApp: false,
      });

      // DATE / TIME / TIMESTAMP
      const now = new Date();

      // FIRESTORE DATA
      const unitData: any = {
        unitName: this.unitName,
        email: this.unitEmail,
        stationId: this.selectedStationId,
        stationName: this.selectedStationName,
        status: this.status,
        authUid: user.uid,
        emailVerified: user.emailVerified,
        createdAt: now,
        timestamp: now.getTime(),
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString('en-US', { hour12: false })
      };

      const unitsRef = collection(this.firestore, 'units');
      await addDoc(unitsRef, unitData);

      alert("Unit Created! Verification email sent.");
      this.closeModal();
      this.resetForm();

    } catch (error: any) {
      console.error(error);
      alert(error?.message || 'Error creating unit.');
    } finally {
      this.isLoading = false;
    }
  }

  /* ---------- Update Unit (Firestore only) ---------- */
  async updateUnit() {
    if (!this.unitId) {
      alert('No unit selected for update.');
      return;
    }

    if (!this.unitName.trim() || !this.unitEmail.trim() || !this.selectedStationId) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!confirm('Save changes to this unit? (Note: Firebase Auth not changed)')) return;

    this.isLoading = true;
    try {
      const unitDocRef = doc(this.firestore, 'units', this.unitId);
      const now = new Date();
      const updateData: any = {
        unitName: this.unitName,
        email: this.unitEmail, // Firestore email will update but Auth email will NOT change.
        stationId: this.selectedStationId,
        stationName: this.selectedStationName,
        status: this.status,
        updatedAt: now,
        updatedTimestamp: now.getTime()
      };

      await updateDoc(unitDocRef, updateData);

      alert("Unit updated in Firestore. (Firebase Auth remains unchanged.)");
      this.closeModal();
      this.resetForm();
    } catch (error: any) {
      console.error(error);
      alert(error?.message || 'Error updating unit.');
    } finally {
      this.isLoading = false;
    }
  }

  /* ---------- Delete Unit (Firestore only) ---------- */
  confirmDelete(unit: any) {
    this.deleteTarget = unit;
    this.showDeleteConfirm = true;
  }

  cancelDelete() {
    this.deleteTarget = null;
    this.showDeleteConfirm = false;
  }

  async deleteUnit() {
    if (!this.deleteTarget) {
      this.cancelDelete();
      return;
    }

    if (!confirm(`Permanently delete ${this.deleteTarget.unitName}? This removes Firestore doc only.`)) {
      this.cancelDelete();
      return;
    }

    this.isLoading = true;

    try {
      const unitDocRef = doc(this.firestore, 'units', this.deleteTarget.id);
      await deleteDoc(unitDocRef);

      alert('Unit deleted from Firestore. Firebase Auth account (if any) is NOT removed.');
    } catch (error: any) {
      console.error(error);
      alert(error?.message || 'Error deleting unit.');
    } finally {
      this.isLoading = false;
      this.cancelDelete();
    }
  }

  /* ---------- Toggle Status (Firestore only) ---------- */
  async toggleStatus(unit: any) {
    if (!unit?.id) return;
    const newStatus = unit.status === 'Active' ? 'Inactive' : 'Active';
    if (!confirm(`Change status to ${newStatus} for ${unit.unitName}?`)) return;

    this.isLoading = true;
    try {
      const unitDocRef = doc(this.firestore, 'units', unit.id);
      await updateDoc(unitDocRef, {
        status: newStatus,
        updatedAt: new Date(),
        updatedTimestamp: Date.now()
      });
      // Realtime listener will update UI
    } catch (error: any) {
      console.error(error);
      alert(error?.message || 'Error toggling status.');
    } finally {
      this.isLoading = false;
    }
  }
}
