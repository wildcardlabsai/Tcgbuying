/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useLegal } from '../LegalContext';
import { OPERATOR_NAME, OPERATOR_URL } from '../legalMeta';

/** Small footer for the public buying page: legal links and credit. */
export default function PortalFooter() {
  const openLegal = useLegal();
  const link = 'hover:text-slate-200 underline-offset-2 hover:underline cursor-pointer';
  return (
    <footer className="mt-8 pt-5 border-t border-slate-800 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
      <p>
        Powered by TCGBuyer · Built and founded by{' '}
        <a href={OPERATOR_URL} target="_blank" rel="noopener noreferrer" className={link}>
          {OPERATOR_NAME}
        </a>
      </p>
      <p className="flex items-center gap-4">
        <button type="button" onClick={() => openLegal('about')} className={link}>About</button>
        <button type="button" onClick={() => openLegal('terms')} className={link}>Terms</button>
        <button type="button" onClick={() => openLegal('privacy')} className={link}>Privacy</button>
      </p>
    </footer>
  );
}
