'use client';

import { ProgressSpinner } from 'primereact/progressspinner';

interface Props {
  /** Taille du spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Centre le spinner sur toute la hauteur disponible */
  fullHeight?: boolean;
}

const SIZES = { sm: '30px', md: '48px', lg: '72px' };

export default function LoadingSpinner({ size = 'md', fullHeight = false }: Props) {
  const s = SIZES[size];
  return (
    <div
      className={[
        'flex items-center justify-center',
        fullHeight ? 'h-full min-h-[200px]' : 'py-10',
      ].join(' ')}
    >
      <ProgressSpinner
        style={{ width: s, height: s }}
        strokeWidth="4"
        animationDuration=".8s"
      />
    </div>
  );
}
