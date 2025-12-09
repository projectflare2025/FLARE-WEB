import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Firestore,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit
} from '@angular/fire/firestore';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {

  // === Summary counters ===
  totalStations = 0;
  totalCentralStations = 0;
  totalSubStations = 0;
  activeStations = 0;

  totalUnits = 0;
  totalResponders = 0;
  totalPublicUsers = 0;

  // === Recent activity lists ===
  recentStations: any[] = [];
  recentUnits: any[] = [];
  recentResponders: any[] = [];

  isLoading = true;

  constructor(private firestore: Firestore) {}

  ngOnInit() {
    this.loadStationSummary();
    this.loadUnitSummary();
    this.loadResponderSummary();
    this.loadPublicUserSummary();

    this.loadRecentStations();
    this.loadRecentUnits();
    this.loadRecentResponders();
  }

  /* ---------- Stations ---------- */
  loadStationSummary() {
    const stationsRef = collection(this.firestore, 'fireStations');
    onSnapshot(stationsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      this.totalStations = data.length;
      this.totalCentralStations = data.filter(s => s.role === 'Central').length;
      this.totalSubStations = data.filter(s => s.role === 'SubStation').length;
      this.activeStations = data.filter(s => s.status === 'Active').length;
      this.isLoading = false;
    });
  }

  loadRecentStations() {
    const stationsRef = collection(this.firestore, 'fireStations');
    const q = query(stationsRef, orderBy('createdAt', 'desc'), limit(5));
    onSnapshot(q, (snapshot) => {
      this.recentStations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));
    });
  }

  /* ---------- Units ---------- */
  loadUnitSummary() {
    const unitsRef = collection(this.firestore, 'units');
    onSnapshot(unitsRef, (snapshot) => {
      this.totalUnits = snapshot.size;
    });
  }

  loadRecentUnits() {
    const unitsRef = collection(this.firestore, 'units');
    const q = query(unitsRef, orderBy('createdAt', 'desc'), limit(5));
    onSnapshot(q, (snapshot) => {
      this.recentUnits = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));
    });
  }

  /* ---------- Responders ---------- */
  loadResponderSummary() {
    const respondersRef = collection(this.firestore, 'responders');
    onSnapshot(respondersRef, (snapshot) => {
      this.totalResponders = snapshot.size;
    });
  }

  loadRecentResponders() {
    const respondersRef = collection(this.firestore, 'responders');
    const q = query(respondersRef, orderBy('createdAt', 'desc'), limit(5));
    onSnapshot(q, (snapshot) => {
      this.recentResponders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));
    });
  }

  /* ---------- Public Users ---------- */
  loadPublicUserSummary() {
    const usersRef = collection(this.firestore, 'users');
    onSnapshot(usersRef, (snapshot) => {
      this.totalPublicUsers = snapshot.size;
    });
  }
}
