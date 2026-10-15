/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import firebaseConfig from '../firebase-applet-config.json';

/** Verify a Firebase ID token and return the user's uid, or null if it is missing or invalid. */
export async function verifyIdToken(authorizationHeader: string | undefined): Promise<string | null> {
  const idToken = (authorizationHeader || '').replace(/^Bearer\s+/i, '');
  if (!idToken) return null;
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      signal: AbortSignal.timeout(6000),
    });
    return res.ok ? ((await res.json()).users?.[0]?.localId ?? null) : null;
  } catch {
    return null;
  }
}
