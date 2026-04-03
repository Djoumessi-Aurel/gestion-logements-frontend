'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from 'primereact/button';

import { locatairesApi } from '@/services/locataires.api';
import type { Locataire, LocataireDashboard } from '@/types/locataire';
import type { Arriere } from '@/types/arriere';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorMessage from '@/components/shared/ErrorMessage';

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function formatMontant(val: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'XAF', maximumFractionDigits: 0,
  }).format(val);
}

function formatDate(val: string): string {
  return new Date(val).toLocaleDateString('fr-FR');
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color ?? 'text-[#1e293b]'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function ArriereBadge({ arriere }: { arriere: Arriere }) {
  return (
    <div className="bg-[#fee2e2] border border-red-200 rounded-lg p-3 flex items-start gap-3">
      <i className="pi pi-exclamation-triangle text-[#991b1b] mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-[#991b1b]">
          Arriéré : {formatMontant(arriere.montantDu)}
        </p>
        <p className="text-xs text-[#991b1b] mt-0.5">
          Période : {formatDate(arriere.debutPeriodeDue)} → {formatDate(arriere.finPeriodeDue)}
          {' '}({arriere.nombreLoyersDu} loyer{arriere.nombreLoyersDu > 1 ? 's' : ''} dû{arriere.nombreLoyersDu > 1 ? 's' : ''})
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LocataireDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const locId   = Number(id);

  const [locataire,  setLocataire]  = useState<Locataire | null>(null);
  const [dashboard,  setDashboard]  = useState<LocataireDashboard | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [locRes, dashRes] = await Promise.all([
        locatairesApi.getById(locId),
        locatairesApi.getDashboard(locId),
      ]);
      setLocataire(locRes.data.data);
      setDashboard(dashRes.data.data);
    } catch {
      setError('Impossible de charger les données du locataire.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, [locId]);

  if (loading) return <LoadingSpinner />;
  if (error || !locataire || !dashboard) {
    return <ErrorMessage message={error ?? 'Données introuvables.'} onRetry={loadAll} />;
  }

  const { solvabilite, assiduité: assiduite, listeArrieres } = dashboard;
  const tauxOccupation = dashboard.totalOccupations > 0
    ? Math.round((dashboard.nbOccupationsActives / dashboard.totalOccupations) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${locataire.prenom} ${locataire.nom}`}
        breadcrumb={[
          { label: 'Dashboard', path: '/' },
          { label: 'Locataires', path: '/locataires' },
          { label: `${locataire.prenom} ${locataire.nom}` },
        ]}
      />

      {/* ── Infos locataire ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#1e293b]">Informations</h2>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
              locataire.libre
                ? 'bg-[#dcfce7] text-[#166534]'
                : 'bg-[#fee2e2] text-[#991b1b]'
            }`}
          >
            {locataire.libre ? 'Libre' : 'Occupé'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Téléphone</span>
            <p className="font-medium text-[#1e293b] mt-0.5">{locataire.telephone}</p>
          </div>
          {locataire.email && (
            <div>
              <span className="text-gray-500">Email</span>
              <p className="font-medium text-[#1e293b] mt-0.5">{locataire.email}</p>
            </div>
          )}
          <div>
            <span className="text-gray-500">Depuis</span>
            <p className="font-medium text-[#1e293b] mt-0.5">{formatDate(locataire.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* ── Situation arriérés ─────────────────────────────────────────────── */}
      {listeArrieres.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-[#1e293b] px-1">Arriérés</h2>
          {listeArrieres.map((arr, i) => (
            <ArriereBadge key={i} arriere={arr} />
          ))}
        </div>
      ) : (
        <div className="bg-[#dcfce7] border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <i className="pi pi-check-circle text-[#166534] text-lg" />
          <p className="text-sm font-semibold text-[#166534]">Aucun arriéré — locataire à jour</p>
        </div>
      )}

      {/* ── KPIs Occupations ───────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-[#1e293b] mb-3">Occupations</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard
            label="Total occupations"
            value={String(dashboard.totalOccupations)}
          />
          <KpiCard
            label="Occupation(s) active(s)"
            value={String(dashboard.nbOccupationsActives)}
            color={dashboard.nbOccupationsActives > 0 ? 'text-[#1e3a8a]' : 'text-gray-400'}
          />
          {/* <KpiCard
            label="Taux d'occupation"
            value={`${tauxOccupation} %`}
          /> */}
        </div>
      </div>

      {/* ── KPIs Solvabilité ───────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-[#1e293b] mb-3">Solvabilité</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard
            label="Montant total payé"
            value={formatMontant(solvabilite.montantTotalPaye)}
            color="text-[#166534]"
          />
          <KpiCard
            label="Montant total arriérés"
            value={formatMontant(solvabilite.montantArrieres)}
            color={solvabilite.montantArrieres > 0 ? 'text-[#991b1b]' : 'text-[#166534]'}
          />
        </div>
      </div>

      {/* ── KPIs Assiduité ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-[#1e293b] mb-3">Assiduité</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard
            label="Nombre de paiements"
            value={String(assiduite.nombrePaiements)}
          />
          <KpiCard
            label="Paiements à temps"
            value={String(assiduite.nombrePaiementsATemps)}
            color="text-[#166534]"
          />
          <KpiCard
            label="Paiements en retard"
            value={String(assiduite.nombrePaiementsEnRetard)}
            color={assiduite.nombrePaiementsEnRetard > 0 ? 'text-[#991b1b]' : 'text-[#166534]'}
          />
          <KpiCard
            label="Taux de ponctualité"
            value={`${assiduite.tauxPonctualite.toFixed(1)} %`}
            color={
              assiduite.tauxPonctualite >= 80
                ? 'text-[#166534]'
                : assiduite.tauxPonctualite >= 50
                ? 'text-[#92400e]'
                : 'text-[#991b1b]'
            }
          />
          <KpiCard
            label="Retard moyen"
            value={`${assiduite.retardMoyenJours} j`}
            color={assiduite.retardMoyenJours <= 3 ? 'text-[#166534]' : 'text-[#991b1b]'}
          />
        </div>
      </div>

      {/* ── Bouton retour ──────────────────────────────────────────────────── */}
      <div>
        <Button
          label="Retour à la liste"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined
          onClick={() => router.push('/locataires')}
        />
      </div>
    </div>
  );
}
