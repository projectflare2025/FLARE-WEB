import { Injectable } from '@angular/core';
import { auth, db } from '../app.config';
import { ref, push, set, update, remove, onValue } from 'firebase/database';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FirebaseService {

  private userPath(path = '') {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('User not authenticated');
    return `users/${uid}/${path}`;
  }

  addData(subPath: string, data: any) {
    const p = this.userPath(subPath);
    const newRef = push(ref(db, p));
    return set(newRef, data);
  }

  setData(subPath: string, data: any) {
    const p = this.userPath(subPath);
    return set(ref(db, p), data);
  }

  updateData(subPath: string, data: any) {
    const p = this.userPath(subPath);
    return update(ref(db, p), data);
  }

  deleteData(subPath: string) {
    const p = this.userPath(subPath);
    return remove(ref(db, p));
  }

  getRealtime(subPath: string): Observable<any> {
    return new Observable(observer => {
      const p = this.userPath(subPath);
      const dbRef = ref(db, p);

      const unsub = onValue(
        dbRef,
        snap => observer.next(snap.val()),
        err => observer.error(err)
      );

      return () => unsub();
    });
  }
}
