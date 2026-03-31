'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { SelectButton } from 'primereact/selectbutton';
import { Toast } from 'primereact/toast';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';

import { occupationsApi } from '@/services/occupations.api';
import { logementsApi } from '@/services/logements.api';
import { locatairesApi } from '@/services/locataires.api';
import type { Occupation } from '@/types/occupation';
import type { Logement } from '@/types/logement';
import type { Locataire } from '@/types/locataire';
import type { Arriere } from '@/types/arriere';
import { Role } from '@/types/enums';
import { useAppSelector } from '@/store/hooks';

import PageHeader from '@/components/shared/PageHeader';
import DataTableWrapper from '@/components/shared/DataTableWrapper';
import StatusBadge from '@/components/shared/StatusBadge';
import { showConfirm } from '@/components/shared/ConfirmDialog';
import FileUploader from '@/components/shared/FileUploader';

// ─── Schémas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  logementId:  z.number({ message: 'Sélectionnez un logement' }),
  locataireId: z.number({ message: 'Sélectionnez un locataire' }),
  dateDebut:   z.string().min(1, 'La date de début est obligatoire'),
});

const editSchema = z.object({
  locataireId: z.number().nullable().optional(),
  dateDebut:   z.string().optional(),
});

const finSchema = z.object({
  dateFin: z.string().min(1, 'La date de fin est obligatoire'),
});

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues   = z.infer<typeof editSchema>;
type FinFormValues    = z.infer<typeof finSchema>;

// ─── Constantes ───────────────────────────────────────────────────────────────

const TAB_OPTIONS = [
  { label: 'En cours',  value: 'active'     },
  { label: 'Terminées', value: 'terminated' },
  { label: 'Toutes',    value: 'all'        },
];

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function formatDate(val: string): string {
  return new Date(val).toLocaleDateString('fr-FR');
}

function formatMontant(val: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'XAF', maximumFractionDigits: 0,
  }).format(val);
}

function extractError(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) return err.response?.data?.message ?? fallback;
  return fallback;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OccupationsPage() {
  const toast = useRef<Toast>(null);
  const role  = useAppSelector((s) => s.auth.user?.role);

  // ── Données ─────────────────────────────────────────────────────────────────
  const [activeOccs,     setActiveOccs]     = useState<Occupation[] | null>(null);
  const [terminatedOccs, setTerminatedOccs] = useState<Occupation[] | null>(null);
  const [logements,      setLogements]      = useState<Logement[]>([]);
  const [locataires,     setLocataires]     = useState<Locataire[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [loadingTab,     setLoadingTab]     = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  // ── UI ──────────────────────────────────────────────────────────────────────
  const [tab,              setTab]              = useState<'active' | 'terminated' | 'all'>('active');
  const [globalFilter,     setGlobalFilter]     = useState('');
  const [modalMode,        setModalMode]        = useState<null | 'create' | 'edit' | 'fin' | 'contrat' | 'arrieres'>(null);
  const [selectedOcc,      setSelectedOcc]      = useState<Occupation | null>(null);
  const [arrieres,         setArrieres]         = useState<Arriere | null | 'loading'>('loading');
  const [contratFiles,     setContratFiles]     = useState<File[]>([]);
  const [submitting,       setSubmitting]       = useState(false);
  const [uploadingContrat, setUploadingContrat] = useState(false);
  const [deletingId,       setDeletingId]       = useState<number | null>(null);

  // ── Formulaires ─────────────────────────────────────────────────────────────
  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { logementId: undefined, locataireId: undefined, dateDebut: '' },
  });

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { locataireId: null, dateDebut: '' },
  });

  const finForm = useForm<FinFormValues>({
    resolver: zodResolver(finSchema),
    defaultValues: { dateFin: '' },
  });

  // ── Données dérivées ────────────────────────────────────────────────────────
  const displayedOccs = useMemo(() => {
    if (tab === 'active')     return activeOccs;
    if (tab === 'terminated') return terminatedOccs;
    if (activeOccs !== null && terminatedOccs !== null) return [...activeOccs, ...terminatedOccs];
    return activeOccs ?? terminatedOccs;
  }, [tab, activeOccs, terminatedOccs]);

  const freeLogements = useMemo(() => {
    if (!activeOccs) return logements;
    const occupiedIds = new Set(activeOccs.map((o) => o.logementId));
    return logements.filter((l) => !occupiedIds.has(l.id));
  }, [logements, activeOccs]);

  // Tous les locataires sont proposés à la création (un locataire peut occuper plusieurs logements)

  // ── Chargement initial ──────────────────────────────────────────────────────
  async function loadInitial() {
    setLoading(true);
    setError(null);
    try {
      const [occsRes, logsRes, locsRes] = await Promise.all([
        occupationsApi.getAll(0),
        logementsApi.getAll(),
        locatairesApi.getAll(),
      ]);
      setActiveOccs(occsRes.data.data);
      setLogements(logsRes.data.data);
      setLocataires(locsRes.data.data);
    } catch {
      setError('Impossible de charger les occupations.');
    } finally {
      setLoading(false);
    }
  }

  async function loadTerminated() {
    if (terminatedOccs !== null) return;
    setLoadingTab(true);
    try {
      const res = await occupationsApi.getAll(1);
      setTerminatedOccs(res.data.data);
    } catch {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: 'Impossible de charger les occupations terminées.', life: 4000,
      });
    } finally {
      setLoadingTab(false);
    }
  }

  useEffect(() => { loadInitial(); }, []);

  // ── Changement d'onglet ─────────────────────────────────────────────────────
  function handleTabChange(val: 'active' | 'terminated' | 'all') {
    setTab(val);
    if ((val === 'terminated' || val === 'all') && terminatedOccs === null) {
      loadTerminated();
    }
  }

  // ── Modals ──────────────────────────────────────────────────────────────────
  function openCreate() {
    createForm.reset({ logementId: undefined, locataireId: undefined, dateDebut: toDateStr(new Date()) });
    setModalMode('create');
  }

  function openEdit(occ: Occupation) {
    setSelectedOcc(occ);
    editForm.reset({ locataireId: occ.locataireId, dateDebut: occ.dateDebut });
    setModalMode('edit');
  }

  function openFin(occ: Occupation) {
    setSelectedOcc(occ);
    finForm.reset({ dateFin: '' });
    setModalMode('fin');
  }

  function openContrat(occ: Occupation) {
    setSelectedOcc(occ);
    setContratFiles([]);
    setModalMode('contrat');
  }

  async function openArrieres(occ: Occupation) {
    setSelectedOcc(occ);
    setArrieres('loading');
    setModalMode('arrieres');
    try {
      const res = await occupationsApi.getArrieres(occ.id);
      setArrieres(res.data.data);
    } catch {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: 'Impossible de charger les arriérés.', life: 4000,
      });
      setModalMode(null);
    }
  }

  function closeModal() {
    setModalMode(null);
    setSelectedOcc(null);
  }

  // ── Soumission — créer ──────────────────────────────────────────────────────
  const onCreateSubmit = createForm.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await occupationsApi.create({
        logementId:  values.logementId,
        locataireId: values.locataireId,
        dateDebut:   values.dateDebut,
      });
      toast.current?.show({ severity: 'success', summary: 'Occupation créée', life: 3000 });
      closeModal();
      const [occsRes, locsRes] = await Promise.all([
        occupationsApi.getAll(0),
        locatairesApi.getAll(),
      ]);
      setActiveOccs(occsRes.data.data);
      setLocataires(locsRes.data.data);
    } catch (err) {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: extractError(err, "Impossible de créer l'occupation."), life: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  });

  // ── Soumission — modifier ───────────────────────────────────────────────────
  const onEditSubmit = editForm.handleSubmit(async (values) => {
    if (!selectedOcc) return;
    setSubmitting(true);
    try {
      const dto: Record<string, unknown> = {};
      if (values.dateDebut)          dto.dateDebut   = values.dateDebut;
      if (values.locataireId != null) dto.locataireId = values.locataireId;
      await occupationsApi.update(selectedOcc.id, dto);
      toast.current?.show({ severity: 'success', summary: 'Occupation modifiée', life: 3000 });
      closeModal();
      const res = await occupationsApi.getAll(0);
      setActiveOccs(res.data.data);
    } catch (err) {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: extractError(err, "Impossible de modifier l'occupation."), life: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  });

  // ── Soumission — fin ────────────────────────────────────────────────────────
  const onFinSubmit = finForm.handleSubmit(async (values) => {
    if (!selectedOcc) return;
    setSubmitting(true);
    try {
      await occupationsApi.terminer(selectedOcc.id, { dateFin: values.dateFin });
      toast.current?.show({ severity: 'success', summary: 'Occupation terminée', life: 3000 });
      closeModal();
      const [occsRes, locsRes] = await Promise.all([
        occupationsApi.getAll(0),
        locatairesApi.getAll(),
      ]);
      setActiveOccs(occsRes.data.data);
      setLocataires(locsRes.data.data);
      setTerminatedOccs(null); // invalider le cache pour forcer le rechargement
    } catch (err) {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: extractError(err, "Impossible de terminer l'occupation."), life: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  });

  // ── Upload contrat ──────────────────────────────────────────────────────────
  async function handleContratUpload() {
    if (!selectedOcc || contratFiles.length === 0) return;
    setUploadingContrat(true);
    try {
      const res = await occupationsApi.uploadContrat(selectedOcc.id, contratFiles[0]);
      toast.current?.show({ severity: 'success', summary: 'Contrat uploadé', life: 3000 });
      const updated = res.data.data;
      setActiveOccs((prev) => prev?.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)) ?? prev);
      closeModal();
      setContratFiles([]);
    } catch (err) {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: extractError(err, "Impossible d'uploader le contrat."), life: 4000,
      });
    } finally {
      setUploadingContrat(false);
    }
  }

  // ── Télécharger contrat ─────────────────────────────────────────────────────
  async function downloadContrat(occ: Occupation) {
    try {
      const res = await occupationsApi.downloadContrat(occ.id);
      const url  = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href     = url;
      link.download = `contrat_occupation_${occ.id}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: 'Impossible de télécharger le contrat.', life: 4000,
      });
    }
  }

  // ── Suppression ─────────────────────────────────────────────────────────────
  function handleDelete(occ: Occupation) {
    const label = occ.locataire
      ? `${occ.locataire.prenom} ${occ.locataire.nom}`
      : `#${occ.id}`;
    showConfirm({
      header:      "Supprimer l'occupation",
      message:     `Supprimer l'occupation de « ${label} » ? Cette action est irréversible.`,
      acceptLabel: 'Supprimer',
      onAccept:    async () => {
        setDeletingId(occ.id);
        try {
          await occupationsApi.delete(occ.id);
          toast.current?.show({ severity: 'success', summary: 'Occupation supprimée', life: 3000 });
          setActiveOccs((prev)     => prev?.filter((o) => o.id !== occ.id) ?? prev);
          setTerminatedOccs((prev) => prev?.filter((o) => o.id !== occ.id) ?? prev);
        } catch (err) {
          toast.current?.show({
            severity: 'error', summary: 'Erreur',
            detail: extractError(err, 'Impossible de supprimer cette occupation.'), life: 4000,
          });
        } finally {
          setDeletingId(null);
        }
      },
    });
  }

  // ── RBAC ────────────────────────────────────────────────────────────────────
  const canManage = role === Role.ADMIN_LOGEMENT || role === Role.ADMIN_BATIMENT || role === Role.ADMIN_GLOBAL;

  // ── Colonnes ────────────────────────────────────────────────────────────────
  function actionsBody(occ: Occupation) {
    const isActive = !occ.dateFin;
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {isActive && (
          <Button
            icon="pi pi-exclamation-circle"
            rounded text severity="warning"
            tooltip="Voir les arriérés"
            tooltipOptions={{ position: 'top' }}
            onClick={() => openArrieres(occ)}
          />
        )}
        {canManage && isActive && (
          <>
            <Button
              icon="pi pi-pencil"
              rounded text severity="secondary"
              tooltip="Modifier"
              tooltipOptions={{ position: 'top' }}
              onClick={() => openEdit(occ)}
            />
            <Button
              icon="pi pi-stop-circle"
              rounded text severity="warning"
              tooltip="Mettre fin"
              tooltipOptions={{ position: 'top' }}
              onClick={() => openFin(occ)}
            />
            <Button
              icon="pi pi-upload"
              rounded text severity="info"
              tooltip="Upload contrat"
              tooltipOptions={{ position: 'top' }}
              onClick={() => openContrat(occ)}
            />
          </>
        )}
        {occ.contratFichierId && (
          <Button
            icon="pi pi-download"
            rounded text severity="info"
            tooltip="Télécharger contrat"
            tooltipOptions={{ position: 'top' }}
            onClick={() => downloadContrat(occ)}
          />
        )}
        {canManage && (
          <Button
            icon="pi pi-trash"
            rounded text severity="danger"
            tooltip="Supprimer"
            tooltipOptions={{ position: 'top' }}
            loading={deletingId === occ.id}
            onClick={() => handleDelete(occ)}
          />
        )}
      </div>
    );
  }

  // ── Rendu ───────────────────────────────────────────────────────────────────
  return (
    <>
      <Toast ref={toast} />

      <PageHeader
        title="Occupations"
        breadcrumb={[{ label: 'Dashboard', path: '/' }, { label: 'Occupations' }]}
        action={{
          label:   'Nouvelle occupation',
          icon:    'pi-plus',
          onClick: openCreate,
          visible: canManage,
        }}
      />

      <div className="bg-white rounded-xl shadow-sm p-4">
        {/* Barre outils : onglets + filtre */}
        <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
          <SelectButton
            value={tab}
            onChange={(e) => e.value && handleTabChange(e.value as 'active' | 'terminated' | 'all')}
            options={TAB_OPTIONS}
            optionLabel="label"
            optionValue="value"
          />
          <div className="relative max-w-sm w-full sm:w-auto">
            <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
            <InputText
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Rechercher (logement, locataire)…"
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
        </div>

        <DataTableWrapper
          data={displayedOccs}
          loading={loading || loadingTab}
          error={error}
          onRetry={loadInitial}
          emptyMessage="Aucune occupation."
          filterDisplay={undefined}
          globalFilter={globalFilter}
          globalFilterFields={['logement.nom', 'locataire.nom', 'locataire.prenom']}
        >
          <Column
            header="Logement"
            sortable sortField="logement.nom"
            body={(o: Occupation) => o.logement?.nom ?? <span className="text-gray-400 text-sm">—</span>}
          />
          <Column
            header="Locataire"
            sortable sortField="locataire.nom"
            body={(o: Occupation) =>
              o.locataire
                ? <span>{o.locataire.prenom} {o.locataire.nom}</span>
                : <span className="text-gray-400 text-sm">—</span>
            }
          />
          <Column
            field="dateDebut"
            header="Date début"
            sortable
            body={(o: Occupation) => formatDate(o.dateDebut)}
            style={{ width: '130px' }}
          />
          <Column
            header="Date fin"
            sortable sortField="dateFin"
            body={(o: Occupation) =>
              o.dateFin
                ? formatDate(o.dateFin)
                : <span className="text-gray-400 text-sm italic">En cours</span>
            }
            style={{ width: '130px' }}
          />
          <Column
            header="Statut"
            body={(o: Occupation) => <StatusBadge variant={o.dateFin ? 'termine' : 'actif'} />}
            style={{ width: '110px' }}
          />
          <Column
            header="Dernier jour couvert"
            sortable sortField="dateDernierJourCouvert"
            body={(o: Occupation) => {
              if (o.dateFin) return <span className="text-sm">{formatDate(o.dateDernierJourCouvert)}</span>;
              const today   = new Date();
              today.setHours(0, 0, 0, 0);
              const covered = new Date(o.dateDernierJourCouvert);
              const isLate  = covered < today;
              return (
                <span className={`text-sm font-medium ${isLate ? 'text-[#991b1b]' : 'text-[#166534]'}`}>
                  {formatDate(o.dateDernierJourCouvert)}
                </span>
              );
            }}
            style={{ width: '170px' }}
          />
          <Column
            header="Actions"
            body={actionsBody}
            style={{ width: '210px', textAlign: 'center' }}
            exportable={false}
          />
        </DataTableWrapper>
      </div>

      {/* ── Modal Créer ──────────────────────────────────────────────────────── */}
      <Dialog
        visible={modalMode === 'create'}
        onHide={closeModal}
        header="Nouvelle occupation"
        style={{ width: '480px' }}
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
          {/* Logement */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Logement <span className="text-red-500">*</span>
            </label>
            <Controller name="logementId" control={createForm.control} render={({ field }) => (
              <Dropdown
                value={field.value ?? null}
                onChange={(e) => field.onChange(e.value)}
                options={freeLogements.map((l) => ({ label: l.nom, value: l.id }))}
                placeholder="Sélectionner un logement libre"
                className={`w-full ${createForm.formState.errors.logementId ? 'p-invalid' : ''}`}
                filter
                emptyMessage="Aucun logement libre"
              />
            )} />
            {createForm.formState.errors.logementId && (
              <p className="text-xs text-[#991b1b] mt-1">{createForm.formState.errors.logementId.message}</p>
            )}
          </div>

          {/* Locataire */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Locataire <span className="text-red-500">*</span>
            </label>
            <Controller name="locataireId" control={createForm.control} render={({ field }) => (
              <Dropdown
                value={field.value ?? null}
                onChange={(e) => field.onChange(e.value)}
                options={locataires.map((l) => ({ label: `${l.prenom} ${l.nom}`, value: l.id }))}
                placeholder="Sélectionner un locataire"
                className={`w-full ${createForm.formState.errors.locataireId ? 'p-invalid' : ''}`}
                filter
                emptyMessage="Aucun locataire disponible"
              />
            )} />
            {createForm.formState.errors.locataireId && (
              <p className="text-xs text-[#991b1b] mt-1">{createForm.formState.errors.locataireId.message}</p>
            )}
          </div>

          {/* Date début */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Date de début <span className="text-red-500">*</span>
            </label>
            <Controller name="dateDebut" control={createForm.control} render={({ field }) => (
              <Calendar
                value={field.value ? new Date(field.value) : null}
                onChange={(e) => field.onChange(e.value ? toDateStr(e.value as Date) : '')}
                dateFormat="dd/mm/yy"
                className={`w-full ${createForm.formState.errors.dateDebut ? 'p-invalid' : ''}`}
                placeholder="Sélectionner une date"
                showIcon
              />
            )} />
            {createForm.formState.errors.dateDebut && (
              <p className="text-xs text-[#991b1b] mt-1">{createForm.formState.errors.dateDebut.message}</p>
            )}
          </div>
        </form>
      </Dialog>

      {/* ── Modal Modifier ───────────────────────────────────────────────────── */}
      <Dialog
        visible={modalMode === 'edit'}
        onHide={closeModal}
        header="Modifier l'occupation"
        style={{ width: '480px' }}
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
          {/* Locataire */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">Locataire</label>
            <Controller name="locataireId" control={editForm.control} render={({ field }) => (
              <Dropdown
                value={field.value ?? null}
                onChange={(e) => field.onChange(e.value ?? null)}
                options={locataires.map((l) => ({ label: `${l.prenom} ${l.nom}`, value: l.id }))}
                placeholder="Sélectionner un locataire"
                className="w-full"
                filter
                emptyMessage="Aucun locataire disponible"
              />
            )} />
          </div>

          {/* Date début */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">Date de début</label>
            <Controller name="dateDebut" control={editForm.control} render={({ field }) => (
              <Calendar
                value={field.value ? new Date(field.value) : null}
                onChange={(e) => field.onChange(e.value ? toDateStr(e.value as Date) : '')}
                dateFormat="dd/mm/yy"
                className="w-full"
                placeholder="Sélectionner une date"
                showIcon
              />
            )} />
          </div>
        </form>
      </Dialog>

      {/* ── Modal Mettre fin ─────────────────────────────────────────────────── */}
      <Dialog
        visible={modalMode === 'fin'}
        onHide={closeModal}
        header="Mettre fin à l'occupation"
        style={{ width: '400px' }}
        modal draggable={false} resizable={false}
        footer={
          <div className="flex justify-end gap-2">
            <Button label="Annuler" severity="secondary" outlined onClick={closeModal} disabled={submitting} />
            <Button
              label="Confirmer" icon="pi pi-check" loading={submitting}
              onClick={onFinSubmit}
              severity="warning"
            />
          </div>
        }
      >
        <form onSubmit={onFinSubmit} className="pt-2">
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Date de fin <span className="text-red-500">*</span>
            </label>
            <Controller name="dateFin" control={finForm.control} render={({ field }) => (
              <Calendar
                value={field.value ? new Date(field.value) : null}
                onChange={(e) => field.onChange(e.value ? toDateStr(e.value as Date) : '')}
                dateFormat="dd/mm/yy"
                className={`w-full ${finForm.formState.errors.dateFin ? 'p-invalid' : ''}`}
                placeholder="Sélectionner une date"
                showIcon
              />
            )} />
            {finForm.formState.errors.dateFin && (
              <p className="text-xs text-[#991b1b] mt-1">{finForm.formState.errors.dateFin.message}</p>
            )}
          </div>
        </form>
      </Dialog>

      {/* ── Modal Upload contrat ──────────────────────────────────────────────── */}
      <Dialog
        visible={modalMode === 'contrat'}
        onHide={closeModal}
        header="Upload contrat de bail"
        style={{ width: '480px' }}
        modal draggable={false} resizable={false}
        footer={
          <div className="flex justify-end gap-2">
            <Button label="Annuler" severity="secondary" outlined onClick={closeModal} disabled={uploadingContrat} />
            <Button
              label="Uploader" icon="pi pi-upload" loading={uploadingContrat}
              disabled={contratFiles.length === 0}
              onClick={handleContratUpload}
              style={{ backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }}
            />
          </div>
        }
      >
        <div className="pt-2">
          {selectedOcc?.contratFichierId && (
            <div className="mb-4 p-3 bg-[#fef3c7] border border-yellow-300 rounded-lg text-sm text-[#92400e] flex items-center gap-2">
              <i className="pi pi-info-circle" />
              Un contrat existe déjà. L'uploader remplacera l'ancien.
            </div>
          )}
          <FileUploader
            uploadType="contrat"
            onFilesSelected={setContratFiles}
            disabled={uploadingContrat}
            existingFiles={
              selectedOcc?.contratFichier
                ? [{ nomOriginal: selectedOcc.contratFichier.nomOriginal, taille: selectedOcc.contratFichier.taille }]
                : []
            }
          />
        </div>
      </Dialog>

      {/* ── Modal Arriérés ────────────────────────────────────────────────────── */}
      <Dialog
        visible={modalMode === 'arrieres'}
        onHide={closeModal}
        header={
          selectedOcc?.locataire
            ? `Arriérés — ${selectedOcc.locataire.prenom} ${selectedOcc.locataire.nom}`
            : `Arriérés — Occupation #${selectedOcc?.id ?? ''}`
        }
        style={{ width: '460px' }}
        modal draggable={false} resizable={false}
        footer={
          <div className="flex justify-end">
            <Button label="Fermer" severity="secondary" outlined onClick={closeModal} />
          </div>
        }
      >
        <div className="pt-2">
          {arrieres === 'loading' ? (
            <div className="flex justify-center py-6">
              <i className="pi pi-spin pi-spinner text-2xl text-[#3b82f6]" />
            </div>
          ) : arrieres === null ? (
            <div className="flex items-center gap-3 bg-[#dcfce7] border border-green-200 rounded-xl p-4">
              <i className="pi pi-check-circle text-[#166534] text-lg" />
              <p className="text-sm font-semibold text-[#166534]">Aucun arriéré — locataire à jour</p>
            </div>
          ) : (
            <div className="bg-[#fee2e2] border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <i className="pi pi-exclamation-triangle text-[#991b1b] mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#991b1b]">
                    Arriéré : {formatMontant(arrieres.montantDu)}
                  </p>
                  <p className="text-xs text-[#991b1b] mt-1">
                    Période : {formatDate(arrieres.debutPeriodeDue)} → {formatDate(arrieres.finPeriodeDue)}
                  </p>
                  <p className="text-xs text-[#991b1b] mt-0.5">
                    {arrieres.nombreLoyersDu} loyer{arrieres.nombreLoyersDu > 1 ? 's' : ''} dû{arrieres.nombreLoyersDu > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}
