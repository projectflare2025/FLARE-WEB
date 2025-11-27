import { Injectable } from '@angular/core';
import { getDatabase, ref, onChildAdded, onChildChanged, onChildRemoved } from '@angular/fire/database';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { get, query, orderByKey } from '@angular/fire/database';

@Injectable({
  providedIn: 'root'
})
export class RealtimeDbService {

  db = getDatabase();

  constructor(private firestore: Firestore) {}

  /**
   * Listen to reports filtered by stationId and category
   * @param stationId Fire station ID
   * @param category Report category (FireReport, OtherEmergencyReport, etc.)
   * @param callbacks added/changed/removed callbacks
   * @returns unsubscribe function
   */

  listenToReports(
    stationId: string,
    category: string,
    callbacks: {
      added?: (report: any) => void,
      changed?: (report: any) => void,
      removed?: (reportId: string) => void
    }
  ) {
    const reportsRef = ref(this.db, `AllReport/${category}`);

    // Fetch user profile helper
    const fetchUserProfile = async (userDocId: string) => {
      try {
        const userRef = doc(this.firestore, `users/${userDocId}`);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          return {
            name: userSnap.get('name') || 'Unknown User',
            profile: userSnap.get('profile') || null,
            isActive: userSnap.get('isActive') || false,
            lastSeen: userSnap.get('lastSeen') || 0
          };
        }
      } catch (e) {
        console.error("Failed to fetch user profile", e);
      }
      return { name: 'Unknown User', profile: null, isActive: false, lastSeen: 0 };
    };

    // Listen for new reports
    const addListener = onChildAdded(reportsRef, async (snapshot) => {
      const report = snapshot.val();
      if (report.fireStationId === stationId && callbacks.added) {
        const userProfile = await fetchUserProfile(report.userDocId);
        callbacks.added({ id: snapshot.key, ...report, ...userProfile });
      }
    });

    // Listen for updated reports
    const changeListener = onChildChanged(reportsRef, async (snapshot) => {
      const report = snapshot.val();
      if (report.fireStationId === stationId && callbacks.changed) {
        const userProfile = await fetchUserProfile(report.userDocId);
        callbacks.changed({ id: snapshot.key, ...report, ...userProfile });
      }
    });

    // Listen for removed reports
    const removeListener = onChildRemoved(reportsRef, (snapshot) => {
      if (callbacks.removed) callbacks.removed(snapshot.key!);
    });

    // Return unsubscribe function
    return () => {
      addListener();
      changeListener();
      removeListener();
    };
  }

  /**
   * Listen to messages for a specific report
   * @param messagesRef Firebase Realtime Database reference to /messages
   * @param callback Called for each new message
   */
  listenToMessages(messagesRef: any, callback: (msg: any) => void) {
    return onChildAdded(messagesRef, (snapshot) => {
      const msg = snapshot.val();
      callback({ id: snapshot.key, ...msg });
    });
  }


  /**
   * Fetch initial reports once for a given station and category
   */
  async getInitialReports(stationId: string, category: string): Promise<any[]> {
    const reportsRef = ref(this.db, `AllReport/${category}`);
    const snapshot = await get(reportsRef);

    const reports: any[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnap) => {
        const report = childSnap.val();
        if (report.fireStationId === stationId) {
          reports.push({ id: childSnap.key, ...report });
        }
      });
    }
    return reports;
  }
}
