'use client';

import { useEffect, useState, useRef } from 'react';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';

import { batimentsApi } from '@/services/batiments.api';
import type { Batiment, CreateBatimentDto } from '@/types/batiment';
import { Role } from '@/types/enums';

import PageHeader from '@/components/shared/PageHeader';
import DataTableWrapper from '@/components/shared/DataTableWrapper';
import RoleGuard from '@/components/shared/RoleGuard';
import { showConfirm } from '@/components/shared/ConfirmDialog';
import { useAppSelector } from '@/store/hooks';

// ─── Schéma de validation ─────────────────────────────────────────────────────

const schema = z.object({
  nom:         z.string().min(1, 'Le nom est obligatoire'),
  adresse:     z.string().min(1, "L'adresse est obligatoire"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function extractError(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data;
    return data?.message ?? fallback;
  }
  return fallback;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BatimentsPage() {
  const router  = useRouter();
  const toast   = useRef<Toast>(null);
  const role    = useAppSelector((s) => s.auth.user?.role);

  // ── État ───────────────────────────────────────────────────────────────────
  const [batiments, setBatiments]   = useState<Batiment[] | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [modalVisible, setModal]    = useState(false);
  const [editing, setEditing]       = useState<Batiment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ── Formulaire ─────────────────────────────────────────────────────────────
  const { control, handleSubmit, reset, formState: { errors: formErrors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nom: '', adresse: '', description: '' },
  });

  // ── Chargement ─────────────────────────────────────────────────────────────
  async function loadBatiments() {
    setLoading(true);
    setError(null);
    try {
      const res = await batimentsApi.getAll();
      setBatiments(res.data.data);
    } catch {
      setError('Impossible de charger les bâtiments.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBatiments(); }, []);

  // ── Modal ──────────────────────────────────────────────────────────────────
  function openCreate() {
    setEditing(null);
    reset({ nom: '', adresse: '', description: '' });
    setModal(true);
  }

  function openEdit(bat: Batiment) {
    setEditing(bat);
    reset({ nom: bat.nom, adresse: bat.adresse, description: bat.description ?? '' });
    setModal(true);
  }

  function closeModal() {
    setModal(false);
    setEditing(null);
  }

  // ── Soumission formulaire ──────────────────────────────────────────────────
  const onSubmit = handleSubmit(async (values: FormValues) => {
    setSubmitting(true);
    try {
      const dto: CreateBatimentDto = {
        nom:     values.nom,
        adresse: values.adresse,
        ...(values.description ? { description: values.description } : {}),
      };

      if (editing) {
        await batimentsApi.update(editing.id, dto);
        toast.current?.show({ severity: 'success', summary: 'Bâtiment modifié', life: 3000 });
      } else {
        await batimentsApi.create(dto);
        toast.current?.show({ severity: 'success', summary: 'Bâtiment créé', life: 3000 });
      }

      closeModal();
      loadBatiments();
    } catch (err) {
      const msg = extractError(err, editing ? 'Impossible de modifier.' : 'Impossible de créer.');
      toast.current?.show({ severity: 'error', summary: 'Erreur', detail: msg, life: 4000 });
    } finally {
      setSubmitting(false);
    }
  });

  // ── Suppression ────────────────────────────────────────────────────────────
  function handleDelete(bat: Batiment) {
    showConfirm({
      header:      'Supprimer le bâtiment',
      message:     `Supprimer « ${bat.nom} » ? Cette action est irréversible.`,
      acceptLabel: 'Supprimer',
      onAccept:    async () => {
        setDeletingId(bat.id);
        try {
          await batimentsApi.delete(bat.id);
          toast.current?.show({ severity: 'success', summary: 'Bâtiment supprimé', life: 3000 });
          loadBatiments();
        } catch (err) {
          const msg = extractError(err, 'Impossible de supprimer ce bâtiment.');
          toast.current?.show({ severity: 'error', summary: 'Erreur', detail: msg, life: 4000 });
        } finally {
          setDeletingId(null);
        }
      },
    });
  }

  // ── Colonnes DataTable ─────────────────────────────────────────────────────
  const canEdit   = role === Role.ADMIN_BATIMENT || role === Role.ADMIN_GLOBAL;
  const canDelete = role === Role.ADMIN_GLOBAL;

  function actionsBody(bat: Batiment) {
    return (
      <div className="flex items-center gap-1">
        <Button
          icon="pi pi-chart-bar"
          rounded text
          tooltip="Dashboard"
          tooltipOptions={{ position: 'top' }}
          onClick={() => router.push(`/batiments/${bat.id}`)}
        />
        {canEdit && (
          <Button
            icon="pi pi-pencil"
            rounded text severity="secondary"
            tooltip="Modifier"
            tooltipOptions={{ position: 'top' }}
            onClick={() => openEdit(bat)}
          />
        )}
        {canDelete && (
          <Button
            icon="pi pi-trash"
            rounded text severity="danger"
            tooltip="Supprimer"
            tooltipOptions={{ position: 'top' }}
            loading={deletingId === bat.id}
            onClick={() => handleDelete(bat)}
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
        title="Bâtiments"
        breadcrumb={[{ label: 'Dashboard', path: '/' }, { label: 'Bâtiments' }]}
        action={{
          label:   'Nouveau bâtiment',
          icon:    'pi-plus',
          onClick: openCreate,
          visible: role === Role.ADMIN_GLOBAL,
        }}
      />

      <div className="bg-white rounded-xl shadow-sm p-4">
        <DataTableWrapper
          data={batiments}
          loading={loading}
          error={error}
          onRetry={loadBatiments}
          emptyMessage="Aucun bâtiment enregistré."
        >
          <Column field="nom"      header="Nom"         sortable filter filterPlaceholder="Filtrer…" />
          <Column field="adresse"  header="Adresse"     sortable filter filterPlaceholder="Filtrer…" />
          <Column field="description" header="Description" style={{ maxWidth: '260px' }}
            body={(b: Batiment) => b.description ?? <span className="text-gray-400 text-sm">—</span>}
          />
          <Column
            header="Actions"
            body={actionsBody}
            style={{ width: '130px', textAlign: 'center' }}
            exportable={false}
          />
        </DataTableWrapper>
      </div>

      {/* ── Modal Créer / Modifier ─────────────────────────────────────────── */}
      <Dialog
        visible={modalVisible}
        onHide={closeModal}
        header={editing ? 'Modifier le bâtiment' : 'Nouveau bâtiment'}
        style={{ width: '460px' }}
        modal
        draggable={false}
        resizable={false}
        footer={
          <div className="flex justify-end gap-2">
            <Button label="Annuler" severity="secondary" outlined onClick={closeModal} disabled={submitting} />
            <Button
              label={editing ? 'Enregistrer' : 'Créer'}
              icon="pi pi-check"
              loading={submitting}
              onClick={onSubmit}
              style={{ backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }}
            />
          </div>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <Controller name="nom" control={control} render={({ field }) => (
              <InputText {...field} className={`w-full ${formErrors.nom ? 'p-invalid' : ''}`} placeholder="Résidence du Lac" />
            )} />
            {formErrors.nom && <p className="text-xs text-[#991b1b] mt-1">{formErrors.nom.message}</p>}
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Adresse <span className="text-red-500">*</span>
            </label>
            <Controller name="adresse" control={control} render={({ field }) => (
              <InputText {...field} className={`w-full ${formErrors.adresse ? 'p-invalid' : ''}`} placeholder="12 rue des Acacias, Yaoundé" />
            )} />
            {formErrors.adresse && <p className="text-xs text-[#991b1b] mt-1">{formErrors.adresse.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">Description</label>
            <Controller name="description" control={control} render={({ field }) => (
              <InputTextarea
                {...field}
                value={field.value ?? ''}
                rows={3}
                className="w-full"
                placeholder="Informations complémentaires (optionnel)"
                autoResize
              />
            )} />
          </div>
        </form>
      </Dialog>
    </>
  );
}
