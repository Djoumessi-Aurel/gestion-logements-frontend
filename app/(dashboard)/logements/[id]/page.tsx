'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TabView, TabPanel } from 'primereact/tabview';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';

import { logementsApi } from '@/services/logements.api';
import type { Logement, Loyer, LogementDashboard, CreateLoyerDto } from '@/types/logement';
import type { Occupation } from '@/types/occupation';
import { PeriodeType, Role } from '@/types/enums';
import { useAppSelector } from '@/store/hooks';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorMessage from '@/components/shared/ErrorMessage';
import StatusBadge from '@/components/shared/StatusBadge';
import DataTableWrapper from '@/components/shared/DataTableWrapper';

// ─── Schéma ajout loyer ───────────────────────────────────────────────────────

const addLoyerSchema = z.object({
  montant:       z.number({ invalid_type_error: 'Le montant est obligatoire' }).positive('Doit être supérieur à 0'),
  periodeNombre: z.number({ invalid_type_error: 'La durée est obligatoire' }).int().positive('Doit être ≥ 1'),
  periodeType:   z.nativeEnum(PeriodeType, { invalid_type_error: 'Sélectionnez un type' }),
  dateDebut:     z.string().optional(),
});

type AddLoyerFormValues = z.infer<typeof addLoyerSchema>;

// ─── Constantes ───────────────────────────────────────────────────────────────

const PERIODE_OPTIONS = [
  { label: 'Jour(s)',     value: PeriodeType.JOUR },
  { label: 'Semaine(s)', value: PeriodeType.SEMAINE },
  { label: 'Mois',       value: PeriodeType.MOIS },
  { label: 'Année(s)',   value: PeriodeType.ANNEE },
];

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

function extractError(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) return err.response?.data?.message ?? fallback;
  return fallback;
}

function KpiCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color ?? 'text-[#1e293b]'}`}>{value}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LogementDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const toast   = useRef<Toast>(null);
  const logId   = Number(id);
  const role    = useAppSelector((s) => s.auth.user?.role);

  // ── État dashboard ─────────────────────────────────────────────────────────
  const [logement,  setLogement]  = useState<Logement | null>(null);
  const [dashboard, setDashboard] = useState<LogementDashboard | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  // ── État onglet Loyers ─────────────────────────────────────────────────────
  const [loyers,        setLoyers]        = useState<Loyer[] | null>(null);
  const [loyersLoading, setLoyersLoading] = useState(false);
  const [loyersError,   setLoyersError]   = useState<string | null>(null);
  const [loyersLoaded,  setLoyersLoaded]  = useState(false);
  const [addLoyerModal, setAddLoyerModal] = useState(false);
  const [submitting,    setSubmitting]    = useState(false);

  // ── État onglet Occupations ────────────────────────────────────────────────
  const [occupations, setOccupations] = useState<Occupation[] | null>(null);
  const [occsLoading, setOccsLoading] = useState(false);
  const [occsError,   setOccsError]   = useState<string | null>(null);
  const [occsLoaded,  setOccsLoaded]  = useState(false);

  const [activeTab, setActiveTab] = useState(0);

  // ── Formulaire ajout loyer ─────────────────────────────────────────────────
  const addLoyerForm = useForm<AddLoyerFormValues>({
    resolver: zodResolver(addLoyerSchema),
    defaultValues: {
      montant: undefined, periodeNombre: undefined,
      periodeType: undefined, dateDebut: undefined,
    },
  });

  // ── Chargement dashboard ───────────────────────────────────────────────────
  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const [logRes, dashRes] = await Promise.all([
        logementsApi.getById(logId),
        logementsApi.getDashboard(logId),
      ]);
      setLogement(logRes.data.data);
      setDashboard(dashRes.data.data);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 404) {
        setError('Logement introuvable.');
      } else {
        setError('Impossible de charger le dashboard.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Chargement loyers (lazy) ───────────────────────────────────────────────
  async function loadLoyers(force = false) {
    if (loyersLoaded && !force) return;
    setLoyersLoading(true);
    setLoyersError(null);
    try {
      const res = await logementsApi.getLoyers(logId);
      setLoyers(res.data.data);
      setLoyersLoaded(true);
    } catch {
      setLoyersError('Impossible de charger les loyers.');
    } finally {
      setLoyersLoading(false);
    }
  }

  // ── Chargement occupations (lazy) ──────────────────────────────────────────
  async function loadOccupations(force = false) {
    if (occsLoaded && !force) return;
    setOccsLoading(true);
    setOccsError(null);
    try {
      const res = await logementsApi.getOccupations(logId);
      setOccupations(res.data.data);
      setOccsLoaded(true);
    } catch {
      setOccsError('Impossible de charger les occupations.');
    } finally {
      setOccsLoading(false);
    }
  }

  useEffect(() => { loadDashboard(); }, [logId]);

  // ── Changement d'onglet → lazy load ───────────────────────────────────────
  function onTabChange(index: number) {
    setActiveTab(index);
    if (index === 1) loadLoyers();
    if (index === 2) loadOccupations();
  }

  // ── Ajout loyer ────────────────────────────────────────────────────────────
  const onAddLoyer = addLoyerForm.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const dto: CreateLoyerDto = {
        montant:       values.montant,
        periodeNombre: values.periodeNombre,
        periodeType:   values.periodeType,
        ...(values.dateDebut ? { dateDebut: values.dateDebut } : {}),
      };
      await logementsApi.addLoyer(logId, dto);
      toast.current?.show({ severity: 'success', summary: 'Loyer ajouté', life: 3000 });
      setAddLoyerModal(false);
      // Recharger dashboard + loyers en parallèle
      await Promise.all([loadDashboard(), loadLoyers(true)]);
    } catch (err) {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: extractError(err, "Impossible d'ajouter le loyer."), life: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  });

  // ── États initiaux ─────────────────────────────────────────────────────────
  if (loading) return <LoadingSpinner fullHeight />;
  if (error)   return <ErrorMessage message={error} onRetry={loadDashboard} />;
  if (!dashboard || !logement) return null;

  const {
    estOccupe, loyerActuel, locataireActuel, arrieresLocataireActuel,
    nbreTotalOccupations, montantTotalPercu, montantTotalArrieres,
    nbreTotalPaiementsLocataireActuel, montantTotalPayeLocataireActuel,
  } = dashboard;

  const canAddLoyer = role === Role.ADMIN_BATIMENT || role === Role.ADMIN_GLOBAL;

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Toast ref={toast} />

      <PageHeader
        title={logement.nom}
        breadcrumb={[
          { label: 'Dashboard', path: '/' },
          { label: 'Logements', path: '/logements' },
          { label: logement.nom },
        ]}
      />

      <TabView activeIndex={activeTab} onTabChange={(e) => onTabChange(e.index)}>

        {/* ── Onglet Dashboard ────────────────────────────────────────────── */}
        <TabPanel header="Dashboard" leftIcon="pi pi-chart-bar mr-2">

          {/* Statut + loyer + locataire */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <StatusBadge variant={estOccupe ? 'occupe' : 'libre'} />

            {loyerActuel && (
              <span className="text-sm text-gray-600">
                Loyer actuel : <strong>{formatMontant(loyerActuel.montant)}</strong>
                <span className="text-gray-400 ml-1">
                  / {labelPeriode(loyerActuel.periodeNombre, loyerActuel.periodeType)}
                </span>
              </span>
            )}

            {locataireActuel && (
              <Button
                label={`${locataireActuel.prenom} ${locataireActuel.nom}`}
                icon="pi pi-user"
                text size="small"
                onClick={() => router.push(`/locataires/${locataireActuel.id}`)}
              />
            )}
          </div>

          {/* Arriérés locataire actuel */}
          {estOccupe && (
            <div className="mb-6">
              {arrieresLocataireActuel ? (
                <div className="bg-[#fee2e2] border border-[#991b1b] rounded-lg p-4 text-sm">
                  <p className="font-semibold text-[#991b1b] flex items-center gap-2">
                    <i className="pi pi-exclamation-triangle" />
                    Arriéré locataire actuel : {formatMontant(arrieresLocataireActuel.montantDu)}
                  </p>
                  <p className="text-[#991b1b] mt-1">
                    Période due : {formatDate(arrieresLocataireActuel.debutPeriodeDue)}
                    {' → '}
                    {formatDate(arrieresLocataireActuel.finPeriodeDue)}
                    <span className="ml-2">
                      ({arrieresLocataireActuel.nombreLoyersDu} loyer
                      {arrieresLocataireActuel.nombreLoyersDu > 1 ? 's' : ''})
                    </span>
                  </p>
                </div>
              ) : (
                <div className="bg-[#dcfce7] border border-[#166534] rounded-lg p-3 text-sm text-[#166534] flex items-center gap-2">
                  <i className="pi pi-check-circle" />
                  <span>Locataire actuel à jour de ses paiements</span>
                </div>
              )}
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <KpiCard label="Total occupations"      value={nbreTotalOccupations} />
            <KpiCard
              label="Paiements (loc. actuel)"
              value={nbreTotalPaiementsLocataireActuel}
            />
            <KpiCard
              label="Payé (loc. actuel)"
              value={formatMontant(montantTotalPayeLocataireActuel)}
              color="text-[#166534]"
            />
            <KpiCard
              label="Total perçu (tous loc.)"
              value={formatMontant(montantTotalPercu)}
              color="text-[#1e3a8a]"
            />
            <KpiCard
              label="Total arriérés"
              value={formatMontant(montantTotalArrieres)}
              color={montantTotalArrieres > 0 ? 'text-[#991b1b]' : 'text-[#166534]'}
            />
          </div>
        </TabPanel>

        {/* ── Onglet Loyers ───────────────────────────────────────────────── */}
        <TabPanel header="Loyers" leftIcon="pi pi-money-bill mr-2">
          {canAddLoyer && (
            <div className="flex justify-end mb-3">
              <Button
                label="Ajouter un loyer"
                icon="pi pi-plus"
                size="small"
                style={{ backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }}
                onClick={() => {
                  addLoyerForm.reset({
                    montant: undefined, periodeNombre: undefined,
                    periodeType: undefined, dateDebut: undefined,
                  });
                  setAddLoyerModal(true);
                }}
              />
            </div>
          )}

          <DataTableWrapper
            data={loyers}
            loading={loyersLoading}
            error={loyersError}
            onRetry={loadLoyers}
            emptyMessage="Aucun loyer enregistré."
            paginator={false}
          >
            <Column
              header="Date début"
              sortable sortField="dateDebut"
              body={(l: Loyer) => formatDate(l.dateDebut)}
            />
            <Column
              header="Montant"
              sortable sortField="montant"
              body={(l: Loyer) => <strong>{formatMontant(l.montant)}</strong>}
            />
            <Column
              header="Période"
              body={(l: Loyer) => labelPeriode(l.periodeNombre, l.periodeType)}
            />
          </DataTableWrapper>
        </TabPanel>

        {/* ── Onglet Occupations ──────────────────────────────────────────── */}
        <TabPanel header="Occupations" leftIcon="pi pi-calendar mr-2">
          <DataTableWrapper
            data={occupations}
            loading={occsLoading}
            error={occsError}
            onRetry={() => loadOccupations(true)}
            emptyMessage="Aucune occupation enregistrée."
          >
            <Column
              header="Locataire"
              body={(o: Occupation) =>
                o.locataire ? (
                  <Button
                    label={`${o.locataire.prenom} ${o.locataire.nom}`}
                    text size="small"
                    onClick={() => router.push(`/locataires/${o.locataireId}`)}
                  />
                ) : (
                  <span className="text-gray-400 text-sm">ID #{o.locataireId}</span>
                )
              }
            />
            <Column
              header="Date début"
              sortable sortField="dateDebut"
              body={(o: Occupation) => formatDate(o.dateDebut)}
            />
            <Column
              header="Date fin"
              body={(o: Occupation) =>
                o.dateFin
                  ? formatDate(o.dateFin)
                  : <span className="text-gray-400 text-sm italic">En cours</span>
              }
            />
            <Column
              header="Statut"
              body={(o: Occupation) => <StatusBadge variant={o.dateFin ? 'termine' : 'actif'} />}
              style={{ width: '110px' }}
            />
            <Column
              header="Dernier jour couvert"
              body={(o: Occupation) => formatDate(o.dateDernierJourCouvert)}
              style={{ width: '180px' }}
            />
            <Column
              header=""
              body={(o: Occupation) => (
                <Button
                  icon="pi pi-eye"
                  rounded text size="small"
                  tooltip="Voir l'occupation"
                  onClick={() => router.push(`/occupations/${o.id}`)}
                />
              )}
              style={{ width: '60px' }}
              exportable={false}
            />
          </DataTableWrapper>
        </TabPanel>
      </TabView>

      {/* ── Modal Ajouter loyer ─────────────────────────────────────────────── */}
      <Dialog
        visible={addLoyerModal}
        onHide={() => setAddLoyerModal(false)}
        header="Ajouter un loyer"
        style={{ width: '440px' }}
        modal draggable={false} resizable={false}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Annuler" severity="secondary" outlined
              onClick={() => setAddLoyerModal(false)} disabled={submitting}
            />
            <Button
              label="Ajouter" icon="pi pi-check" loading={submitting}
              onClick={onAddLoyer}
              style={{ backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }}
            />
          </div>
        }
      >
        <form onSubmit={onAddLoyer} className="space-y-4 pt-2">
          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Montant <span className="text-red-500">*</span>
            </label>
            <Controller name="montant" control={addLoyerForm.control} render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value)}
                className={`w-full ${addLoyerForm.formState.errors.montant ? 'p-invalid' : ''}`}
                placeholder="50000" min={1}
              />
            )} />
            {addLoyerForm.formState.errors.montant && (
              <p className="text-xs text-[#991b1b] mt-1">{addLoyerForm.formState.errors.montant.message}</p>
            )}
          </div>

          {/* Durée + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-1">
                Durée <span className="text-red-500">*</span>
              </label>
              <Controller name="periodeNombre" control={addLoyerForm.control} render={({ field }) => (
                <InputNumber
                  value={field.value ?? null}
                  onValueChange={(e) => field.onChange(e.value)}
                  className={`w-full ${addLoyerForm.formState.errors.periodeNombre ? 'p-invalid' : ''}`}
                  placeholder="1" min={1}
                />
              )} />
              {addLoyerForm.formState.errors.periodeNombre && (
                <p className="text-xs text-[#991b1b] mt-1">{addLoyerForm.formState.errors.periodeNombre.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <Controller name="periodeType" control={addLoyerForm.control} render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={PERIODE_OPTIONS}
                  placeholder="Sélectionner…"
                  className={`w-full ${addLoyerForm.formState.errors.periodeType ? 'p-invalid' : ''}`}
                />
              )} />
              {addLoyerForm.formState.errors.periodeType && (
                <p className="text-xs text-[#991b1b] mt-1">{addLoyerForm.formState.errors.periodeType.message}</p>
              )}
            </div>
          </div>

          {/* Date début */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">Date de début</label>
            <Controller name="dateDebut" control={addLoyerForm.control} render={({ field }) => (
              <Calendar
                value={field.value ? new Date(field.value) : null}
                onChange={(e) =>
                  field.onChange(e.value ? (e.value as Date).toISOString().split('T')[0] : undefined)
                }
                dateFormat="dd/mm/yy"
                className="w-full"
                placeholder="Aujourd'hui si non renseignée"
                showIcon
              />
            )} />
          </div>
        </form>
      </Dialog>
    </>
  );
}
