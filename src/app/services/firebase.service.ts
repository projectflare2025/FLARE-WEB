import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Database, ref, push, set, update, remove, onValue } from '@angular/fire/database';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FirebaseService {

  constructor(
    private auth: Auth,
    private db: Database
  ) {}

  private userPath(path = '') {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error('User not authenticated');

    return `users/${uid}/${path}`;
  }

  addData(subPath: string, data: any) {
    const fullPath = this.userPath(subPath);
    const newRef = push(ref(this.db, fullPath));
    return set(newRef, data);
  }

  setData(subPath: string, data: any) {
    const fullPath = this.userPath(subPath);
    return set(ref(this.db, fullPath), data);
  }

  updateData(subPath: string, data: any) {
    const fullPath = this.userPath(subPath);
    return update(ref(this.db, fullPath), data);
  }

  deleteData(subPath: string) {
    const fullPath = this.userPath(subPath);
    return remove(ref(this.db, fullPath));
  }

  getRealtime(subPath: string): Observable<any> {
    return new Observable(observer => {
      const fullPath = this.userPath(subPath);
      const dbRef = ref(this.db, fullPath);

      const unsubscribe = onValue(
        dbRef,
        snap => observer.next(snap.val()),
        err => observer.error(err)
      );

      return () => unsubscribe();
    });
  }
}
