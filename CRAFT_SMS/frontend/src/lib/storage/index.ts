import { FirebaseStorageProvider } from './FirebaseStorageProvider';

// Lazy singleton — only created when first accessed, not at module load time.
// This prevents Firebase from being initialized during the Next.js build worker's
// static analysis phase (where env vars may not be available).
let _storageProvider: FirebaseStorageProvider | null = null;

export function getStorageProvider(): FirebaseStorageProvider {
  if (!_storageProvider) {
    _storageProvider = new FirebaseStorageProvider();
  }
  return _storageProvider;
}

// Keep backward-compatible named export as a Proxy so existing imports
// of `storageProvider` continue to work without code changes.
export const storageProvider = new Proxy({} as FirebaseStorageProvider, {
  get(_target, prop) {
    return (getStorageProvider() as any)[prop];
  }
});
