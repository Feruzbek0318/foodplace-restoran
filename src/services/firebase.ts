import { initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

// Firebase web config is public by design (access is controlled by firestore.rules),
// so it is read from Vite env variables at build time. See .env.example.
const env = import.meta.env;

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const useEmulator = env.VITE_FIREBASE_EMULATOR === 'true';

/** Cloud sync is available only when a Firebase project is configured for this build. */
export const isCloudConfigured = (): boolean => Boolean(config.projectId);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export function getFirebase(): { db: Firestore; auth: Auth } {
  if (!isCloudConfigured()) throw new Error('Firebase sozlanmagan');
  if (!app) {
    app = initializeApp(config);
    db = initializeFirestore(app, {
      // Offline-first: writes are queued in IndexedDB and sent when the connection returns
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      ignoreUndefinedProperties: true,
    });
    auth = getAuth(app);
    if (useEmulator) {
      const host = env.VITE_FIREBASE_EMULATOR_HOST || window.location.hostname;
      connectFirestoreEmulator(db, host, 8080);
      connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    }
  }
  return { db: db!, auth: auth! };
}

/** Every device signs in anonymously; access to a restaurant is granted by knowing its key. */
export async function ensureSignedIn(): Promise<void> {
  const { auth } = getFirebase();
  if (!auth.currentUser) await signInAnonymously(auth);
}
