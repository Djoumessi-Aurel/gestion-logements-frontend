'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { SelectButton } from 'primereact/selectbutton';
import { Toast } from 'primereact/toast';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import type { DataTablePageEvent } from 'primereact/datatable';

import { paiementsApi } from '@/services/paiements.api';
import { occupationsApi } from '@/services/occupations.api';
import { logementsApi } from '@/services/logements.api';
import type { Paiement } from '@/types/paiement';
import type { Occupation } from '@/types/occupation';
import type { Logement } from '@/types/logement';
import { Role } from '@/types/enums';
import { useAppSelector } from '@/store/hooks';

import PageHeader from '@/components/shared/PageHeader';
import DataTableWrapper from '@/components/shared/DataTableWrapper';
import { showConfirm } from '@/components/shared/ConfirmDialog';
import FileUploader from '@/components/shared/FileUploader';
import PaiementFormDialog from '@/components/shared/PaiementFormDialog';

// ─── Schéma édition ───────────────────────────────────────────────────────────

const editSchema = z.object({
  datePaiement: z.string().optional(),
  commentaire:  z.string().optional(),
  montantPaye:  z.number().positive('Le montant doit être > 0').optional(),
  finPeriode:   z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function mimeIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'pi pi-file-pdf';
  if (mimeType.startsWith('image/'))  return 'pi pi-image';
  return 'pi pi-file';
}

const PREUVES_OPTIONS = [
  { label: 'Ajouter',       value: 'add'     },
  { label: 'Remplacer tout', value: 'replace' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PaiementsPage() {
  const toast = useRef<Toast>(null);
  const role  = useAppSelector((s) => s.auth.user?.role);

  // ── État données ────────────────────────────────────────────────────────────
  const [paiements,   setPaiements]   = useState<Paiement[]>([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [pageSize,    setPageSize]    = useState(20);
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [logements,   setLogements]   = useState<Logement[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  // ── État UI ─────────────────────────────────────────────────────────────────
  const [modalMode,        setModalMode]        = useState<null | 'create' | 'edit' | 'preuves'>(null);
  const [selectedPaiement, setSelectedPaiement] = useState<Paiement | null>(null);
  const [submitting,       setSubmitting]       = useState(false);
  const [deletingId,       setDeletingId]       = useState<number | null>(null);
  const [preuveFiles,      setPreuveFiles]      = useState<File[]>([]);
  const [preuveMode,       setPreuveMode]       = useState<'add' | 'replace'>('add');
  const [uploadingPreuves, setUploadingPreuves] = useState(false);

  // ── Formulaire édition ──────────────────────────────────────────────────────
  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { datePaiement: '', commentaire: '', montantPaye: undefined, finPeriode: '' },
  });

  const [globalFilter, setGlobalFilter] = useState('');

  // ── Filtrage client (sur la page courante) ───────────────────────────────────
  const filteredPaiements = useMemo(() => {
    const q = globalFilter.trim().toLowerCase();
    if (!q) return paiements;
    return paiements.filter((p) => {
      const logNom    = p.occupation?.logement?.nom?.toLowerCase()     ?? '';
      const locNom    = p.occupation?.locataire?.nom?.toLowerCase()    ?? '';
      const locPrenom = p.occupation?.locataire?.prenom?.toLowerCase() ?? '';
      return logNom.includes(q) || locNom.includes(q) || locPrenom.includes(q);
    });
  }, [paiements, globalFilter]);

  // ── Chargement ──────────────────────────────────────────────────────────────
  async function loadPaiements(p = page, limit = pageSize) {
    setLoading(true);
    setError(null);
    try {
      const res = await paiementsApi.getAll({ page: p, limit, includeRelations: true });
      setPaiements(res.data.data);
      setTotal(res.data.meta.total);
    } catch {
      setError('Impossible de charger les paiements.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const [paiRes, occRes, logRes] = await Promise.all([
          paiementsApi.getAll({ page: 1, limit: pageSize, includeRelations: true }),
          occupationsApi.getAll(0), // Occupations en cours uniquement
          logementsApi.getAll({ includeLoyer: true }),
        ]);
        setPaiements(paiRes.data.data);
        setTotal(paiRes.data.meta.total);
        setOccupations(occRes.data.data);
        setLogements(logRes.data.data);
      } catch {
        setError('Impossible de charger les données.');
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pagination serveur ──────────────────────────────────────────────────────
  function handlePage(e: DataTablePageEvent) {
    const newPage  = Math.floor(e.first / e.rows) + 1;
    const newLimit = e.rows;
    setPage(newPage);
    setPageSize(newLimit);
    loadPaiements(newPage, newLimit);
  }

  // ── Modals ──────────────────────────────────────────────────────────────────
  function openEdit(p: Paiement) {
    setSelectedPaiement(p);
    editForm.reset({
      datePaiement: p.datePaiement,
      commentaire:  p.commentaire ?? '',
      montantPaye:  Number(p.montantPaye),
      finPeriode:   p.finPeriode,
    });
    setModalMode('edit');
  }

  function openPreuves(p: Paiement) {
    setSelectedPaiement(p);
    setPreuveFiles([]);
    setPreuveMode('add');
    setModalMode('preuves');
  }

  function closeModal() {
    setModalMode(null);
    setSelectedPaiement(null);
  }

  // ── Soumission — édition ────────────────────────────────────────────────────
  const onEditSubmit = editForm.handleSubmit(async (values) => {
    if (!selectedPaiement) return;
    setSubmitting(true);
    try {
      const dto: Record<string, unknown> = {};
      if (values.datePaiement)           dto.datePaiement = values.datePaiement;
      if (values.commentaire !== undefined) dto.commentaire = values.commentaire;
      if (values.montantPaye !== undefined) dto.montantPaye = values.montantPaye;
      if (values.finPeriode)             dto.finPeriode   = values.finPeriode;
      await paiementsApi.update(selectedPaiement.id, dto as EditFormValues);
      toast.current?.show({ severity: 'success', summary: 'Paiement modifié', life: 3000 });
      closeModal();
      await loadPaiements();
    } catch (err) {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: extractError(err, 'Impossible de modifier ce paiement.'), life: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  });

  // ── Suppression ─────────────────────────────────────────────────────────────
  function handleDelete(p: Paiement) {
    showConfirm({
      header:      'Supprimer le paiement',
      message:     `Supprimer le paiement du ${formatDate(p.datePaiement)} (${formatMontant(p.montantPaye)}) ? Cette action est irréversible.`,
      acceptLabel: 'Supprimer',
      onAccept:    async () => {
        setDeletingId(p.id);
        try {
          await paiementsApi.delete(p.id);
          toast.current?.show({ severity: 'success', summary: 'Paiement supprimé', life: 3000 });
          await loadPaiements();
        } catch (err) {
          toast.current?.show({
            severity: 'error', summary: 'Erreur',
            detail: extractError(err, 'Impossible de supprimer ce paiement.'), life: 4000,
          });
        } finally {
          setDeletingId(null);
        }
      },
    });
  }

  // ── Upload preuves ──────────────────────────────────────────────────────────
  async function handlePreuvesUpload() {
    if (!selectedPaiement || preuveFiles.length === 0) return;
    setUploadingPreuves(true);
    try {
      if (preuveMode === 'add') {
        await paiementsApi.addPreuves(selectedPaiement.id, preuveFiles);
      } else {
        await paiementsApi.replacePreuves(selectedPaiement.id, preuveFiles);
      }
      toast.current?.show({ severity: 'success', summary: 'Preuves uploadées', life: 3000 });
      closeModal();
      await loadPaiements();
    } catch (err) {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: extractError(err, "Impossible d'uploader les preuves."), life: 4000,
      });
    } finally {
      setUploadingPreuves(false);
    }
  }

  // ── RBAC ────────────────────────────────────────────────────────────────────
  const canManage = role === Role.ADMIN_LOGEMENT || role === Role.ADMIN_BATIMENT || role === Role.ADMIN_GLOBAL;

  // ── Colonnes ────────────────────────────────────────────────────────────────
  function actionsBody(p: Paiement) {
    const occActive = !p.occupation?.dateFin;
    return (
      <div className="flex items-center gap-1">
        {canManage && occActive && (
          <Button
            icon="pi pi-pencil"
            rounded text severity="secondary"
            tooltip="Modifier"
            tooltipOptions={{ position: 'top' }}
            onClick={() => openEdit(p)}
          />
        )}
        {canManage && (
          <Button
            icon="pi pi-file"
            rounded text severity="info"
            tooltip="Preuves"
            tooltipOptions={{ position: 'top' }}
            onClick={() => openPreuves(p)}
          />
        )}
        {canManage && occActive && (
          <Button
            icon="pi pi-trash"
            rounded text severity="danger"
            tooltip="Supprimer"
            tooltipOptions={{ position: 'top' }}
            loading={deletingId === p.id}
            onClick={() => handleDelete(p)}
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
        title="Paiements"
        breadcrumb={[{ label: 'Dashboard', path: '/' }, { label: 'Paiements' }]}
        action={{
          label:   'Nouveau paiement',
          icon:    'pi-plus',
          onClick: () => setModalMode('create'),
          visible: canManage,
        }}
      />

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex justify-end mb-3">
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
          data={filteredPaiements}
          loading={loading}
          error={error}
          onRetry={() => loadPaiements()}
          emptyMessage="Aucun paiement enregistré."
          filterDisplay={undefined}
          lazy
          totalRecords={total}
          first={(page - 1) * pageSize}
          rows={pageSize}
          rowsPerPageOptions={[10, 20, 50]}
          onPage={handlePage}
        >
          <Column
            header="Logement"
            sortable={false}
            body={(p: Paiement) =>
              p.occupation?.logement?.nom
                ?? <span className="text-gray-400 text-sm">Occ. #{p.occupationId}</span>
            }
          />
          <Column
            header="Locataire"
            sortable={false}
            body={(p: Paiement) =>
              p.occupation?.locataire
                ? <span>{p.occupation.locataire.prenom} {p.occupation.locataire.nom}</span>
                : <span className="text-gray-400 text-sm">—</span>
            }
          />
          <Column
            header="Période"
            sortable={false}
            body={(p: Paiement) => (
              <span className="text-sm whitespace-nowrap">
                {formatDate(p.debutPeriode)} → {formatDate(p.finPeriode)}
              </span>
            )}
            style={{ width: '210px' }}
          />
          <Column
            header="Montant"
            field="montantPaye"
            sortable={false}
            body={(p: Paiement) => <strong>{formatMontant(p.montantPaye)}</strong>}
            style={{ width: '150px' }}
          />
          <Column
            header="Nb loyers"
            sortable={false}
            body={(p: Paiement) =>
              p.nombreDeLoyers != null
                ? p.nombreDeLoyers
                : <span className="text-gray-400 text-sm">—</span>
            }
            style={{ width: '90px', textAlign: 'center' }}
          />
          <Column
            header="Date paiement"
            sortable={false}
            body={(p: Paiement) => formatDate(p.datePaiement)}
            style={{ width: '130px' }}
          />
          <Column
            header="Preuves"
            sortable={false}
            body={(p: Paiement) => (
              p.preuves?.length
                ? <span className="text-xs text-[#166534] font-medium">{p.preuves.length} fichier{p.preuves.length > 1 ? 's' : ''}</span>
                : <span className="text-xs text-gray-400">Aucune</span>
            )}
            style={{ width: '90px' }}
          />
          <Column
            header="Actions"
            body={actionsBody}
            style={{ width: '120px', textAlign: 'center' }}
            exportable={false}
          />
        </DataTableWrapper>
      </div>

      {/* ── Modal Créer (PaiementFormDialog) ─────────────────────────────────── */}
      <PaiementFormDialog
        visible={modalMode === 'create'}
        onHide={closeModal}
        occupations={occupations}
        logements={logements}
        toast={toast}
        onSuccess={async () => {
          const [paiRes, occRes] = await Promise.all([
            paiementsApi.getAll({ page: 1, limit: pageSize, includeRelations: true }),
            occupationsApi.getAll(0),
          ]);
          setPaiements(paiRes.data.data);
          setTotal(paiRes.data.meta.total);
          setOccupations(occRes.data.data);
          setPage(1);
        }}
      />

      {/* ── Modal Modifier ───────────────────────────────────────────────────── */}
      <Dialog
        visible={modalMode === 'edit'}
        onHide={closeModal}
        header="Modifier le paiement"
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
          {/* Date paiement */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">Date de paiement</label>
            <Controller name="datePaiement" control={editForm.control} render={({ field }) => (
              <Calendar
                value={field.value ? new Date(field.value) : null}
                onChange={(e) => field.onChange(e.value ? toDateStr(e.value as Date) : '')}
                dateFormat="dd/mm/yy"
                className="w-full"
                showIcon
              />
            )} />
          </div>

          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">Montant payé (XAF)</label>
            <Controller name="montantPaye" control={editForm.control} render={({ field }) => (
              <InputNumber
                value={field.value ?? null}
                onValueChange={(e) => field.onChange(e.value ?? undefined)}
                mode="decimal" minFractionDigits={0} maxFractionDigits={0} min={0}
                inputClassName={`w-full ${editForm.formState.errors.montantPaye ? 'p-invalid' : ''}`}
                className="w-full"
              />
            )} />
            {editForm.formState.errors.montantPaye && (
              <p className="text-xs text-[#991b1b] mt-1">{editForm.formState.errors.montantPaye.message}</p>
            )}
          </div>

          {/* Fin de période */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">Fin de période</label>
            <Controller name="finPeriode" control={editForm.control} render={({ field }) => (
              <Calendar
                value={field.value ? new Date(field.value) : null}
                onChange={(e) => field.onChange(e.value ? toDateStr(e.value as Date) : '')}
                dateFormat="dd/mm/yy"
                className="w-full"
                showIcon
              />
            )} />
          </div>

          {/* Commentaire */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">Commentaire</label>
            <Controller name="commentaire" control={editForm.control} render={({ field }) => (
              <InputTextarea
                {...field}
                value={field.value ?? ''}
                rows={2}
                className="w-full"
                autoResize
              />
            )} />
          </div>
        </form>
      </Dialog>

      {/* ── Modal Preuves ────────────────────────────────────────────────────── */}
      <Dialog
        visible={modalMode === 'preuves'}
        onHide={closeModal}
        header="Preuves de paiement"
        style={{ width: '520px' }}
        modal draggable={false} resizable={false}
        footer={
          <div className="flex justify-end gap-2">
            <Button label="Fermer" severity="secondary" outlined onClick={closeModal} disabled={uploadingPreuves} />
            {canManage && (
              <Button
                label="Uploader" icon="pi pi-upload" loading={uploadingPreuves}
                disabled={preuveFiles.length === 0}
                onClick={handlePreuvesUpload}
                style={{ backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }}
              />
            )}
          </div>
        }
      >
        <div className="space-y-5 pt-2">

          {/* ── Fichiers existants ── */}
          {(selectedPaiement?.preuves?.length ?? 0) > 0 ? (
            <div>
              <p className="text-sm font-medium text-[#1e293b] mb-2">
                Fichiers enregistrés ({selectedPaiement!.preuves!.length})
              </p>
              <ul className="space-y-2">
                {selectedPaiement!.preuves!.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <i className={`${mimeIcon(f.mimeType)} text-[#1e3a8a] text-lg shrink-0`} />
                    <span className="text-sm text-[#1e293b] truncate flex-1">{f.nomOriginal}</span>
                    <span className="text-xs text-gray-400 shrink-0">{formatSize(f.taille)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Aucune preuve enregistrée pour ce paiement.</p>
          )}

          {/* ── Upload (admins uniquement) ── */}
          {canManage && (
            <div>
              {(selectedPaiement?.preuves?.length ?? 0) > 0 && (
                <div className="flex justify-center mb-3">
                  <SelectButton
                    value={preuveMode}
                    onChange={(e) => e.value && setPreuveMode(e.value)}
                    options={PREUVES_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                  />
                </div>
              )}
              <FileUploader
                uploadType="preuve"
                onFilesSelected={setPreuveFiles}
                disabled={uploadingPreuves}
              />
            </div>
          )}

        </div>
      </Dialog>
    </>
  );
}
