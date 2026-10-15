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
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { IS_LOCAL, LOGIN_BYPASS } from '../config';
import { randomId, readJson, sha256, writeJson } from './localStore';
import { Storefront, DEFAULT_PRICING, EMPTY_STOREFRONT, getStorefront, saveStorefront, sanitizeStorefront } from './storefrontService';
import { CurrencyCode } from './currency';
import { LEGAL_VERSION } from '../legalMeta';

export interface DealerProfile {
  id: string;
  name: string;
  slug: string;
  /** Public page customisation; only populated when loading a shop by slug. */
  storefront?: Storefront;
}

/** Answers collected when a dealer signs up. Kept private to the dealer (never on the public profile). */
export interface DealerOnboarding {
  ownerName: string;
  phone: string;
  country: string;
  shopType: 'physical' | 'online' | 'both';
  games: string[];
  monthlyVolume: string;
  currentMethods: string[];
  website: string;
  heardFrom: string;
}

export interface DealerSignUpInput extends DealerOnboarding {
  shopName: string;
  email: string;
  password: string;
}

/** Shop used by the dashboard while login is bypassed. */
export const DEMO_DEALER: DealerProfile = { id: 'demo-dealer', name: 'Demo Card Shop', slug: 'demo-shop' };

/** Whoever is signed in. `dealer` is set only for dealer accounts; everyone else is a collector. */
export interface AuthState {
  uid: string;
  email: string;
  displayName: string;
  dealer: DealerProfile | null;
}

const COUNTRY_CURRENCY: Record<string, CurrencyCode> = { US: 'USD', IE: 'EUR', DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR' };

// ---------- Local mode (browser localStorage) ----------
interface LocalAccount {
  uid: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: 'dealer' | 'customer';
}
interface LocalDealer extends DealerProfile {
  onboarding?: DealerOnboarding;
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
  if (!account) return null;
  const d = readJson<LocalDealer[]>(DEALERS_KEY, []).find((x) => x.id === uid);
  return {
    uid,
    email: account.email,
    displayName: account.displayName,
    dealer: d ? { id: d.id, name: d.name, slug: d.slug } : null,
  };
}

function notifyLocalAuth() {
  localAuthListeners.forEach((fn) => fn());
}

async function localCreateAccount(
  email: string,
  password: string,
  displayName: string,
  role: LocalAccount['role']
): Promise<LocalAccount> {
  const cleanEmail = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) throw authError('auth/invalid-email');
  if (password.length < 6) throw authError('auth/weak-password');
  const accounts = readJson<LocalAccount[]>(ACCOUNTS_KEY, []);
  if (accounts.some((a) => a.email === cleanEmail)) throw authError('auth/email-already-in-use');
  const account: LocalAccount = {
    uid: randomId(),
    email: cleanEmail,
    passwordHash: await sha256(password),
    displayName: displayName.trim().slice(0, 100),
    role,
  };
  if (!writeJson(ACCOUNTS_KEY, [...accounts, account])) throw authError('local/storage-failed');
  return account;
}

async function localSignIn(email: string, password: string): Promise<LocalAccount> {
  const cleanEmail = email.trim().toLowerCase();
  const account = readJson<LocalAccount[]>(ACCOUNTS_KEY, []).find((a) => a.email === cleanEmail);
  if (!account || account.passwordHash !== (await sha256(password))) throw authError('auth/invalid-credential');
  return account;
}

// ---------- Firebase mode ----------
const firebaseRefreshers = new Set<() => void>();

async function loadDealerProfile(uid: string): Promise<DealerProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'dealers', uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return { id: uid, name: d.name, slug: d.slug };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `dealers/${uid}`);
    return null;
  }
}

/** Subscribe to the signed-in user (null when signed out). Returns an unsubscribe function. */
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

  const evaluate = async () => {
    const user = auth.currentUser;
    if (!user) return cb(null);
    cb({
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      dealer: await loadDealerProfile(user.uid),
    });
  };
  firebaseRefreshers.add(evaluate);
  const unsub = onAuthStateChanged(auth, () => void evaluate());
  return () => {
    firebaseRefreshers.delete(evaluate);
    unsub();
  };
}

function refreshFirebaseAuth() {
  firebaseRefreshers.forEach((fn) => fn());
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

export async function getDealerBySlug(slug: string): Promise<DealerProfile | null> {
  if (slug === DEMO_DEALER.slug) return { ...DEMO_DEALER, storefront: await getStorefront(DEMO_DEALER.id) };
  if (IS_LOCAL) {
    const d = readJson<LocalDealer[]>(DEALERS_KEY, []).find((x) => x.slug === slug);
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

// ---------- Dealers (email + password only) ----------
export async function signUpDealer(input: DealerSignUpInput): Promise<DealerProfile> {
  const shopName = input.shopName.trim().slice(0, 100);
  const onboarding: DealerOnboarding = {
    ownerName: input.ownerName.trim().slice(0, 100),
    phone: input.phone.trim().slice(0, 40),
    country: input.country,
    shopType: input.shopType,
    games: input.games.slice(0, 12),
    monthlyVolume: input.monthlyVolume,
    currentMethods: input.currentMethods.slice(0, 12),
    website: input.website.trim().slice(0, 200),
    heardFrom: input.heardFrom,
  };
  const storefront: Storefront = {
    ...EMPTY_STOREFRONT,
    pricing: { ...DEFAULT_PRICING, currency: COUNTRY_CURRENCY[input.country] ?? 'GBP' },
  };

  if (IS_LOCAL) {
    const account = await localCreateAccount(input.email, input.password, shopName, 'dealer');
    const dealer: LocalDealer = {
      id: account.uid,
      name: shopName,
      slug: `${slugify(shopName)}-${account.uid.slice(0, 5)}`,
      onboarding: { ...onboarding, termsVersion: LEGAL_VERSION, termsAcceptedAt: Date.now() } as DealerOnboarding,
    };
    writeJson(DEALERS_KEY, [...readJson<LocalDealer[]>(DEALERS_KEY, []), dealer]);
    await saveStorefront(account.uid, storefront);
    writeJson(SESSION_KEY, account.uid);
    notifyLocalAuth();
    return { id: dealer.id, name: dealer.name, slug: dealer.slug };
  }

  const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
  const uid = cred.user.uid;
  const slug = `${slugify(shopName)}-${uid.slice(0, 5).toLowerCase()}`;
  try {
    await updateProfile(cred.user, { displayName: shopName });
    await setDoc(doc(db, 'dealers', uid), { name: shopName, slug, ownerUid: uid, createdAt: serverTimestamp() });
    await setDoc(doc(db, 'dealers', uid, 'private', 'profile'), {
      ...onboarding,
      email: input.email.trim(),
      termsVersion: LEGAL_VERSION,
      termsAcceptedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    await saveStorefront(uid, storefront);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `dealers/${uid}`);
    throw err;
  }
  refreshFirebaseAuth();
  return { id: uid, name: shopName, slug };
}

export async function signInDealer(email: string, password: string): Promise<DealerProfile> {
  if (IS_LOCAL) {
    const account = await localSignIn(email, password);
    const d = readJson<LocalDealer[]>(DEALERS_KEY, []).find((x) => x.id === account.uid);
    if (!d) throw authError('dealer/not-a-dealer');
    writeJson(SESSION_KEY, account.uid);
    notifyLocalAuth();
    return { id: d.id, name: d.name, slug: d.slug };
  }
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  const dealer = await loadDealerProfile(cred.user.uid);
  if (!dealer) {
    await fbSignOut(auth);
    throw authError('dealer/not-a-dealer');
  }
  refreshFirebaseAuth();
  return dealer;
}

// ---------- Collectors (email + password, or Google) ----------
export async function signUpCustomer(name: string, email: string, password: string): Promise<void> {
  if (IS_LOCAL) {
    const account = await localCreateAccount(email, password, name, 'customer');
    writeJson(SESSION_KEY, account.uid);
    notifyLocalAuth();
    return;
  }
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(cred.user, { displayName: name.trim().slice(0, 100) });
  refreshFirebaseAuth();
}

export async function signInCustomer(email: string, password: string): Promise<void> {
  if (IS_LOCAL) {
    const account = await localSignIn(email, password);
    writeJson(SESSION_KEY, account.uid);
    notifyLocalAuth();
    return;
  }
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signInCustomerWithGoogle(): Promise<void> {
  if (IS_LOCAL) throw authError('local/google-unavailable');
  await signInWithPopup(auth, googleProvider);
}

export function resetPassword(email: string) {
  if (IS_LOCAL) return Promise.reject(authError('local/reset-unavailable'));
  return sendPasswordResetEmail(auth, email.trim());
}

export function signOutUser() {
  if (IS_LOCAL) {
    writeJson(SESSION_KEY, null);
    notifyLocalAuth();
    return Promise.resolve();
  }
  return fbSignOut(auth);
}

/** Turn auth error codes into messages a person can act on. */
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
      return 'Could not save your account details (permission denied). Check the Firestore rules are deployed.';
    case 'dealer/not-a-dealer':
      return 'No dealer account exists for this email. Create a dealer account, or use the collector sign-in if you sell cards.';
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
