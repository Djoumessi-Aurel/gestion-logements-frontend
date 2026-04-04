'use client';

import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';

import { locatairesApi } from '@/services/locataires.api';
import { occupationsApi } from '@/services/occupations.api';
import type { Locataire, LocataireDashboard } from '@/types/locataire';
import type { Occupation } from '@/types/occupation';
import type { OccupationDashboard, OccupationDashboardPaiement } from '@/types/occupation';
import type { Arriere } from '@/types/arriere';
import { PeriodeType } from '@/types/enums';

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

// ─── Panneau occupation avec paiements lazy ────────────────────────────────────

type DashState = OccupationDashboard | 'loading' | 'error' | null;

function PaiementsTable({ paiements }: { paiements: OccupationDashboardPaiement[] }) {
  if (paiements.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">Aucun paiement enregistré.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100">
            <th className="pb-2 pr-4 font-medium">Période</th>
            <th className="pb-2 pr-4 font-medium">Montant payé</th>
            <th className="pb-2 pr-4 font-medium">Nb loyers</th>
            <th className="pb-2 pr-4 font-medium">Date paiement</th>
            <th className="pb-2 font-medium">Ponctualité</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {paiements.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="py-2 pr-4 whitespace-nowrap text-gray-700">
                {formatDate(p.debutPeriode)} → {formatDate(p.finPeriode)}
              </td>
              <td className="py-2 pr-4 font-semibold text-[#1e293b]">
                {formatMontant(p.montantPaye)}
              </td>
              <td className="py-2 pr-4 text-center text-gray-600">
                {p.nombreDeLoyers != null ? p.nombreDeLoyers : <span className="text-gray-300">—</span>}
              </td>
              <td className="py-2 pr-4 text-gray-600">
                {formatDate(p.datePaiement)}
              </td>
              <td className="py-2">
                {p.enRetard ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#991b1b] bg-[#fee2e2] px-2 py-0.5 rounded-full">
                    <i className="pi pi-clock text-xs" /> En retard
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#166534] bg-[#dcfce7] px-2 py-0.5 rounded-full">
                    <i className="pi pi-check text-xs" /> À temps
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OccupationPanel({ occ }: { occ: Occupation }) {
  const [expanded, setExpanded]     = useState(false);
  const [dashState, setDashState]   = useState<DashState>(null);

  async function loadDashboard() {
    setDashState('loading');
    try {
      const res = await occupationsApi.getDashboard(occ.id);
      setDashState(res.data.data);
    } catch {
      setDashState('error');
    }
  }

  function toggle() {
    if (!expanded && dashState === null) {
      loadDashboard();
    }
    setExpanded((v) => !v);
  }

  const estActive = !occ.dateFin;
  const logementNom = occ.logement?.nom ?? `Occupation #${occ.id}`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
          <i className="pi pi-home text-[#3b82f6] shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-[#1e293b] truncate">{logementNom}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Début : {formatDate(occ.dateDebut)}
              {occ.dateFin && <> · Fin : {formatDate(occ.dateFin)}</>}
              {occ.logement?.loyers && occ.logement.loyers.length > 0 && (
                <> · {formatMontant(occ.logement.loyers[0].montant)} / {labelPeriode(occ.logement.loyers[0].periodeNombre, occ.logement.loyers[0].periodeType)}</>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
            estActive ? 'bg-[#dbeafe] text-[#1e3a8a]' : 'bg-gray-100 text-gray-500'
          }`}>
            {estActive ? 'Active' : 'Terminée'}
          </span>
          <Button
            icon={expanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'}
            text
            size="small"
            label={expanded ? 'Masquer les paiements' : 'Afficher les paiements'}
            onClick={toggle}
            className="text-xs text-[#3b82f6]"
          />
        </div>
      </div>

      {/* Corps (paiements) */}
      {expanded && (
        <div className="border-t border-gray-100 p-4">
          {dashState === null || dashState === 'loading' ? (
            <div className="flex justify-center py-4">
              <i className="pi pi-spin pi-spinner text-[#3b82f6] text-xl" />
            </div>
          ) : dashState === 'error' ? (
            <div className="flex items-center gap-2 text-sm text-[#991b1b] py-2">
              <i className="pi pi-times-circle" />
              Impossible de charger les paiements.
              <button className="underline ml-1" onClick={loadDashboard}>Réessayer</button>
            </div>
          ) : (
            <>
              {dashState.arrieres && (
                <div className="mb-3 bg-[#fee2e2] border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <i className="pi pi-exclamation-triangle text-[#991b1b] mt-0.5 shrink-0" />
                  <p className="text-sm font-semibold text-[#991b1b]">
                    Arriéré : {formatMontant(dashState.arrieres.montantDu)}
                    <span className="font-normal text-xs ml-2">
                      ({formatDate(dashState.arrieres.debutPeriodeDue)} → {formatDate(dashState.arrieres.finPeriodeDue)})
                    </span>
                  </p>
                </div>
              )}
              <PaiementsTable paiements={dashState.paiements} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LocataireEspacePage() {
  const [locataire,   setLocataire]   = useState<Locataire | null>(null);
  const [dashboard,   setDashboard]   = useState<LocataireDashboard | null>(null);
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [noProfile,   setNoProfile]   = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    setNoProfile(false);
    try {
      // Le backend retourne uniquement le locataire lié au compte connecté
      const locsRes = await locatairesApi.getAll();
      if (locsRes.data.data.length === 0) {
        setNoProfile(true);
        return;
      }
      const loc = locsRes.data.data[0];

      const [dashRes, occsRes] = await Promise.all([
        locatairesApi.getDashboard(loc.id),
        occupationsApi.getAll(),
      ]);
      setLocataire(loc);
      setDashboard(dashRes.data.data);
      setOccupations(occsRes.data.data);
    } catch (err) {
      console.log(err);
      setError('Impossible de charger votre profil.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LoadingSpinner />;
  if (noProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <i className="pi pi-user-minus text-4xl text-gray-300" />
        <p className="text-lg font-semibold text-[#1e293b]">Aucun profil locataire associé</p>
        <p className="text-sm text-gray-500 max-w-sm">
          Votre compte n&apos;est lié à aucun locataire pour l&apos;instant.<br />
          Contactez un administrateur pour régulariser votre situation.
        </p>
      </div>
    );
  }
  if (error || !locataire || !dashboard) {
    return <ErrorMessage message={error ?? 'Données introuvables.'} onRetry={load} />;
  }

  const { solvabilite, assiduité: assiduite, listeArrieres } = dashboard;
  const tauxOccupation = dashboard.totalOccupations > 0
    ? Math.round((dashboard.nbOccupationsActives / dashboard.totalOccupations) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${locataire.prenom} ${locataire.nom}`}
        breadcrumb={[{ label: 'Mon espace' }]}
      />

      {/* ── Infos ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#1e293b]">Mes informations</h2>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
            locataire.libre ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#dbeafe] text-[#1e3a8a]'
          }`}>
            {locataire.libre ? 'Libre' : 'En occupation'}
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
            <span className="text-gray-500">Locataire depuis</span>
            <p className="font-medium text-[#1e293b] mt-0.5">{formatDate(locataire.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* ── Arriérés ───────────────────────────────────────────────────────── */}
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
          <p className="text-sm font-semibold text-[#166534]">Aucun arriéré — vous êtes à jour</p>
        </div>
      )}

      {/* ── Occupations KPIs ───────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-[#1e293b] mb-3">Occupations</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <KpiCard label="Total" value={String(dashboard.totalOccupations)} />
          <KpiCard
            label="Active(s)"
            value={String(dashboard.nbOccupationsActives)}
            color={dashboard.nbOccupationsActives > 0 ? 'text-[#1e3a8a]' : 'text-gray-400'}
          />
          {/* <KpiCard label="Taux d'occupation" value={`${tauxOccupation} %`} /> */}
        </div>

        {/* Liste des occupations avec paiements */}
        {occupations.length > 0 ? (
          <div className="space-y-3">
            {occupations.map((occ) => (
              <OccupationPanel key={occ.id} occ={occ} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Aucune occupation enregistrée.</p>
        )}
      </div>

      {/* ── Solvabilité ────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-[#1e293b] mb-3">Solvabilité</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard
            label="Total payé"
            value={formatMontant(solvabilite.montantTotalPaye)}
            color="text-[#166534]"
          />
          <KpiCard
            label="Total arriérés"
            value={formatMontant(solvabilite.montantArrieres)}
            color={solvabilite.montantArrieres > 0 ? 'text-[#991b1b]' : 'text-[#166534]'}
          />
        </div>
      </div>

      {/* ── Assiduité ──────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-[#1e293b] mb-3">Assiduité</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard label="Paiements" value={String(assiduite.nombrePaiements)} />
          <KpiCard
            label="À temps"
            value={String(assiduite.nombrePaiementsATemps)}
            color="text-[#166534]"
          />
          <KpiCard
            label="En retard"
            value={String(assiduite.nombrePaiementsEnRetard)}
            color={assiduite.nombrePaiementsEnRetard > 0 ? 'text-[#991b1b]' : 'text-[#166534]'}
          />
          <KpiCard
            label="Taux de ponctualité"
            value={`${assiduite.tauxPonctualite.toFixed(1)} %`}
            color={
              assiduite.tauxPonctualite >= 80 ? 'text-[#166534]'
              : assiduite.tauxPonctualite >= 50 ? 'text-[#92400e]'
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
    </div>
  );
}
