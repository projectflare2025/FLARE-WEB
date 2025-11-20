// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

import { environment } from '../environments/environment';

// ----------------------------------------
// FIREBASE INITIALIZATION
// ----------------------------------------
const firebaseApp = initializeApp(environment.firebase);

export const auth = getAuth(firebaseApp);
export const db = getDatabase(firebaseApp);

// ----------------------------------------
// ANGULAR PROVIDERS
// ----------------------------------------
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
  ]
};
