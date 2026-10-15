/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
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

export interface DealerProfile {
  id: string;
  name: string;
  slug: string;
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
  try {
    const snap = await getDocs(query(collection(db, 'dealers'), where('slug', '==', slug), limit(1)));
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, name: d.data().name, slug: d.data().slug };
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'dealers');
    return null;
  }
}

export async function signUpDealer(shopName: string, email: string, password: string): Promise<DealerProfile> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(cred.user, { displayName: shopName.trim() });
  return ensureDealerProfile(cred.user, shopName);
}

export async function signInDealer(email: string, password: string): Promise<DealerProfile> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return ensureDealerProfile(cred.user);
}

export async function signInDealerWithGoogle(): Promise<DealerProfile> {
  const cred = await signInWithPopup(auth, googleProvider);
  return ensureDealerProfile(cred.user);
}

export function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email.trim());
}

export function signOutDealer() {
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
    default:
      return (err as Error)?.message || 'Something went wrong. Please try again.';
  }
}
