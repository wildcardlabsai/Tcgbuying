/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import LegalModal, { LegalDoc } from './components/LegalModal';

const Ctx = createContext<(doc: LegalDoc) => void>(() => {});

/** Lets any screen open the About / Terms / Privacy popup without leaving the page. */
export function LegalProvider({ children }: { children: ReactNode }) {
  const [doc, setDoc] = useState<LegalDoc | null>(null);
  return (
    <Ctx.Provider value={setDoc}>
      {children}
      <LegalModal doc={doc} onClose={() => setDoc(null)} />
    </Ctx.Provider>
  );
}

export const useLegal = () => useContext(Ctx);
