/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Where dealer accounts and submissions live.
 *  - 'local'    (default): in this browser's localStorage. No backend; data does not leave the device.
 *  - 'firebase': Firebase Auth + Firestore. Set VITE_DATA_MODE=firebase at build time.
 */
export const DATA_MODE: 'local' | 'firebase' = import.meta.env.VITE_DATA_MODE === 'firebase' ? 'firebase' : 'local';
export const IS_LOCAL = DATA_MODE === 'local';
