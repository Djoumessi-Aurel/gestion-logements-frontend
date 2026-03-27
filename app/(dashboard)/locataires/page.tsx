'use client';

import { useEffect, useState, useRef } from 'react';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';

import { locatairesApi } from '@/services/locataires.api';
import { occupationsApi } from '@/services/occupations.api';
import { usersApi } from '@/services/users.api';
import type { Locataire } from '@/types/locataire';
import type { Occupation } from '@/types/occupation';
import type { Utilisateur } from '@/types/utilisateur';
import { Role } from '@/types/enums';
import { useAppSelector } from '@/store/hooks';

import PageHeader from '@/components/shared/PageHeader';
import DataTableWrapper from '@/components/shared/DataTableWrapper';
import StatusBadge from '@/components/shared/StatusBadge';
import { showConfirm } from '@/components/shared/ConfirmDialog';

// ─── Schémas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  nom:           z.string().min(1, 'Le nom est obligatoire'),
  prenom:        z.string().min(1, 'Le prénom est obligatoire'),
  telephone:     z.string().min(1, 'Le téléphone est obligatoire'),
  email:         z.string().email('Email invalide').optional().or(z.literal('')),
  utilisateurId: z.number().optional(),
});

const editSchema = z.object({
  nom:           z.string().min(1, 'Le nom est obligatoire'),
  prenom:        z.string().min(1, 'Le prénom est obligatoire'),
  telephone:     z.string().min(1, 'Le téléphone est obligatoire'),
  email:         z.string().email('Email invalide').optional().or(z.literal('')),
  utilisateurId: z.number().optional(),
});

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues   = z.infer<typeof editSchema>;

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function formatDate(val: string): string {
  return new Date(val).toLocaleDateString('fr-FR');
}

function isDatePast(dateStr: string): boolean {
  return new Date(dateStr) < new Date(new Date().toDateString());
}

function extractError(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) return err.response?.data?.message ?? fallback;
  return fallback;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LocatairesPage() {
  const router = useRouter();
  const toast  = useRef<Toast>(null);
  const role   = useAppSelector((s) => s.auth.user?.role);

  // ── État ───────────────────────────────────────────────────────────────────
  const [locataires,    setLocataires]    = useState<Locataire[] | null>(null);
  const [occMap,        setOccMap]        = useState<Map<number, Occupation>>(new Map());
  const [usersLoc,      setUsersLoc]      = useState<Utilisateur[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [globalFilter,  setGlobalFilter]  = useState('');
  const [modalMode,     setModalMode]     = useState<'create' | 'edit' | null>(null);
  const [editing,       setEditing]       = useState<Locataire | null>(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [deletingId,    setDeletingId]    = useState<number | null>(null);

  // ── Formulaires ────────────────────────────────────────────────────────────
  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { nom: '', prenom: '', telephone: '', email: '', utilisateurId: undefined },
  });

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { nom: '', prenom: '', telephone: '', email: '', utilisateurId: undefined },
  });

  // ── Chargement ─────────────────────────────────────────────────────────────
  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [locsRes, occsRes, usersRes] = await Promise.all([
        locatairesApi.getAll(),
        occupationsApi.getAll(0), // uniquement les occupations en cours
        usersApi.getAll(),
      ]);

      setLocataires(locsRes.data.data);

      const map = new Map<number, Occupation>();
      for (const occ of occsRes.data.data) map.set(occ.locataireId, occ);
      setOccMap(map);

      setUsersLoc(usersRes.data.data.filter((u) => u.role === Role.LOCATAIRE && u.isActive));
    } catch {
      setError('Impossible de charger les locataires.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  // ── Modal ──────────────────────────────────────────────────────────────────
  function openCreate() {
    createForm.reset({ nom: '', prenom: '', telephone: '', email: '', utilisateurId: undefined });
    setModalMode('create');
  }

  function openEdit(loc: Locataire) {
    setEditing(loc);
    editForm.reset({
      nom:           loc.nom,
      prenom:        loc.prenom,
      telephone:     loc.telephone,
      email:         loc.email ?? '',
      utilisateurId: loc.utilisateurId,
    });
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setEditing(null);
  }

  // ── Soumission créer ───────────────────────────────────────────────────────
  const onCreateSubmit = createForm.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await locatairesApi.create({
        nom:       values.nom,
        prenom:    values.prenom,
        telephone: values.telephone,
        ...(values.email         ? { email:         values.email         } : {}),
        ...(values.utilisateurId ? { utilisateurId: values.utilisateurId } : {}),
      });
      toast.current?.show({ severity: 'success', summary: 'Locataire créé', life: 3000 });
      closeModal();
      loadData();
    } catch (err) {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: extractError(err, 'Impossible de créer le locataire.'), life: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  });

  // ── Soumission modifier ────────────────────────────────────────────────────
  const onEditSubmit = editForm.handleSubmit(async (values) => {
    if (!editing) return;
    setSubmitting(true);
    try {
      await locatairesApi.update(editing.id, {
        nom:       values.nom,
        prenom:    values.prenom,
        telephone: values.telephone,
        ...(values.email         !== undefined ? { email:         values.email || undefined } : {}),
        ...(values.utilisateurId !== undefined ? { utilisateurId: values.utilisateurId     } : {}),
      });
      toast.current?.show({ severity: 'success', summary: 'Locataire modifié', life: 3000 });
      closeModal();
      loadData();
    } catch (err) {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: extractError(err, 'Impossible de modifier le locataire.'), life: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  });

  // ── Suppression ────────────────────────────────────────────────────────────
  function handleDelete(loc: Locataire) {
    showConfirm({
      header:      'Supprimer le locataire',
      message:     `Supprimer « ${loc.prenom} ${loc.nom} » ? Cette action est irréversible.`,
      acceptLabel: 'Supprimer',
      onAccept:    async () => {
        setDeletingId(loc.id);
        try {
          await locatairesApi.delete(loc.id);
          toast.current?.show({ severity: 'success', summary: 'Locataire supprimé', life: 3000 });
          loadData();
        } catch (err) {
          toast.current?.show({
            severity: 'error', summary: 'Erreur',
            detail: extractError(err, 'Impossible de supprimer ce locataire.'), life: 4000,
          });
        } finally {
          setDeletingId(null);
        }
      },
    });
  }

  // ── RBAC ───────────────────────────────────────────────────────────────────
  const canWrite = role !== Role.LOCATAIRE;

  // ── Colonnes ───────────────────────────────────────────────────────────────
  function statutBody(loc: Locataire) {
    return <StatusBadge variant={loc.libre ? 'libre' : 'occupe'} />;
  }

  function occupationBody(loc: Locataire) {
    const occ = occMap.get(loc.id);
    if (!occ) return <span className="text-gray-400 text-sm">—</span>;
    return (
      <span className="text-sm">
        {occ.logement?.nom ?? `#${occ.logementId}`}
      </span>
    );
  }

  function dernierJourBody(loc: Locataire) {
    const occ = occMap.get(loc.id);
    if (!occ) return <span className="text-gray-400 text-sm">—</span>;
    const late = isDatePast(occ.dateDernierJourCouvert);
    return (
      <span className={`text-sm font-medium ${late ? 'text-red-600' : 'text-green-700'}`}>
        {formatDate(occ.dateDernierJourCouvert)}
        {late && <i className="pi pi-exclamation-triangle ml-1 text-xs" />}
      </span>
    );
  }

  function actionsBody(loc: Locataire) {
    return (
      <div className="flex items-center gap-1">
        <Button
          icon="pi pi-chart-bar"
          rounded text
          tooltip="Dashboard"
          tooltipOptions={{ position: 'top' }}
          onClick={() => router.push(`/locataires/${loc.id}`)}
        />
        {canWrite && (
          <Button
            icon="pi pi-pencil"
            rounded text severity="secondary"
            tooltip="Modifier"
            tooltipOptions={{ position: 'top' }}
            onClick={() => openEdit(loc)}
          />
        )}
        {canWrite && (
          <Button
            icon="pi pi-trash"
            rounded text severity="danger"
            tooltip="Supprimer"
            tooltipOptions={{ position: 'top' }}
            loading={deletingId === loc.id}
            onClick={() => handleDelete(loc)}
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
        title="Locataires"
        breadcrumb={[{ label: 'Dashboard', path: '/' }, { label: 'Locataires' }]}
        action={{
          label:   'Nouveau locataire',
          icon:    'pi-plus',
          onClick: openCreate,
          visible: canWrite,
        }}
      />

      <div className="bg-white rounded-xl shadow-sm p-4">
        {/* Filtre global */}
        <div className="mb-4 relative max-w-sm">
          <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
          <InputText
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Rechercher (nom, prénom, téléphone, email)…"
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
          data={locataires}
          loading={loading}
          error={error}
          onRetry={loadData}
          emptyMessage="Aucun locataire enregistré."
          filterDisplay={undefined}
          globalFilter={globalFilter}
          globalFilterFields={['nom', 'prenom', 'telephone', 'email']}
        >
          <Column field="nom"       header="Nom"       sortable />
          <Column field="prenom"    header="Prénom"    sortable />
          <Column field="telephone" header="Téléphone" sortable />

          <Column
            field="email" header="Email"
            body={(loc: Locataire) =>
              loc.email
                ? <span className="text-sm">{loc.email}</span>
                : <span className="text-gray-400 text-sm">—</span>
            }
          />

          <Column
            header="Statut"
            body={statutBody}
            style={{ width: '110px' }}
          />

          <Column
            header="Logement actuel"
            body={occupationBody}
          />

          <Column
            header="Dernier jour couvert"
            body={dernierJourBody}
            style={{ width: '180px' }}
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
        header="Nouveau locataire"
        style={{ width: '500px' }}
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
          <div className="grid grid-cols-2 gap-3">
            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <Controller name="nom" control={createForm.control} render={({ field }) => (
                <InputText
                  {...field}
                  className={`w-full ${createForm.formState.errors.nom ? 'p-invalid' : ''}`}
                  placeholder="Martin"
                />
              )} />
              {createForm.formState.errors.nom && (
                <p className="text-xs text-[#991b1b] mt-1">{createForm.formState.errors.nom.message}</p>
              )}
            </div>

            {/* Prénom */}
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-1">
                Prénom <span className="text-red-500">*</span>
              </label>
              <Controller name="prenom" control={createForm.control} render={({ field }) => (
                <InputText
                  {...field}
                  className={`w-full ${createForm.formState.errors.prenom ? 'p-invalid' : ''}`}
                  placeholder="Paul"
                />
              )} />
              {createForm.formState.errors.prenom && (
                <p className="text-xs text-[#991b1b] mt-1">{createForm.formState.errors.prenom.message}</p>
              )}
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Téléphone <span className="text-red-500">*</span>
            </label>
            <Controller name="telephone" control={createForm.control} render={({ field }) => (
              <InputText
                {...field}
                className={`w-full ${createForm.formState.errors.telephone ? 'p-invalid' : ''}`}
                placeholder="+22501020304"
              />
            )} />
            {createForm.formState.errors.telephone && (
              <p className="text-xs text-[#991b1b] mt-1">{createForm.formState.errors.telephone.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">Email</label>
            <Controller name="email" control={createForm.control} render={({ field }) => (
              <InputText
                {...field}
                className={`w-full ${createForm.formState.errors.email ? 'p-invalid' : ''}`}
                placeholder="paul@email.com"
              />
            )} />
            {createForm.formState.errors.email && (
              <p className="text-xs text-[#991b1b] mt-1">{createForm.formState.errors.email.message}</p>
            )}
          </div>

          {/* Compte utilisateur */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Compte utilisateur (LOCATAIRE)
              <span className="text-gray-400 font-normal ml-1">— optionnel</span>
            </label>
            <Controller name="utilisateurId" control={createForm.control} render={({ field }) => (
              <Dropdown
                value={field.value ?? null}
                onChange={(e) => field.onChange(e.value ?? undefined)}
                options={usersLoc.map((u) => ({
                  label: `${u.prenom} ${u.nom} (${u.username})`,
                  value: u.id,
                }))}
                placeholder="Aucun compte lié"
                className="w-full"
                filter
                showClear
                emptyMessage="Aucun compte LOCATAIRE disponible"
              />
            )} />
          </div>
        </form>
      </Dialog>

      {/* ── Modal Modifier ─────────────────────────────────────────────────── */}
      <Dialog
        visible={modalMode === 'edit'}
        onHide={closeModal}
        header={`Modifier « ${editing?.prenom ?? ''} ${editing?.nom ?? ''} »`}
        style={{ width: '500px' }}
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
          <div className="grid grid-cols-2 gap-3">
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
              <label className="block text-sm font-medium text-[#1e293b] mb-1">
                Prénom <span className="text-red-500">*</span>
              </label>
              <Controller name="prenom" control={editForm.control} render={({ field }) => (
                <InputText
                  {...field}
                  className={`w-full ${editForm.formState.errors.prenom ? 'p-invalid' : ''}`}
                />
              )} />
              {editForm.formState.errors.prenom && (
                <p className="text-xs text-[#991b1b] mt-1">{editForm.formState.errors.prenom.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Téléphone <span className="text-red-500">*</span>
            </label>
            <Controller name="telephone" control={editForm.control} render={({ field }) => (
              <InputText
                {...field}
                className={`w-full ${editForm.formState.errors.telephone ? 'p-invalid' : ''}`}
              />
            )} />
            {editForm.formState.errors.telephone && (
              <p className="text-xs text-[#991b1b] mt-1">{editForm.formState.errors.telephone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">Email</label>
            <Controller name="email" control={editForm.control} render={({ field }) => (
              <InputText
                {...field}
                className={`w-full ${editForm.formState.errors.email ? 'p-invalid' : ''}`}
              />
            )} />
            {editForm.formState.errors.email && (
              <p className="text-xs text-[#991b1b] mt-1">{editForm.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Compte utilisateur (LOCATAIRE)
              <span className="text-gray-400 font-normal ml-1">— optionnel</span>
            </label>
            <Controller name="utilisateurId" control={editForm.control} render={({ field }) => (
              <Dropdown
                value={field.value ?? null}
                onChange={(e) => field.onChange(e.value ?? undefined)}
                options={usersLoc.map((u) => ({
                  label: `${u.prenom} ${u.nom} (${u.username})`,
                  value: u.id,
                }))}
                placeholder="Aucun compte lié"
                className="w-full"
                filter
                showClear
                emptyMessage="Aucun compte LOCATAIRE disponible"
              />
            )} />
          </div>
        </form>
      </Dialog>
    </>
  );
}
