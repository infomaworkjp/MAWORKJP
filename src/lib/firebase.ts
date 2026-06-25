import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const getEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || process.env[`NEXT_PUBLIC_${key}`];
  }
  return undefined;
};

export const firebaseConfig = {
  apiKey: getEnv('FIREBASE_API_KEY') || getEnv('NEXT_PUBLIC_FIREBASE_API_KEY') || 'mock-api-key',
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN') || getEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN') || 'mock-auth-domain.firebaseapp.com',
  databaseURL: getEnv('FIREBASE_DATABASE_URL') || getEnv('NEXT_PUBLIC_FIREBASE_DATABASE_URL') || 'https://mock-project-default-rtdb.firebaseio.com',
  projectId: getEnv('FIREBASE_PROJECT_ID') || getEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID') || 'mock-project-id',
  storageBucket: getEnv('FIREBASE_STORAGE_BUCKET') || getEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET') || 'mock-project-id.appspot.com',
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID') || getEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID') || '000000000000',
  appId: getEnv('FIREBASE_APP_ID') || getEnv('NEXT_PUBLIC_FIREBASE_APP_ID') || '1:000000000000:web:0000000000000000000000',
};

export const isMockMode = firebaseConfig.apiKey === 'mock-api-key';

// Initialize Firebase
const app = !isMockMode && getApps().length === 0 ? initializeApp(firebaseConfig) : (getApps().length > 0 ? getApp() : null);

export const auth = app ? getAuth(app) : null;
export const rtdb = app ? getDatabase(app) : null;
export const storage = app ? getStorage(app) : null;

console.log(`[Firebase] Initialized in ${isMockMode ? 'MOCK' : 'REAL'} mode.`);
