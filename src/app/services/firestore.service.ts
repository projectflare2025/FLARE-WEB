// src/app/services/firestore.service.ts

import { Injectable } from '@angular/core';

import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
} from '@angular/fire/firestore';

// ---------------------
// Interfaces
// ---------------------
export interface AdminData {
  id: string;
  email: string;
}

export interface FireStationData {
  id: string;
  email: string;
  stationName?: string;
  parentStationId?: string;
}

export interface DriverData {
  id: string;
  name: string;
  stationId: string;
  role?: string;
}

// Units with lat/long
export interface UnitData {
  id: string;
  stationId: string;
  unitName?: string;
  name?: string;
  role?: string;
  latitude?: number;
  longitude?: number;
}

export interface ResponderData {
  id: string;
  authUid: string;
  stationId: string;
  role: string;
  responderName?: string;
  email?: string;
  contact?: string;
  status?: string;
}

// ---------------------
// Firestore Service
// ---------------------
@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor(private firestore: Firestore) {}

  async getAdminByEmail(email: string): Promise<AdminData | null> {
    const refCol = collection(this.firestore, 'Admin');
    const qRef = query(refCol, where('email', '==', email));
    const snap = await getDocs(qRef);

    if (snap.empty) return null;

    return {
      id: snap.docs[0].id,
      ...(snap.docs[0].data() as any)
    };
  }

  async getFireStationByEmail(email: string): Promise<FireStationData | null> {
    const refCol = collection(this.firestore, 'fireStations');
    const qRef = query(refCol, where('email', '==', email));
    const snap = await getDocs(qRef);

    if (snap.empty) return null;

    return {
      id: snap.docs[0].id,
      ...(snap.docs[0].data() as any)
    };
  }

  // All fireStations
  async getAllFireStations(): Promise<FireStationData[]> {
    const refCol = collection(this.firestore, 'fireStations');
    const snap = await getDocs(refCol);

    if (snap.empty) return [];

    return snap.docs.map(docSnap => ({
      id: docSnap.id,
      ...(docSnap.data() as any)
    }));
  }

  async getSubStationsByParent(parentStationId: string): Promise<FireStationData[]> {
    const refCol = collection(this.firestore, 'fireStations');
    const qRef = query(refCol, where('parentStationId', '==', parentStationId));
    const snap = await getDocs(qRef);

    if (snap.empty) return [];

    return snap.docs.map(docSnap => ({
      id: docSnap.id,
      ...(docSnap.data() as any)
    }));
  }

  async getInvestigatorsByStation(stationId: string): Promise<ResponderData[]> {
    const respondersRef = collection(this.firestore, 'responders');
    const qRef = query(
      respondersRef,
      where('stationId', '==', stationId),
      where('role', '==', 'Investigator')
    );

    const snap = await getDocs(qRef);

    if (snap.empty) return [];

    const investigators = snap.docs.map(docSnap => ({
      id: docSnap.id,
      ...(docSnap.data() as any)
    })) as ResponderData[];

    console.log('Investigators for stationId', stationId, ':', investigators);
    return investigators;
  }

  async getUnitsByStation(stationId: string): Promise<UnitData[]> {
    const unitsRef = collection(this.firestore, 'units');
    const qRef = query(unitsRef, where('stationId', '==', stationId));
    const snap = await getDocs(qRef);

    if (snap.empty) return [];

    const units = snap.docs.map(docSnap => ({
      ...(docSnap.data() as any),
      id: docSnap.id
    })) as UnitData[];

    console.log('Units for stationId', stationId, ':', units);
    return units;
  }

  // Optional one-shot fetch
  async getUnitById(unitId: string): Promise<UnitData | null> {
    const unitRef = doc(this.firestore, 'units', unitId);
    const snap = await getDoc(unitRef);

    if (!snap.exists()) return null;

    return {
      id: snap.id,
      ...(snap.data() as any)
    } as UnitData;
  }

  // Optional realtime helper (not required for the map now,
  // but you can still use it elsewhere)
  listenToUnitById(
    unitId: string,
    callback: (unit: UnitData | null) => void
  ): () => void {
    const unitRef = doc(this.firestore, 'units', unitId);
    const unsub = onSnapshot(unitRef, (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback({
        id: snap.id,
        ...(snap.data() as any),
      } as UnitData);
    });

    return unsub;
  }
}
