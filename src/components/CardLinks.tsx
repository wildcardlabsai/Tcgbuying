/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExternalLink } from 'lucide-react';

interface CardLinksProps {
  card: { name: string; tcgplayerUrl?: string; cardmarketUrl?: string; sourceUrl?: string };
  className?: string;
}

/** Links so people can open the matched card on TCGplayer (and others) and check it is the same card. */
export default function CardLinks({ card, className = '' }: CardLinksProps) {
  const links = [
    { label: 'TCGplayer', url: card.tcgplayerUrl },
    { label: 'Cardmarket', url: card.cardmarketUrl },
    { label: 'Card details', url: card.sourceUrl },
  ].filter((l): l is { label: string; url: string } => Boolean(l.url));
  if (links.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-x-3 gap-y-0.5 mt-1 ${className}`}>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-400 hover:text-blue-300 underline-offset-2 hover:underline"
          aria-label={`View ${card.name} on ${l.label} (opens in a new tab)`}
        >
          {l.label}
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      ))}
    </div>
  );
}
