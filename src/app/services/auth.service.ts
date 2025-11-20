import { Injectable } from '@angular/core';
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User
} from 'firebase/auth';

import {
  getDatabase,
  ref,
  query,
  orderByChild,
  equalTo,
  get
} from 'firebase/database';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = getAuth();
  private db = getDatabase();

  // Holds the station name
  stationName: string | null = null;

  // Observable user
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor() {
    // Watch login state from Firebase
    onAuthStateChanged(this.auth, user => {
      this.userSubject.next(user);

      if (user) {
        sessionStorage.setItem('loggedIn', 'true');

        // Save user email instantly
        sessionStorage.setItem('email', user.email ?? '');

        // Fetch the station name for this email
        if (user.email) {
          this.fetchStationNameByEmail(user.email);
        }
      } else {
        sessionStorage.removeItem('loggedIn');
        sessionStorage.removeItem('email');
        sessionStorage.removeItem('stationName');
      }

      console.log('Auth state:', user);
    });
  }

  /** LOGIN */
  async login(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);

      if (!result.user.emailVerified) {
        return {
          success: false,
          message: 'Email not verified. Please check your inbox.'
        };
      }

      // Save login state
      sessionStorage.setItem('loggedIn', 'true');
      sessionStorage.setItem('email', email);

      // Fetch station name
      await this.fetchStationNameByEmail(email);

      return {
        success: true,
        user: result.user
      };

    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  }

  /** FETCH STATION NAME IN REALTIME DATABASE */
  async fetchStationNameByEmail(email: string) {
    const stationRef = query(
      ref(this.db, 'FireStations'),
      orderByChild('email'),
      equalTo(email)
    );

    const snapshot = await get(stationRef);

    if (snapshot.exists()) {
      const data = Object.values(snapshot.val())[0] as any;
      this.stationName = data.stationName ?? null;

      // Save to session storage
      sessionStorage.setItem('stationName', this.stationName ?? '');
    } else {
      this.stationName = null;
      sessionStorage.setItem('stationName', '');
    }
  }

  /** SEND PASSWORD RESET */
  async sendResetLink(email: string) {
    try {
      await sendPasswordResetEmail(this.auth, email);

      return {
        success: true,
        message: `Password reset link sent to ${email}`
      };

    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to send reset link'
      };
    }
  }

  /** LOGOUT */
  async logout() {
    sessionStorage.removeItem('loggedIn');
    sessionStorage.removeItem('email');
    sessionStorage.removeItem('stationName');
    return this.auth.signOut();
  }

  /** CHECK LOGIN */
  isLoggedIn(): boolean {
    return sessionStorage.getItem('loggedIn') === 'true';
  }

  /** CURRENT USER */
  currentUser() {
    return this.auth.currentUser;
  }
}
