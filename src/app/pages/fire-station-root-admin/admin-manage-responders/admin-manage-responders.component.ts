// admin-manage-responders.component.ts
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
  selector: 'app-admin-manage-responders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-manage-responders.component.html',
  styleUrls: ['./admin-manage-responders.component.css'],
})
export class AdminManageRespondersComponent implements AfterViewInit {
  constructor(private firestore: Firestore, private auth: Auth) {
    this.loadStations();
    this.loadResponders();
  }

  // UI state
  showModal = false;
  isEditMode = false;
  isLoading = false;

  showDeleteConfirm = false;
  deleteTarget: any = null;

  // Data lists
  responderList: any[] = [];
  stationList: any[] = [];

  // Form fields
  responderId = ''; // used for edit
  responderName = '';
  email = '';
  contact = '';
  role = '';
  status = 'Active';

  password = '';
  confirmPassword = '';

  selectedStationId = '';
  selectedStationName = '';

  ngAfterViewInit() {}

  /* ---------- Modal control ---------- */
  openAddModal() {
    this.isEditMode = false;
    this.resetForm();
    this.showModal = true;
  }

  openEditModal(responder: any) {
    this.isEditMode = true;
    this.showModal = true;

    // populate form with Firestore fields only (no Auth changes)
    this.responderId = responder.id;
    this.responderName = responder.responderName || '';
    this.email = responder.email || '';
    this.contact = responder.contact || '';
    this.role = responder.role || '';
    this.status = responder.status || 'Active';
    this.selectedStationId = responder.stationId || '';
    this.selectedStationName = responder.stationName || '';
    // do not populate password fields
    this.password = '';
    this.confirmPassword = '';
  }

  closeModal() {
    this.showModal = false;
    this.isEditMode = false;
    this.resetForm();
  }

  resetForm() {
    this.responderId = '';
    this.responderName = '';
    this.email = '';
    this.contact = '';
    this.role = '';
    this.status = 'Active';
    this.password = '';
    this.confirmPassword = '';
    this.selectedStationId = '';
    this.selectedStationName = '';
  }

  setStationName() {
    const s = this.stationList.find(st => st.id === this.selectedStationId);
    this.selectedStationName = s ? s.stationName : '';
  }

  /* ---------- Load from Firestore (real-time) ---------- */
  loadStations() {
    const stationsRef = collection(this.firestore, 'fireStations');
    const q = query(stationsRef, orderBy('createdAt', 'desc'));
    onSnapshot(q, snapshot => {
      this.stationList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    });
  }

  loadResponders() {
    const respondersRef = collection(this.firestore, 'responders');
    const q = query(respondersRef, orderBy('createdAt', 'desc'));
    onSnapshot(q, snapshot => {
      this.responderList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    });
  }

  /* ---------- Create Responder (Auth + Firestore) ---------- */
  async saveResponder() {
    // Validation
    if (!this.responderName.trim() || !this.email.trim() || !this.contact.trim() || !this.role || !this.selectedStationId) {
      alert('Please fill all required fields.');
      return;
    }
    if (!this.password || !this.confirmPassword) {
      alert('Please enter and confirm password.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    if (!confirm('Create this responder?')) return;

    this.isLoading = true;
    try {
      // Create Firebase Auth user for the responder
      const userCred = await createUserWithEmailAndPassword(
        this.auth,
        this.email,
        this.password
      );
      const user = userCred.user;

      // send verification email
      await sendEmailVerification(user, {
        url: 'https://flare-tagum-web-app-51c7a.firebaseapp.com',
        handleCodeInApp: false
      });

      // build responder doc
      const now = new Date();
      const responderData: any = {
        responderName: this.responderName,
        email: this.email,
        contact: this.contact,
        role: this.role,
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

      const respondersRef = collection(this.firestore, 'responders');
      await addDoc(respondersRef, responderData);

      alert('Responder created. Verification email sent.');
      this.closeModal();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Error creating responder.');
    } finally {
      this.isLoading = false;
    }
  }

  /* ---------- Update Responder (Firestore only) ---------- */
  async updateResponder() {
    if (!this.responderId) {
      alert('No responder selected for update.');
      return;
    }

    if (!this.responderName.trim() || !this.email.trim() || !this.contact.trim() || !this.role || !this.selectedStationId) {
      alert('Please fill all required fields.');
      return;
    }

    if (!confirm('Save changes to this responder?')) return;

    this.isLoading = true;
    try {
      const responderDocRef = doc(this.firestore, 'responders', this.responderId);
      const now = new Date();
      const updateData: any = {
        responderName: this.responderName,
        email: this.email,
        contact: this.contact,
        role: this.role,
        stationId: this.selectedStationId,
        stationName: this.selectedStationName,
        status: this.status,
        updatedAt: now,
        updatedTimestamp: now.getTime()
      };

      await updateDoc(responderDocRef, updateData);

      alert('Responder updated (Firestore only). Note: Firebase Auth email/password not changed.');
      this.closeModal();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Error updating responder.');
    } finally {
      this.isLoading = false;
    }
  }

  /* ---------- Delete (Firestore only) ---------- */
  confirmDelete(responder: any) {
    this.deleteTarget = responder;
    this.showDeleteConfirm = true;
  }

  cancelDelete() {
    this.deleteTarget = null;
    this.showDeleteConfirm = false;
  }

  async deleteResponder() {
    if (!this.deleteTarget) {
      this.cancelDelete();
      return;
    }

    if (!confirm(`Permanently delete ${this.deleteTarget.responderName}? This removes Firestore doc only.`)) {
      this.cancelDelete();
      return;
    }

    this.isLoading = true;
    try {
      const responderDocRef = doc(this.firestore, 'responders', this.deleteTarget.id);
      await deleteDoc(responderDocRef);

      alert('Responder deleted from Firestore. Firebase Auth account (if any) is NOT removed.');
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Error deleting responder.');
    } finally {
      this.isLoading = false;
      this.cancelDelete();
    }
  }

  /* ---------- Toggle Status (Firestore only) ---------- */
  async toggleStatus(responder: any) {
    if (!responder?.id) return;
    const newStatus = responder.status === 'Active' ? 'Inactive' : 'Active';
    if (!confirm(`Change status to ${newStatus} for ${responder.responderName}?`)) return;

    this.isLoading = true;
    try {
      const responderDocRef = doc(this.firestore, 'responders', responder.id);
      await updateDoc(responderDocRef, {
        status: newStatus,
        updatedAt: new Date(),
        updatedTimestamp: Date.now()
      });

      // no alert needed, real-time list will update
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Error toggling status.');
    } finally {
      this.isLoading = false;
    }
  }
}
