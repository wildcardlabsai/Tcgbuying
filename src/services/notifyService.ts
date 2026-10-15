/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { auth } from '../firebase';
import { IS_LOCAL } from '../config';

export type NotifyResult = 'sent' | 'unavailable' | 'not_configured' | 'error';

/** Ask the server to email the collector about the dealer's offer. */
export async function sendOfferEmail(submissionId: string, kind: 'offer' | 'paid' = 'offer'): Promise<NotifyResult> {
  if (IS_LOCAL) return 'unavailable'; // needs a verified dealer session (Firebase)
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return 'error';
    const res = await fetch('/api/notify-offer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ submissionId, kind }),
    });
    if (res.ok) return 'sent';
    return res.status === 503 ? 'not_configured' : 'error';
  } catch {
    return 'error';
  }
}

export async function sendContactMessage(payload: {
  name: string;
  store: string;
  email: string;
  message: string;
}): Promise<NotifyResult> {
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return 'sent';
    return res.status === 503 ? 'not_configured' : 'error';
  } catch {
    return 'error';
  }
}

/** Best-effort confirmation email to the collector after they submit (Firebase mode only). */
export function sendReceivedEmail(dealerId: string, submissionId: string): void {
  if (IS_LOCAL) return;
  fetch('/api/notify-received', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dealerId, submissionId }),
  }).catch(() => {});
}
