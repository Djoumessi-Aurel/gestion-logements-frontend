'use client';

import { ReactNode } from 'react';
import { DataTable, DataTableProps } from 'primereact/datatable';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

// ─── Types ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

interface Props<T extends AnyRecord> extends Omit<DataTableProps<T[]>, 'value' | 'loading'> {
  /** Données à afficher. `null` = chargement ou erreur en cours. */
  data: T[] | null;
  /** Affiche le spinner de chargement */
  loading: boolean;
  /** Message d'erreur API à afficher si le chargement a échoué */
  error?: string | null;
  /** Callback pour réessayer le chargement */
  onRetry?: () => void;
  /** Message quand la liste est vide (défaut : "Aucune donnée") */
  emptyMessage?: string;
  /** Colonnes définies via <Column> PrimeReact */
  children: ReactNode;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function DataTableWrapper<T extends AnyRecord>({
  data,
  loading,
  error,
  onRetry,
  emptyMessage = 'Aucune donnée à afficher.',
  children,
  ...tableProps
}: Props<T>) {
  // ── État chargement ────────────────────────────────────────────────────────
  if (loading) {
    return <LoadingSpinner />;
  }

  // ── État erreur ────────────────────────────────────────────────────────────
  if (error) {
    return <ErrorMessage message={error} onRetry={onRetry} />;
  }

  // ── Données disponibles (liste potentiellement vide) ───────────────────────
  return (
    <DataTable<T[]>
      value={data ?? []}
      emptyMessage={emptyMessage}
      paginator
      rows={10}
      rowsPerPageOptions={[10, 25, 50]}
      filterDisplay="row"
      removableSort
      stripedRows
      showGridlines
      tableStyle={{ minWidth: '40rem' }}
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      currentPageReportTemplate="{first}-{last} sur {totalRecords}"
      {...tableProps}
    >
      {children}
    </DataTable>
  );
}
