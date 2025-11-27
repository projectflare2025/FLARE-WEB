import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs
} from '@angular/fire/firestore';

export interface AdminData {
  id: string;
  email: string;
}

export interface FireStationData {
  id: string;
  email: string;
  stationName?: string;   // <-- this fixes your error
}

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor(private firestore: Firestore) {}

  // Fetch Admin by email
  async getAdminByEmail(email: string): Promise<AdminData | null> {
    const ref = collection(this.firestore, 'Admin');
    const q = query(ref, where('email', '==', email));
    const snap = await getDocs(q);

    if (snap.empty) return null;

    return {
      id: snap.docs[0].id,
      ...(snap.docs[0].data() as any)
    };
  }

  // Fetch FireStation by email
  async getFireStationByEmail(email: string): Promise<FireStationData | null> {
    const ref = collection(this.firestore, 'fireStations');
    const q = query(ref, where('email', '==', email));
    const snap = await getDocs(q);

    if (snap.empty) return null;

    return {
      id: snap.docs[0].id,
      ...(snap.docs[0].data() as any)
    };
  }
}
