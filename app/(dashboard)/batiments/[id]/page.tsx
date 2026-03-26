'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { Column } from 'primereact/column';
import { AxiosError } from 'axios';

import { batimentsApi } from '@/services/batiments.api';
import { logementsApi } from '@/services/logements.api';
import { occupationsApi } from '@/services/occupations.api';
import type { Batiment, BatimentDashboard } from '@/types/batiment';
import type { Logement } from '@/types/logement';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorMessage from '@/components/shared/ErrorMessage';
import StatusBadge from '@/components/shared/StatusBadge';
import DataTableWrapper from '@/components/shared/DataTableWrapper';

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function formatMontant(val: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);
}

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color ?? 'text-[#1e293b]'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BatimentDashboardPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const toast   = useRef<Toast>(null);
  const batId   = Number(id);

  const [batiment,   setBatiment]   = useState<Batiment | null>(null);
  const [dashboard,  setDashboard]  = useState<BatimentDashboard | null>(null);
  const [logements,      setLogements]      = useState<Logement[] | null>(null);
  const [occupiedIds,    setOccupiedIds]    = useState<Set<number>>(new Set());
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [logsLoading,    setLogsLoading]    = useState(true);
  const [logsError,      setLogsError]      = useState<string | null>(null);

  // ── Chargement ─────────────────────────────────────────────────────────────
  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [batRes, dashRes] = await Promise.all([
        batimentsApi.getById(batId),
        batimentsApi.getDashboard(batId),
      ]);
      setBatiment(batRes.data.data);
      setDashboard(dashRes.data.data);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 404) {
        setError('Bâtiment introuvable.');
      } else {
        setError('Impossible de charger le dashboard.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadLogements() {
    setLogsLoading(true);
    setLogsError(null);
    try {
      const [logsRes, occsRes] = await Promise.all([
        logementsApi.getAll(),
        occupationsApi.getAll(),
      ]);
      // Logements de ce bâtiment uniquement
      setLogements(logsRes.data.data.filter((l) => l.batimentId === batId));
      // Occupations actives = dateFin absente ou null
      const activeLogIds = new Set(
        occsRes.data.data
          .filter((o) => !o.dateFin)
          .map((o) => o.logementId),
      );
      setOccupiedIds(activeLogIds);
    } catch {
      setLogsError('Impossible de charger les logements.');
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    loadLogements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batId]);

  // ── États chargement / erreur ──────────────────────────────────────────────
  if (loading) return <LoadingSpinner fullHeight />;
  if (error)   return <ErrorMessage message={error} onRetry={loadAll} />;
  if (!dashboard || !batiment) return null;

  // ── Données graphique donut ────────────────────────────────────────────────
  const donutData = {
    labels: ['Occupés', 'Vacants'],
    datasets: [{
      data: [dashboard.logementsOccupes, dashboard.logementsVacants],
      backgroundColor: ['#3b82f6', '#dcfce7'],
      borderColor:     ['#1e3a8a', '#166534'],
      borderWidth: 1,
    }],
  };

  const donutOptions = {
    plugins: { legend: { position: 'bottom' } },
    cutout: '65%',
  };

  const tauxOccupation = dashboard.totalLogements > 0
    ? Math.round((dashboard.logementsOccupes / dashboard.totalLogements) * 100)
    : 0;

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Toast ref={toast} />

      <PageHeader
        title={batiment.nom}
        breadcrumb={[
          { label: 'Dashboard', path: '/' },
          { label: 'Bâtiments', path: '/batiments' },
          { label: batiment.nom },
        ]}
        action={{
          label:   'Voir les logements',
          icon:    'pi-warehouse',
          onClick: () => router.push('/logements'),
        }}
      />

      {batiment.adresse && (
        <p className="text-sm text-gray-500 -mt-4 mb-6 flex items-center gap-1">
          <i className="pi pi-map-marker text-xs" />
          {batiment.adresse}
        </p>
      )}

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total logements"   value={dashboard.totalLogements} />
        <KpiCard label="Taux d'occupation" value={`${tauxOccupation}%`} color="text-[#1e3a8a]" />
        <KpiCard
          label="Total perçu"
          value={formatMontant(dashboard.montantTotalPercu)}
          color="text-[#166534]"
        />
        <KpiCard
          label="Total arriérés"
          value={formatMontant(dashboard.montantTotalArrieres)}
          color={dashboard.montantTotalArrieres > 0 ? 'text-[#991b1b]' : 'text-[#166534]'}
          sub={dashboard.montantTotalArrieresOccActives > 0
            ? `dont ${formatMontant(dashboard.montantTotalArrieresOccActives)} en cours`
            : undefined}
        />
      </div>

      {/* ── Graphique + liste logements ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut */}
        <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col items-center justify-center">
          <h2 className="text-base font-semibold text-[#1e293b] mb-4">Répartition des logements</h2>
          {dashboard.totalLogements === 0 ? (
            <p className="text-sm text-gray-400">Aucun logement</p>
          ) : (
            <Chart type="doughnut" data={donutData} options={donutOptions} style={{ maxWidth: '220px' }} />
          )}
          <div className="flex gap-4 mt-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#3b82f6] inline-block" />
              Occupés : <strong>{dashboard.logementsOccupes}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#dcfce7] border border-[#166534] inline-block" />
              Vacants : <strong>{dashboard.logementsVacants}</strong>
            </span>
          </div>
        </div>

        {/* Liste logements */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-base font-semibold text-[#1e293b] mb-3">Logements</h2>
          <DataTableWrapper
            data={logements}
            loading={logsLoading}
            error={logsError}
            onRetry={loadLogements}
            emptyMessage="Aucun logement dans ce bâtiment."
            paginator={false}
          >
            <Column field="nom" header="Nom" sortable />
            <Column
              header="Statut"
              body={(l: Logement) => (
                <StatusBadge variant={occupiedIds.has(l.id) ? 'occupe' : 'libre'} />
              )}
              style={{ width: '110px' }}
            />
            <Column
              header=""
              body={(l: Logement) => (
                <Button
                  icon="pi pi-eye"
                  rounded text size="small"
                  tooltip="Voir le logement"
                  onClick={() => router.push(`/logements/${l.id}`)}
                />
              )}
              style={{ width: '60px' }}
              exportable={false}
            />
          </DataTableWrapper>
        </div>
      </div>
    </>
  );
}
