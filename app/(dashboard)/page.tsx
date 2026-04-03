'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';

import { dashboardApi } from '@/services/dashboard.api';
import { occupationsApi } from '@/services/occupations.api';
import type { DashboardGlobal } from '@/types/dashboard';
import type { Occupation } from '@/types/occupation';
import { Role } from '@/types/enums';
import { useAppSelector } from '@/store/hooks';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorMessage from '@/components/shared/ErrorMessage';
import DataTableWrapper from '@/components/shared/DataTableWrapper';

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function formatMontant(val: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'XAF', maximumFractionDigits: 0,
  }).format(val);
}

function formatDate(val: string): string {
  return new Date(val).toLocaleDateString('fr-FR');
}

/** Retourne true si le dernier jour couvert est dépassé (arriéré). */
function isArriereDate(dateDernierJourCouvert: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDay = new Date(dateDernierJourCouvert);
  lastDay.setHours(0, 0, 0, 0);
  return lastDay < today;
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, color, icon,
}: {
  label: string; value: string; sub?: string; color?: string; icon?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-start gap-3">
      {icon && (
        <div className="rounded-lg bg-[#dbeafe] p-2 shrink-0">
          <i className={`pi ${icon} text-[#1e3a8a] text-lg`} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${color ?? 'text-[#1e293b]'}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const toast  = useRef<Toast>(null);
  const role   = useAppSelector((s) => s.auth.user?.role);

  const [kpis,       setKpis]       = useState<DashboardGlobal | null>(null);
  const [occupations, setOccupations] = useState<Occupation[] | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [kpisRes, occsRes] = await Promise.all([
        dashboardApi.getGlobal(),
        occupationsApi.getAll(0),
      ]);
      setKpis(kpisRes.data.data);

      // Trier par dateDernierJourCouvert ASC (les plus en retard en premier)
      const sorted = [...occsRes.data.data].sort((a, b) =>
        new Date(a.dateDernierJourCouvert).getTime() - new Date(b.dateDernierJourCouvert).getTime()
      );
      setOccupations(sorted);
    } catch {
      setError('Impossible de charger le tableau de bord.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LoadingSpinner />;
  if (error || !kpis || !occupations) {
    return <ErrorMessage message={error ?? 'Données introuvables.'} onRetry={load} />;
  }

  const tauxOccupation = kpis.totalLogements > 0
    ? Math.round((kpis.logementsOccupes / kpis.totalLogements) * 100)
    : 0;

  const canSeeBatiments = role === Role.ADMIN_BATIMENT || role === Role.ADMIN_GLOBAL;

  return (
    <>
      <Toast ref={toast} />

      <PageHeader
        title="Tableau de bord"
        breadcrumb={[{ label: 'Tableau de bord' }]}
        action={{ label: 'Actualiser', icon: 'pi-refresh', onClick: load }}
      />

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {canSeeBatiments && (
          <KpiCard
            label="Bâtiments"
            value={String(kpis.totalBatiments)}
            icon="pi-building"
          />
        )}
        <KpiCard
          label="Logements"
          value={String(kpis.totalLogements)}
          icon="pi-home"
        />
        <KpiCard
          label="Occupés"
          value={String(kpis.logementsOccupes)}
          sub={`${tauxOccupation} % d'occupation`}
          color="text-[#1e3a8a]"
          icon="pi-user"
        />
        <KpiCard
          label="Vacants"
          value={String(kpis.logementsVacants)}
          color={kpis.logementsVacants > 0 ? 'text-[#92400e]' : 'text-[#166534]'}
          icon="pi-lock-open"
        />
        <KpiCard
          label="Occupations actives"
          value={String(kpis.occupationsActives)}
          icon="pi-check-circle"
        />
        <KpiCard
          label="Arriérés (occ. actives)"
          value={formatMontant(kpis.montantTotalArrieresOccActives)}
          color={kpis.montantTotalArrieresOccActives > 0 ? 'text-[#991b1b]' : 'text-[#166534]'}
          icon="pi-exclamation-triangle"
        />
        <KpiCard
          label="Arriérés (total)"
          value={formatMontant(kpis.montantTotalArrieres)}
          color={kpis.montantTotalArrieres > 0 ? 'text-[#991b1b]' : 'text-[#166534]'}
          icon="pi-times-circle"
        />
        <KpiCard
          label="Total perçu"
          value={formatMontant(kpis.montantTotalPercu)}
          color="text-[#166534]"
          icon="pi-wallet"
        />
      </div>

      {/* ── Logements occupés (triés par dernier jour couvert ASC) ──────────── */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-[#1e293b]">
            Logements occupés
            <span className="ml-2 text-xs font-normal text-gray-400">
              (triés par date de couverture — les plus en retard en premier)
            </span>
          </h2>
        </div>

        <DataTableWrapper
          data={occupations}
          loading={false}
          emptyMessage="Aucune occupation active."
          filterDisplay={undefined}
        >
          {/* Statut (rouge/vert) */}
          <Column
            header="Statut"
            body={(occ: Occupation) => {
              const retard = isArriereDate(occ.dateDernierJourCouvert);
              return (
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  retard
                    ? 'bg-[#fee2e2] text-[#991b1b]'
                    : 'bg-[#dcfce7] text-[#166534]'
                }`}>
                  <i className={`pi ${retard ? 'pi-exclamation-circle' : 'pi-check-circle'} text-xs`} />
                  {retard ? 'Arriéré' : 'À jour'}
                </span>
              );
            }}
            style={{ width: '110px' }}
          />

          {/* Logement */}
          <Column
            header="Logement"
            body={(occ: Occupation) => (
              <Button
                label={occ.logement?.nom ?? `#${occ.logementId}`}
                text
                size="small"
                className="p-0 text-[#1e3a8a]"
                onClick={() => router.push(`/logements/${occ.logementId}`)}
              />
            )}
            sortable
            sortField="logement.nom"
          />

          {/* Locataire */}
          <Column
            header="Locataire"
            body={(occ: Occupation) =>
              occ.locataire
                ? <span className="text-sm">{occ.locataire.prenom} {occ.locataire.nom}</span>
                : <span className="text-gray-400 text-sm">—</span>
            }
            sortable
            sortField="locataire.nom"
          />

          {/* Dernier jour couvert */}
          <Column
            header="Dernier jour couvert"
            body={(occ: Occupation) => {
              const retard = isArriereDate(occ.dateDernierJourCouvert);
              return (
                <span className={`text-sm font-medium ${retard ? 'text-[#991b1b]' : 'text-[#166534]'}`}>
                  {formatDate(occ.dateDernierJourCouvert)}
                </span>
              );
            }}
            sortable
            sortField="dateDernierJourCouvert"
            style={{ width: '170px' }}
          />

          {/* Actions */}
          <Column
            header=""
            body={(occ: Occupation) => (
              <Button
                icon="pi pi-chart-bar"
                rounded text
                tooltip="Dashboard occupation"
                tooltipOptions={{ position: 'top' }}
                onClick={() => router.push(`/occupations/${occ.id}`)}
              />
            )}
            style={{ width: '60px', textAlign: 'center' }}
            exportable={false}
          />
        </DataTableWrapper>
      </div>
    </>
  );
}
