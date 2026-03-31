'use client';

import { useEffect, useState, useRef } from 'react';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';

import { logementsApi } from '@/services/logements.api';
import { batimentsApi } from '@/services/batiments.api';
import { occupationsApi } from '@/services/occupations.api';
import { locatairesApi } from '@/services/locataires.api';
import type { Logement, CreateLogementDto } from '@/types/logement';
import type { Batiment } from '@/types/batiment';
import type { Occupation } from '@/types/occupation';
import type { Locataire } from '@/types/locataire';
import { PeriodeType, Role } from '@/types/enums';
import { useAppSelector } from '@/store/hooks';

import PageHeader from '@/components/shared/PageHeader';
import DataTableWrapper from '@/components/shared/DataTableWrapper';
import StatusBadge from '@/components/shared/StatusBadge';
import { showConfirm } from '@/components/shared/ConfirmDialog';

// ─── Schémas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  batimentId:         z.number({ message: 'Sélectionnez un bâtiment' }).min(1, 'Sélectionnez un bâtiment'),
  nom:                z.string().min(1, 'Le nom est obligatoire'),
  description:        z.string().optional(),
  loyerMontant:       z.number({ message: 'Le montant est obligatoire' }).positive('Doit être supérieur à 0'),
  loyerPeriodeNombre: z.number({ message: 'La durée est obligatoire' }).int().positive('Doit être ≥ 1'),
  loyerPeriodeType:   z.nativeEnum(PeriodeType, { message: 'Sélectionnez un type de période' }),
  loyerDateDebut:     z.string().optional(),
});

const editSchema = z.object({
  nom:         z.string().min(1, 'Le nom est obligatoire'),
  description: z.string().optional(),
});

const occupierSchema = z.object({
  locataireId: z.number({ required_error: 'Sélectionnez un locataire' }),
  dateDebut:   z.string().min(1, 'La date de début est obligatoire'),
});

type CreateFormValues  = z.infer<typeof createSchema>;
type EditFormValues    = z.infer<typeof editSchema>;
type OccupierFormValues = z.infer<typeof occupierSchema>;

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
    [PeriodeType.JOUR]:    'j',
    [PeriodeType.SEMAINE]: 'sem',
    [PeriodeType.MOIS]:    'mois',
    [PeriodeType.ANNEE]:   'an',
  };
  return `${nombre} ${labels[type]}`;
}

function extractError(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) return err.response?.data?.message ?? fallback;
  return fallback;
}

// Formatage local pour éviter le décalage UTC lors de la sélection de date
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LogementsPage() {
  const router = useRouter();
  const toast  = useRef<Toast>(null);
  const role   = useAppSelector((s) => s.auth.user?.role);

  // ── État ───────────────────────────────────────────────────────────────────
  const [logements,    setLogements]    = useState<Logement[] | null>(null);
  const [batiments,    setBatiments]    = useState<Batiment[]>([]);
  const [locataires,   setLocataires]   = useState<Locataire[]>([]);
  const [occMap,       setOccMap]       = useState<Map<number, Occupation>>(new Map());
  const [batMap,       setBatMap]       = useState<Map<number, Batiment>>(new Map());
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [modalMode,    setModalMode]    = useState<'create' | 'edit' | null>(null);
  const [editing,      setEditing]      = useState<Logement | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [deletingId,   setDeletingId]   = useState<number | null>(null);
  const [occModalOpen,  setOccModalOpen]  = useState(false);
  const [occLogement,   setOccLogement]   = useState<Logement | null>(null);
  const [occSubmitting, setOccSubmitting] = useState(false);

  // ── Formulaires ────────────────────────────────────────────────────────────
  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      batimentId: undefined, nom: '', description: '',
      loyerMontant: undefined, loyerPeriodeNombre: 1,
      loyerPeriodeType: PeriodeType.MOIS, loyerDateDebut: undefined,
    },
  });

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { nom: '', description: '' },
  });

  const occForm = useForm<OccupierFormValues>({
    resolver: zodResolver(occupierSchema),
    defaultValues: { locataireId: undefined, dateDebut: '' },
  });

  // ── Chargement ─────────────────────────────────────────────────────────────
  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [logsRes, occsRes, batsRes, locsRes] = await Promise.all([
        logementsApi.getAll({ includeLoyer: true }),
        occupationsApi.getAll(0), // uniquement les occupations en cours
        batimentsApi.getAll(),
        locatairesApi.getAll(),
      ]);

      setLocataires(locsRes.data.data);

      const bats = batsRes.data.data;
      const localBatMap = new Map(bats.map((b) => [b.id, b]));
      setBatiments(bats);
      setBatMap(localBatMap);

      // Enrichir chaque logement avec son batiment si l'API ne le nestifie pas,
      // afin que filterField="batiment.nom" trouve toujours une valeur non-undefined
      const enriched = logsRes.data.data.map((l) => ({
        ...l,
        batiment: l.batiment ?? localBatMap.get(l.batimentId),
      }));
      setLogements(enriched);

      const map = new Map<number, Occupation>();
      for (const occ of occsRes.data.data) map.set(occ.logementId, occ);
      setOccMap(map);
    } catch {
      setError('Impossible de charger les logements.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  // ── Modal ──────────────────────────────────────────────────────────────────
  function openCreate() {
    createForm.reset({
      batimentId: undefined, nom: '', description: '',
      loyerMontant: undefined, loyerPeriodeNombre: 1,
      loyerPeriodeType: PeriodeType.MOIS, loyerDateDebut: undefined,
    });
    setModalMode('create');
  }

  function openEdit(log: Logement) {
    setEditing(log);
    editForm.reset({ nom: log.nom, description: log.description ?? '' });
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setEditing(null);
  }

  function openOccuper(log: Logement) {
    setOccLogement(log);
    occForm.reset({ locataireId: undefined, dateDebut: '' });
    setOccModalOpen(true);
  }

  function closeOccModal() {
    setOccModalOpen(false);
    setOccLogement(null);
  }

  // ── Soumission créer ───────────────────────────────────────────────────────
  const onCreateSubmit = createForm.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const dto: CreateLogementDto = {
        batimentId:         values.batimentId,
        nom:                values.nom,
        loyerMontant:       values.loyerMontant,
        loyerPeriodeNombre: values.loyerPeriodeNombre,
        loyerPeriodeType:   values.loyerPeriodeType,
        ...(values.description    ? { description:    values.description    } : {}),
        ...(values.loyerDateDebut ? { loyerDateDebut: values.loyerDateDebut } : {}),
      };
      await logementsApi.create(dto);
      toast.current?.show({ severity: 'success', summary: 'Logement créé', life: 3000 });
      closeModal();
      loadData();
    } catch (err) {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: extractError(err, 'Impossible de créer le logement.'), life: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  });

  // ── Soumission occuper ─────────────────────────────────────────────────────
  const onOccSubmit = occForm.handleSubmit(async (values) => {
    if (!occLogement) return;
    setOccSubmitting(true);
    try {
      await occupationsApi.create({
        logementId:  occLogement.id,
        locataireId: values.locataireId,
        dateDebut:   values.dateDebut,
      });
      toast.current?.show({ severity: 'success', summary: 'Occupation créée', life: 3000 });
      closeOccModal();
      loadData();
    } catch (err) {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: extractError(err, "Impossible de créer l'occupation."), life: 4000,
      });
    } finally {
      setOccSubmitting(false);
    }
  });

  // ── Soumission modifier ────────────────────────────────────────────────────
  const onEditSubmit = editForm.handleSubmit(async (values) => {
    if (!editing) return;
    setSubmitting(true);
    try {
      await logementsApi.update(editing.id, values);
      toast.current?.show({ severity: 'success', summary: 'Logement modifié', life: 3000 });
      closeModal();
      loadData();
    } catch (err) {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: extractError(err, 'Impossible de modifier le logement.'), life: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  });

  // ── Suppression ────────────────────────────────────────────────────────────
  function handleDelete(log: Logement) {
    showConfirm({
      header:      'Supprimer le logement',
      message:     `Supprimer « ${log.nom} » ? Cette action est irréversible.`,
      acceptLabel: 'Supprimer',
      onAccept:    async () => {
        setDeletingId(log.id);
        try {
          await logementsApi.delete(log.id);
          toast.current?.show({ severity: 'success', summary: 'Logement supprimé', life: 3000 });
          loadData();
        } catch (err) {
          toast.current?.show({
            severity: 'error', summary: 'Erreur',
            detail: extractError(err, 'Impossible de supprimer ce logement.'), life: 4000,
          });
        } finally {
          setDeletingId(null);
        }
      },
    });
  }

  // ── RBAC ───────────────────────────────────────────────────────────────────
  const canEdit      = role === Role.ADMIN_BATIMENT || role === Role.ADMIN_GLOBAL;
  const canDelete    = canEdit;
  const canManageOcc = role === Role.ADMIN_LOGEMENT || role === Role.ADMIN_BATIMENT || role === Role.ADMIN_GLOBAL;

  // ── Colonnes ───────────────────────────────────────────────────────────────
  function actionsBody(log: Logement) {
    const isOccupe = occMap.has(log.id);
    return (
      <div className="flex items-center gap-1">
        <Button
          icon="pi pi-chart-bar"
          rounded text
          tooltip="Dashboard"
          tooltipOptions={{ position: 'top' }}
          onClick={() => router.push(`/logements/${log.id}`)}
        />
        {canManageOcc && !isOccupe && (
          <Button
            icon="pi pi-user-plus"
            rounded text severity="success"
            tooltip="Occuper"
            tooltipOptions={{ position: 'top' }}
            onClick={() => openOccuper(log)}
          />
        )}
        {canEdit && (
          <Button
            icon="pi pi-pencil"
            rounded text severity="secondary"
            tooltip="Modifier"
            tooltipOptions={{ position: 'top' }}
            onClick={() => openEdit(log)}
          />
        )}
        {canDelete && (
          <Button
            icon="pi pi-trash"
            rounded text severity="danger"
            tooltip="Supprimer"
            tooltipOptions={{ position: 'top' }}
            loading={deletingId === log.id}
            onClick={() => handleDelete(log)}
          />
        )}
      </div>
    );
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Toast ref={toast} />

      <PageHeader
        title="Logements"
        breadcrumb={[{ label: 'Dashboard', path: '/' }, { label: 'Logements' }]}
        action={{
          label:   'Nouveau logement',
          icon:    'pi-plus',
          onClick: openCreate,
          visible: canEdit,
        }}
      />

      <div className="bg-white rounded-xl shadow-sm p-4">
        {/* Filtre global */}
        <div className="mb-4 relative max-w-sm">
          <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
          <InputText
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Rechercher (nom, bâtiment)…"
            className="w-full"
            style={{ paddingLeft: '2.25rem', paddingRight: globalFilter ? '2rem' : undefined }}
          />
          {globalFilter && (
            <button
              type="button"
              onClick={() => setGlobalFilter('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-gray-400 hover:text-gray-700 transition-colors"
            >
              <i className="pi pi-times text-lg" />
            </button>
          )}
        </div>

        <DataTableWrapper
          data={logements}
          loading={loading}
          error={error}
          onRetry={loadData}
          emptyMessage="Aucun logement enregistré."
          filterDisplay={undefined}
          globalFilter={globalFilter}
          globalFilterFields={['nom', 'batiment.nom']}
        >
          <Column field="nom" header="Nom" sortable />

          <Column
            header="Bâtiment"
            sortable sortField="batiment.nom"
            body={(l: Logement) =>
              l.batiment?.nom ?? <span className="text-gray-400 text-sm">—</span>
            }
          />

          <Column
            header="Loyer actuel"
            body={(l: Logement) => {
              if (!l.loyerActuel) return <span className="text-gray-400 text-sm">—</span>;
              return (
                <span className="text-sm font-medium">
                  {formatMontant(l.loyerActuel.montant)}
                  <span className="text-gray-400 ml-1">
                    / {labelPeriode(l.loyerActuel.periodeNombre, l.loyerActuel.periodeType)}
                  </span>
                </span>
              );
            }}
          />

          <Column
            header="Statut"
            body={(l: Logement) => <StatusBadge variant={occMap.has(l.id) ? 'occupe' : 'libre'} />}
            style={{ width: '110px' }}
          />

          <Column
            header="Locataire actuel"
            body={(l: Logement) => {
              const occ = occMap.get(l.id);
              if (!occ?.locataire) return <span className="text-gray-400 text-sm">—</span>;
              return <span className="text-sm">{occ.locataire.prenom} {occ.locataire.nom}</span>;
            }}
          />

          <Column
            header="Dernier jour couvert"
            body={(l: Logement) => {
              const occ = occMap.get(l.id);
              if (!occ) return <span className="text-gray-400 text-sm">—</span>;
              return <span className="text-sm">{formatDate(occ.dateDernierJourCouvert)}</span>;
            }}
            style={{ width: '170px' }}
          />

          <Column
            header="Actions"
            body={actionsBody}
            style={{ width: '130px', textAlign: 'center' }}
            exportable={false}
          />
        </DataTableWrapper>
      </div>

      {/* ── Modal Créer ────────────────────────────────────────────────────── */}
      <Dialog
        visible={modalMode === 'create'}
        onHide={closeModal}
        header="Nouveau logement"
        style={{ width: '520px' }}
        modal draggable={false} resizable={false}
        footer={
          <div className="flex justify-end gap-2">
            <Button label="Annuler" severity="secondary" outlined onClick={closeModal} disabled={submitting} />
            <Button
              label="Créer" icon="pi pi-check" loading={submitting}
              onClick={onCreateSubmit}
              style={{ backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }}
            />
          </div>
        }
      >
        <form onSubmit={onCreateSubmit} className="space-y-4 pt-2">
          {/* Bâtiment */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Bâtiment <span className="text-red-500">*</span>
            </label>
            <Controller name="batimentId" control={createForm.control} render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={batiments.map((b) => ({ label: b.nom, value: b.id }))}
                placeholder="Sélectionner un bâtiment"
                className={`w-full ${createForm.formState.errors.batimentId ? 'p-invalid' : ''}`}
                filter
                emptyMessage="Aucun bâtiment disponible"
              />
            )} />
            {createForm.formState.errors.batimentId && (
              <p className="text-xs text-[#991b1b] mt-1">{createForm.formState.errors.batimentId.message}</p>
            )}
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <Controller name="nom" control={createForm.control} render={({ field }) => (
              <InputText
                {...field}
                className={`w-full ${createForm.formState.errors.nom ? 'p-invalid' : ''}`}
                placeholder="Appartement A1"
              />
            )} />
            {createForm.formState.errors.nom && (
              <p className="text-xs text-[#991b1b] mt-1">{createForm.formState.errors.nom.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">Description</label>
            <Controller name="description" control={createForm.control} render={({ field }) => (
              <InputTextarea
                {...field} value={field.value ?? ''} rows={2}
                className="w-full" autoResize placeholder="Optionnel"
              />
            )} />
          </div>

          <hr className="border-gray-200" />
          <p className="text-sm font-semibold text-[#1e293b]">Loyer initial</p>

          {/* Montant + Durée */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-1">
                Montant <span className="text-red-500">*</span>
              </label>
              <Controller name="loyerMontant" control={createForm.control} render={({ field }) => (
                <InputNumber
                  value={field.value ?? null}
                  onValueChange={(e) => field.onChange(e.value)}
                  className={`w-full ${createForm.formState.errors.loyerMontant ? 'p-invalid' : ''}`}
                  placeholder="50000" min={1}
                />
              )} />
              {createForm.formState.errors.loyerMontant && (
                <p className="text-xs text-[#991b1b] mt-1">{createForm.formState.errors.loyerMontant.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-1">
                Durée période <span className="text-red-500">*</span>
              </label>
              <Controller name="loyerPeriodeNombre" control={createForm.control} render={({ field }) => (
                <InputNumber
                  value={field.value ?? null}
                  onValueChange={(e) => field.onChange(e.value)}
                  className={`w-full ${createForm.formState.errors.loyerPeriodeNombre ? 'p-invalid' : ''}`}
                  placeholder="1" min={1}
                />
              )} />
              {createForm.formState.errors.loyerPeriodeNombre && (
                <p className="text-xs text-[#991b1b] mt-1">{createForm.formState.errors.loyerPeriodeNombre.message}</p>
              )}
            </div>
          </div>

          {/* Type + Date début */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-1">
                Type de période <span className="text-red-500">*</span>
              </label>
              <Controller name="loyerPeriodeType" control={createForm.control} render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={PERIODE_OPTIONS}
                  placeholder="Sélectionner…"
                  className={`w-full ${createForm.formState.errors.loyerPeriodeType ? 'p-invalid' : ''}`}
                />
              )} />
              {createForm.formState.errors.loyerPeriodeType && (
                <p className="text-xs text-[#991b1b] mt-1">{createForm.formState.errors.loyerPeriodeType.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-1">Date début loyer</label>
              <Controller name="loyerDateDebut" control={createForm.control} render={({ field }) => (
                <Calendar
                  value={field.value ? new Date(field.value) : null}
                  onChange={(e) =>
                    field.onChange(e.value ? toDateStr(e.value as Date) : undefined)
                  }
                  dateFormat="dd/mm/yy"
                  className="w-full"
                  placeholder="Aujourd'hui si vide"
                  showIcon
                />
              )} />
            </div>
          </div>
        </form>
      </Dialog>

      {/* ── Modal Modifier ─────────────────────────────────────────────────── */}
      <Dialog
        visible={modalMode === 'edit'}
        onHide={closeModal}
        header={`Modifier « ${editing?.nom ?? ''} »`}
        style={{ width: '460px' }}
        modal draggable={false} resizable={false}
        footer={
          <div className="flex justify-end gap-2">
            <Button label="Annuler" severity="secondary" outlined onClick={closeModal} disabled={submitting} />
            <Button
              label="Enregistrer" icon="pi pi-check" loading={submitting}
              onClick={onEditSubmit}
              style={{ backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }}
            />
          </div>
        }
      >
        <form onSubmit={onEditSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <Controller name="nom" control={editForm.control} render={({ field }) => (
              <InputText
                {...field}
                className={`w-full ${editForm.formState.errors.nom ? 'p-invalid' : ''}`}
              />
            )} />
            {editForm.formState.errors.nom && (
              <p className="text-xs text-[#991b1b] mt-1">{editForm.formState.errors.nom.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">Description</label>
            <Controller name="description" control={editForm.control} render={({ field }) => (
              <InputTextarea
                {...field} value={field.value ?? ''} rows={3}
                className="w-full" autoResize
              />
            )} />
          </div>
        </form>
      </Dialog>

      {/* ── Modal Occuper ──────────────────────────────────────────────────── */}
      <Dialog
        visible={occModalOpen}
        onHide={closeOccModal}
        header={`Occuper « ${occLogement?.nom ?? ''} »`}
        style={{ width: '460px' }}
        modal draggable={false} resizable={false}
        footer={
          <div className="flex justify-end gap-2">
            <Button label="Annuler" severity="secondary" outlined onClick={closeOccModal} disabled={occSubmitting} />
            <Button
              label="Créer l'occupation" icon="pi pi-check" loading={occSubmitting}
              onClick={onOccSubmit}
              style={{ backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }}
            />
          </div>
        }
      >
        <form onSubmit={onOccSubmit} className="space-y-4 pt-2">
          {/* Logement (lecture seule) */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">Logement</label>
            <InputText value={occLogement?.nom ?? ''} className="w-full" readOnly disabled />
          </div>

          {/* Locataire */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Locataire <span className="text-red-500">*</span>
            </label>
            <Controller name="locataireId" control={occForm.control} render={({ field }) => (
              <Dropdown
                value={field.value ?? null}
                onChange={(e) => field.onChange(e.value)}
                options={locataires.filter((l) => l.libre).map((l) => ({ label: `${l.prenom} ${l.nom}`, value: l.id }))}
                placeholder="Sélectionner un locataire libre"
                className={`w-full ${occForm.formState.errors.locataireId ? 'p-invalid' : ''}`}
                filter
                emptyMessage="Aucun locataire libre"
              />
            )} />
            {occForm.formState.errors.locataireId && (
              <p className="text-xs text-[#991b1b] mt-1">{occForm.formState.errors.locataireId.message}</p>
            )}
          </div>

          {/* Date début */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Date de début <span className="text-red-500">*</span>
            </label>
            <Controller name="dateDebut" control={occForm.control} render={({ field }) => (
              <Calendar
                value={field.value ? new Date(field.value) : null}
                onChange={(e) => field.onChange(e.value ? toDateStr(e.value as Date) : '')}
                dateFormat="dd/mm/yy"
                className={`w-full ${occForm.formState.errors.dateDebut ? 'p-invalid' : ''}`}
                placeholder="Sélectionner une date"
                showIcon
              />
            )} />
            {occForm.formState.errors.dateDebut && (
              <p className="text-xs text-[#991b1b] mt-1">{occForm.formState.errors.dateDebut.message}</p>
            )}
          </div>
        </form>
      </Dialog>
    </>
  );
}
