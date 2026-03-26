'use client';

import { Skeleton } from 'primereact/skeleton';

interface Props {
  /** Nombre de lignes skeleton à afficher */
  rows?: number;
  /** Hauteur de chaque ligne */
  rowHeight?: string;
}

export default function SkeletonLoader({ rows = 5, rowHeight = '2.5rem' }: Props) {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={rowHeight} borderRadius="6px" />
      ))}
    </div>
  );
}
