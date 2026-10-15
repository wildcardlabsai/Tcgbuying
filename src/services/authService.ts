/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { IS_LOCAL, LOGIN_BYPASS } from '../config';
import { randomId, readJson, sha256, writeJson } from './localStore';
import { Storefront, getStorefront, sanitizeStorefront } from './storefrontService';

export interface DealerProfile {
  id: string;
  name: string;
  slug: string;
  /** Public page customisation; only populated when loading a shop by slug. */
  storefront?: Storefront;
}

/** Shop used by the dashboard while login is bypassed. */
export const DEMO_DEALER: DealerProfile = { id: 'demo-dealer', name: 'Demo Card Shop', slug: 'demo-shop' };

export interface AuthState {
  dealer: DealerProfile;
  email: string;
}

// ---------- Local mode (browser localStorage) ----------
interface LocalAccount {
  uid: string;
  email: string;
  passwordHash: string;
}
const ACCOUNTS_KEY = 'tcg_accounts';
const DEALERS_KEY = 'tcg_dealers';
const SESSION_KEY = 'tcg_session';
const localAuthListeners = new Set<() => void>();

function authError(code: string): Error & { code: string } {
  return Object.assign(new Error(code), { code });
}

function localState(): AuthState | null {
  const uid = readJson<string | null>(SESSION_KEY, null);
  if (!uid) return null;
  const account = readJson<LocalAccount[]>(ACCOUNTS_KEY, []).find((a) => a.uid === uid);
  const dealer = readJson<DealerProfile[]>(DEALERS_KEY, []).find((d) => d.id === uid);
  return account && dealer ? { dealer, email: account.email } : null;
}

function notifyLocalAuth() {
  localAuthListeners.forEach((fn) => fn());
}

async function localSignUp(shopName: string, email: string, password: string): Promise<DealerProfile> {
  const cleanEmail = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) throw authError('auth/invalid-email');
  if (password.length < 6) throw authError('auth/weak-password');
  const accounts = readJson<LocalAccount[]>(ACCOUNTS_KEY, []);
  if (accounts.some((a) => a.email === cleanEmail)) throw authError('auth/email-already-in-use');
  const uid = randomId();
  const name = shopName.trim().slice(0, 100);
  const dealer: DealerProfile = { id: uid, name, slug: `${slugify(name)}-${uid.slice(0, 5)}` };
  accounts.push({ uid, email: cleanEmail, passwordHash: await sha256(password) });
  if (
    !writeJson(ACCOUNTS_KEY, accounts) ||
    !writeJson(DEALERS_KEY, [...readJson<DealerProfile[]>(DEALERS_KEY, []), dealer]) ||
    !writeJson(SESSION_KEY, uid)
  ) {
    throw authError('local/storage-failed');
  }
  notifyLocalAuth();
  return dealer;
}

async function localSignIn(email: string, password: string): Promise<DealerProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const account = readJson<LocalAccount[]>(ACCOUNTS_KEY, []).find((a) => a.email === cleanEmail);
  if (!account || account.passwordHash !== (await sha256(password))) throw authError('auth/invalid-credential');
  const dealer = readJson<DealerProfile[]>(DEALERS_KEY, []).find((d) => d.id === account.uid);
  if (!dealer) throw authError('auth/invalid-credential');
  writeJson(SESSION_KEY, account.uid);
  notifyLocalAuth();
  return dealer;
}

/** Subscribe to the signed-in dealer (null when signed out). Returns an unsubscribe function. */
export function subscribeToAuth(cb: (state: AuthState | null) => void): () => void {
  if (IS_LOCAL) {
    const emit = () => cb(localState());
    localAuthListeners.add(emit);
    window.addEventListener('storage', emit);
    emit();
    return () => {
      localAuthListeners.delete(emit);
      window.removeEventListener('storage', emit);
    };
  }
  return onAuthStateChanged(auth, async (user) => {
    if (!user) return cb(null);
    try {
      cb({ dealer: await ensureDealerProfile(user), email: user.email || '' });
    } catch {
      cb(null);
    }
  });
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 36) || 'shop'
  );
}

/** Load the dealer profile for a user, creating it on first sign-in. */
export async function ensureDealerProfile(user: User, shopName?: string): Promise<DealerProfile> {
  const ref = doc(db, 'dealers', user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data();
      return { id: user.uid, name: d.name, slug: d.slug };
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `dealers/${user.uid}`);
    throw err;
  }

  const name = (shopName || user.displayName || user.email?.split('@')[0] || 'My Card Shop').trim().slice(0, 100);
  const slug = `${slugify(name)}-${user.uid.slice(0, 5).toLowerCase()}`;
  try {
    await setDoc(ref, { name, slug, ownerUid: user.uid, createdAt: serverTimestamp() });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `dealers/${user.uid}`);
    throw err;
  }
  return { id: user.uid, name, slug };
}

export async function getDealerBySlug(slug: string): Promise<DealerProfile | null> {
  if (LOGIN_BYPASS && slug === DEMO_DEALER.slug) return { ...DEMO_DEALER, storefront: await getStorefront(DEMO_DEALER.id) };
  if (IS_LOCAL) {
    const d = readJson<DealerProfile[]>(DEALERS_KEY, []).find((x) => x.slug === slug);
    return d ? { id: d.id, name: d.name, slug: d.slug, storefront: await getStorefront(d.id) } : null;
  }
  try {
    const snap = await getDocs(query(collection(db, 'dealers'), where('slug', '==', slug), limit(1)));
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, name: d.data().name, slug: d.data().slug, storefront: sanitizeStorefront(d.data().storefront) };
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'dealers');
    return null;
  }
}

export async function signUpDealer(shopName: string, email: string, password: string): Promise<DealerProfile> {
  if (IS_LOCAL) return localSignUp(shopName, email, password);
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(cred.user, { displayName: shopName.trim() });
  return ensureDealerProfile(cred.user, shopName);
}

export async function signInDealer(email: string, password: string): Promise<DealerProfile> {
  if (IS_LOCAL) return localSignIn(email, password);
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return ensureDealerProfile(cred.user);
}

export async function signInDealerWithGoogle(): Promise<DealerProfile> {
  if (IS_LOCAL) throw authError('local/google-unavailable');
  const cred = await signInWithPopup(auth, googleProvider);
  return ensureDealerProfile(cred.user);
}

export function resetPassword(email: string) {
  if (IS_LOCAL) return Promise.reject(authError('local/reset-unavailable'));
  return sendPasswordResetEmail(auth, email.trim());
}

export function signOutDealer() {
  if (IS_LOCAL) {
    writeJson(SESSION_KEY, null);
    notifyLocalAuth();
    return Promise.resolve();
  }
  return fbSignOut(auth);
}

/** Turn Firebase auth error codes into messages a dealer can act on. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.';
    case 'auth/invalid-email':
      return 'That email address does not look right.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in popup. Allow popups and try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorised for sign-in yet. Add it under Firebase → Authentication → Settings → Authorised domains.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in Firebase yet (Authentication → Sign-in method).';
    case 'permission-denied':
      return 'Could not create your dealer profile (permission denied). Check the Firestore rules are deployed.';
    case 'local/google-unavailable':
      return 'Google sign-in becomes available once the shared database (Firebase) is connected.';
    case 'local/reset-unavailable':
      return 'Password reset becomes available once the shared database (Firebase) is connected.';
    case 'local/storage-failed':
      return 'Could not save your account in this browser (storage full or blocked).';
    default:
      return (err as Error)?.message || 'Something went wrong. Please try again.';
  }
}
