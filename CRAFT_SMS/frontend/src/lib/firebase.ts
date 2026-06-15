import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { FirebaseStorage, getStorage } from 'firebase/storage';

// ─── Lazy Initialization ───────────────────────────────────────────────────
// CRITICAL: Do NOT call initializeApp() at module level.
// The Next.js build worker evaluates all imported modules during static
// analysis. If NEXT_PUBLIC_FIREBASE_APP_ID is undefined at that moment,
// Firebase throws: "The 'id' argument must be of type string. Received undefined"
// which crashes the entire build worker process.
//
// Solution: export getter functions that initialize Firebase on first call,
// only when actually executed in a browser/runtime context.

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _storage: FirebaseStorage | null = null;

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;
  if (getApps().length > 0) {
    _app = getApp();
    return _app;
  }
  const config = getFirebaseConfig();
  // Guard: if appId is missing (e.g. during SSR/build), skip initialization.
  if (!config.appId) {
    throw new Error('[Firebase] NEXT_PUBLIC_FIREBASE_APP_ID is not set. Check your .env.local file.');
  }
  _app = initializeApp(config);
  return _app;
}

// These are getter functions — they are NOT called at module load time.
// Each call lazily initializes and caches the Firebase service.
export function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getFirebaseApp());
  return _auth;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (_storage) return _storage;
  _storage = getStorage(getFirebaseApp());
  return _storage;
}

// Convenience re-exports using getters so existing code that does
// `import { auth } from './firebase'` continues to work at runtime.
// These are computed via getter properties, NOT module-level assignments.
export const app = {
  get instance() { return getFirebaseApp(); }
};

// For direct usage: `auth` and `storage` as lazily-evaluated singletons
// wrapped in Proxy so they resolve on first property access at runtime.
const authProxy = new Proxy({} as Auth, {
  get(_target, prop) {
    return (getFirebaseAuth() as any)[prop];
  }
});

const storageProxy = new Proxy({} as FirebaseStorage, {
  get(_target, prop) {
    return (getFirebaseStorage() as any)[prop];
  }
});

export const auth: Auth = authProxy;
export const storage: FirebaseStorage = storageProxy;
