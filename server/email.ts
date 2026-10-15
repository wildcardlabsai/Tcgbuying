/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import firebaseConfig from '../firebase-applet-config.json';

// Email is sent through Resend (https://resend.com). Configure in the host environment:
//   RESEND_API_KEY  - API key
//   EMAIL_FROM      - verified sender, e.g. "TCGBuyer <offers@yourdomain.com>"
//   CONTACT_EMAIL   - inbox that receives website contact-form messages
const RESEND_API_KEY = () => process.env.RESEND_API_KEY;
const EMAIL_FROM = () => process.env.EMAIL_FROM;

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

async function sendEmail(opts: { to: string; subject: string; html: string; replyTo?: string }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: EMAIL_FROM(),
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      reply_to: opts.replyTo,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

// Best-effort per-key rate limit (per server instance).
const hits = new Map<string, number[]>();
function rateLimited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
}

const notConfigured = (res: Response) => res.status(503).json({ success: false, error: 'not_configured' });

export const emailRouter = Router();

/** POST /api/contact - website contact form -> CONTACT_EMAIL */
emailRouter.post('/contact', async (req: Request, res: Response) => {
  const to = process.env.CONTACT_EMAIL;
  if (!RESEND_API_KEY() || !EMAIL_FROM() || !to) return notConfigured(res);
  if (rateLimited(`contact:${req.ip}`, 5, 10 * 60_000)) {
    res.status(429).json({ success: false, error: 'rate_limited' });
    return;
  }
  const { name, store, email, message } = req.body || {};
  if (![name, store, email, message].every((v) => typeof v === 'string' && v.trim()) || !/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400).json({ success: false, error: 'invalid' });
    return;
  }
  try {
    await sendEmail({
      to,
      replyTo: email.trim(),
      subject: `TCGBuyer contact: ${String(store).slice(0, 80)}`,
      html: `<p><b>Name:</b> ${esc(String(name).slice(0, 100))}<br><b>Store:</b> ${esc(String(store).slice(0, 100))}<br><b>Email:</b> ${esc(email)}</p><p>${esc(String(message).slice(0, 4000)).replace(/\n/g, '<br>')}</p>`,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('contact email failed', err);
    res.status(502).json({ success: false, error: 'send_failed' });
  }
});

/**
 * POST /api/notify-offer  { submissionId }
 * Authorization: Bearer <Firebase ID token of the dealer>
 * Emails the collector about the dealer's offer. The recipient and amounts are read from the
 * dealer's own Firestore submission using the caller's token, so the endpoint cannot be used
 * to email arbitrary addresses.
 */
emailRouter.post('/notify-offer', async (req: Request, res: Response) => {
  if (!RESEND_API_KEY() || !EMAIL_FROM()) return notConfigured(res);
  const idToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const submissionId = req.body?.submissionId;
  if (!idToken || typeof submissionId !== 'string' || !/^TCG-[A-Z0-9]{8}$/.test(submissionId)) {
    res.status(400).json({ success: false, error: 'invalid' });
    return;
  }

  try {
    // 1. Verify the token and get the dealer uid.
    const lookup = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) }
    );
    const uid = lookup.ok ? (await lookup.json()).users?.[0]?.localId : null;
    if (!uid) {
      res.status(401).json({ success: false, error: 'unauthorized' });
      return;
    }
    if (rateLimited(`offer:${uid}`, 30, 60 * 60_000)) {
      res.status(429).json({ success: false, error: 'rate_limited' });
      return;
    }

    // 2. Read the submission and dealer profile as the dealer (Firestore rules apply).
    const base = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/dealers/${uid}`;
    const headers = { Authorization: `Bearer ${idToken}` };
    const [subRes, dealerRes] = await Promise.all([
      fetch(`${base}/submissions/${submissionId}`, { headers }),
      fetch(base, { headers }),
    ]);
    if (!subRes.ok || !dealerRes.ok) {
      res.status(404).json({ success: false, error: 'not_found' });
      return;
    }
    const f = (await subRes.json()).fields || {};
    const shop = (await dealerRes.json()).fields?.name?.stringValue || 'Your card shop';
    const to = f.customerEmail?.stringValue;
    if (!to || !/^\S+@\S+\.\S+$/.test(to)) {
      res.status(422).json({ success: false, error: 'no_customer_email' });
      return;
    }
    const ref = f.reference?.stringValue || `#${submissionId}`;
    const amount = f.offeredAmount?.stringValue;
    const note = f.dealerOfferNotes?.stringValue;

    await sendEmail({
      to,
      subject: `${shop} has made an offer on your cards (${ref})`,
      html: `<p>Hi ${esc(f.customerName?.stringValue || 'there')},</p>
<p><b>${esc(shop)}</b> has reviewed your submission <b>${esc(ref)}</b>${amount ? ` and offered <b>${esc(amount)}</b>` : ''}.</p>
${note ? `<p>Note from the shop: ${esc(note)}</p>` : ''}
<p>Open the shop's buying portal and enter your reference to accept, counter or decline the offer.</p>`,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('offer email failed', err);
    res.status(502).json({ success: false, error: 'send_failed' });
  }
});
