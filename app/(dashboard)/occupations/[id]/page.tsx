'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';

import { occupationsApi } from '@/services/occupations.api';
import type { OccupationDashboard, OccupationDashboardPaiement } from '@/types/occupation';
import type { Arriere } from '@/types/arriere';
import { PeriodeType } from '@/types/enums';

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

function labelPeriode(nombre: number, type: PeriodeType): string {
  const labels: Record<PeriodeType, string> = {
    [PeriodeType.JOUR]:    'jour(s)',
    [PeriodeType.SEMAINE]: 'semaine(s)',
    [PeriodeType.MOIS]:    'mois',
    [PeriodeType.ANNEE]:   'an(s)',
  };
  return `${nombre} ${labels[type]}`;
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color ?? 'text-[#1e293b]'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function ArriereAlert({ arrieres }: { arrieres: Arriere }) {
  return (
    <div className="bg-[#fee2e2] border border-red-200 rounded-xl p-4 flex items-start gap-3">
      <i className="pi pi-exclamation-triangle text-[#991b1b] text-lg mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-[#991b1b]">
          Arriéré : {formatMontant(arrieres.montantDu)}
          {' '}({arrieres.nombreLoyersDu} loyer{arrieres.nombreLoyersDu > 1 ? 's' : ''} dû{arrieres.nombreLoyersDu > 1 ? 's' : ''})
        </p>
        <p className="text-xs text-[#991b1b] mt-0.5">
          Période : {formatDate(arrieres.debutPeriodeDue)} → {formatDate(arrieres.finPeriodeDue)}
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OccupationDashboardPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const occId   = Number(id);

  const [dashboard, setDashboard] = useState<OccupationDashboard | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await occupationsApi.getDashboard(occId);
      setDashboard(res.data.data);
    } catch {
      setError("Impossible de charger les données de l'occupation.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [occId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LoadingSpinner />;
  if (error || !dashboard) {
    return <ErrorMessage message={error ?? 'Données introuvables.'} onRetry={load} />;
  }

  const { logement, locataire, loyerActuel, arrieres, dernierPaiement } = dashboard;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Occupation — ${logement.nom}`}
        breadcrumb={[
          { label: 'Dashboard', path: '/' },
          { label: 'Occupations', path: '/occupations' },
          { label: logement.nom },
        ]}
      />

      {/* ── Statut ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#1e293b]">Informations</h2>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
            dashboard.estActive
              ? 'bg-[#dbeafe] text-[#1e3a8a]'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {dashboard.estActive ? 'Active' : 'Terminée'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Logement</span>
            <Button
              className='block p-0'
              label={logement.nom}
              text size="small"
              onClick={() => router.push(`/logements/${logement.id}`)}
            />
          </div>
          <div>
            <span className="text-gray-500">Locataire</span>
            <Button
              className='block p-0'
              label={`${locataire.prenom} ${locataire.nom}`}
              text size="small"
              onClick={() => router.push(`/locataires/${locataire.id}`)}
            />
          </div>
          <div>
            <span className="text-gray-500">Date de début</span>
            <p className="font-medium text-[#1e293b] mt-0.5">{formatDate(dashboard.dateDebut)}</p>
          </div>
          {dashboard.dateFin && (
            <div>
              <span className="text-gray-500">Date de fin</span>
              <p className="font-medium text-[#1e293b] mt-0.5">{formatDate(dashboard.dateFin)}</p>
            </div>
          )}
          {loyerActuel && (
            <div>
              <span className="text-gray-500">Loyer actuel</span>
              <p className="font-medium text-[#1e293b] mt-0.5">
                {formatMontant(loyerActuel.montant)}
                <span className="text-gray-400 font-normal"> / {labelPeriode(loyerActuel.periodeNombre, loyerActuel.periodeType)}</span>
              </p>
            </div>
          )}
          {dernierPaiement && (
            <div>
              <span className="text-gray-500">Dernier paiement</span>
              <p className="font-medium text-[#1e293b] mt-0.5">
                {formatMontant(dernierPaiement.montantPaye)}
                <span className="text-gray-400 font-normal"> le {formatDate(dernierPaiement.datePaiement)}</span>
              </p>
              <p className="text-xs text-gray-400">Couvre jusqu'au {formatDate(dernierPaiement.finPeriode)}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Arriérés ───────────────────────────────────────────────────────── */}
      {arrieres ? (
        <ArriereAlert arrieres={arrieres} />
      ) : (
        <div className="bg-[#dcfce7] border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <i className="pi pi-check-circle text-[#166534] text-lg" />
          <p className="text-sm font-semibold text-[#166534]">Aucun arriéré — occupation à jour</p>
        </div>
      )}

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Total paiements"
          value={String(dashboard.nbreTotalPaiements)}
        />
        <KpiCard
          label="Montant total payé"
          value={formatMontant(dashboard.montantTotalPaye)}
          color="text-[#166534]"
        />
        {arrieres && (
          <KpiCard
            label="Arriéré"
            value={formatMontant(arrieres.montantDu)}
            sub={`${arrieres.nombreLoyersDu} loyer${arrieres.nombreLoyersDu > 1 ? 's' : ''} dû${arrieres.nombreLoyersDu > 1 ? 's' : ''}`}
            color="text-[#991b1b]"
          />
        )}
      </div>

      {/* ── Historique paiements ───────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-[#1e293b] mb-3">Historique des paiements</h2>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <DataTableWrapper
            data={dashboard.paiements}
            loading={false}
            emptyMessage="Aucun paiement enregistré."
            filterDisplay={undefined}
          >
            <Column
              header="Période"
              body={(p: OccupationDashboardPaiement) => (
                <span className="text-sm whitespace-nowrap">
                  {formatDate(p.debutPeriode)} → {formatDate(p.finPeriode)}
                </span>
              )}
              style={{ width: '210px' }}
            />
            <Column
              header="Montant payé"
              body={(p: OccupationDashboardPaiement) => (
                <strong>{formatMontant(p.montantPaye)}</strong>
              )}
              style={{ width: '150px' }}
            />
            <Column
              header="Nb loyers"
              body={(p: OccupationDashboardPaiement) =>
                p.nombreDeLoyers != null
                  ? p.nombreDeLoyers
                  : <span className="text-gray-400 text-sm">—</span>
              }
              style={{ width: '90px', textAlign: 'center' }}
            />
            <Column
              header="Date paiement"
              body={(p: OccupationDashboardPaiement) => formatDate(p.datePaiement)}
              style={{ width: '130px' }}
            />
            <Column
              header="Attendu le"
              body={(p: OccupationDashboardPaiement) => (
                <span className={p.enRetard ? 'text-[#991b1b]' : ''}>
                  {formatDate(p.dateAttenduePaiement)}
                </span>
              )}
              style={{ width: '120px' }}
            />
            <Column
              header="Ponctualité"
              body={(p: OccupationDashboardPaiement) => (
                p.enRetard ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#991b1b] bg-[#fee2e2] px-2 py-0.5 rounded-full">
                    <i className="pi pi-clock text-xs" /> En retard
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#166534] bg-[#dcfce7] px-2 py-0.5 rounded-full">
                    <i className="pi pi-check text-xs" /> À temps
                  </span>
                )
              )}
              style={{ width: '110px' }}
            />
          </DataTableWrapper>
        </div>
      </div>

      {/* ── Bouton retour ──────────────────────────────────────────────────── */}
      <div>
        <Button
          label="Retour à la liste"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined
          onClick={() => router.push('/occupations')}
        />
      </div>
    </div>
  );
}
