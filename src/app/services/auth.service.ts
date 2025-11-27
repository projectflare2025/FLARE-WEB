import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  User,
  sendEmailVerification
} from '@angular/fire/auth';

import { BehaviorSubject } from 'rxjs';
import { FirestoreService } from './firestore.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth = inject(Auth);
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private firestoreService: FirestoreService) {
    this.auth.onAuthStateChanged((user) => {
      this.userSubject.next(user);

      if (user) {
        sessionStorage.setItem('loggedIn', 'true');
        sessionStorage.setItem('email', user.email ?? '');
      } else {
        sessionStorage.clear();
      }
    });
  }

  /** LOGIN */
  async login(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);

      if (!result.user.emailVerified) {
        return { success: false, message: 'Email not verified.' };
      }

      // Check Admin
      const admin = await this.firestoreService.getAdminByEmail(email);
      if (admin) {
        sessionStorage.setItem('accountType', 'admin');
        return { success: true, accountType: 'admin' };
      }

      const station = await this.firestoreService.getFireStationByEmail(email);
    if (station) {
      sessionStorage.setItem('accountType', 'firestation');
      sessionStorage.setItem('stationName', station.stationName ?? '');
      sessionStorage.setItem('stationDocId', station.id);

      console.log("🔥 Saved stationDocId:", station.id);  // <-- ADD THIS

      return { success: true, accountType: 'firestation' };
    }



      return { success: false, message: 'Account not found in Admin or FireStations.' };

    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /** RESEND VERIFICATION EMAIL */
  async resendVerificationEmail() {
    const user = this.auth.currentUser;
    if (!user) return { success: false, message: 'No logged in user.' };

    try {
      await sendEmailVerification(user);
      return { success: true, message: 'Verification email sent!' };
    } catch {
      return { success: false, message: 'Failed to send verification email.' };
    }
  }

  /** SEND VERIFICATION */
  async sendVerificationEmail() {
    const user = this.auth.currentUser;
    if (!user) return { success: false, message: 'No user logged in.' };

    try {
      await sendEmailVerification(user);
      return { success: true, message: 'Verification email sent.' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /** RESET PASSWORD */
  async sendResetLink(email: string) {
    try {
      await sendPasswordResetEmail(this.auth, email);
      return { success: true, message: `Reset link sent to ${email}` };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /** LOGOUT */
  logout() {
    sessionStorage.clear();
    return this.auth.signOut();
  }

  /** CHECK LOGIN */
  isLoggedIn() {
    return sessionStorage.getItem('loggedIn') === 'true';
  }
}
