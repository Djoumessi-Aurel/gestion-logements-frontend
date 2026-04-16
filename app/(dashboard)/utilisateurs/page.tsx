'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';

import { usersApi } from '@/services/users.api';
import type { Utilisateur } from '@/types/utilisateur';
import { Role } from '@/types/enums';
import { useAppSelector } from '@/store/hooks';

import PageHeader from '@/components/shared/PageHeader';
import DataTableWrapper from '@/components/shared/DataTableWrapper';
import { showConfirm } from '@/components/shared/ConfirmDialog';
import ExportModal from '@/components/shared/ExportModal';

// ─── Utilitaires ──────────────────────────────────────────────────────────────

import { roleLabels, roleColors } from '@/utils/role';

function generatePassword(): string {
  const upper   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower   = 'abcdefghijklmnopqrstuvwxyz';
  const digits  = '0123456789';
  const special = '@#$!%*?';
  const all     = upper + lower + digits + special;
  const mandatory = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  const rest = Array.from({ length: 8 }, () => all[Math.floor(Math.random() * all.length)]);
  return [...mandatory, ...rest].sort(() => Math.random() - 0.5).join('');
}

function extractError(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) return err.response?.data?.message ?? fallback;
  return fallback;
}

function rolesForAdmin(role: Role | undefined): Role[] {
  if (role === Role.ADMIN_GLOBAL)   return [Role.LOCATAIRE, Role.ADMIN_LOGEMENT, Role.ADMIN_BATIMENT, Role.ADMIN_GLOBAL];
  if (role === Role.ADMIN_BATIMENT) return [Role.LOCATAIRE, Role.ADMIN_LOGEMENT];
  return [Role.LOCATAIRE];
}

// ─── Schéma ───────────────────────────────────────────────────────────────────

const createSchema = z.object({
  nom:       z.string().min(1, 'Le nom est obligatoire'),
  prenom:    z.string().min(1, 'Le prénom est obligatoire'),
  telephone: z.string().min(1, 'Le téléphone est obligatoire'),
  email:     z.string().email('Email invalide').optional().or(z.literal('')),
  username:  z.string().min(3, 'Le username doit faire au moins 3 caractères'),
  role:      z.nativeEnum(Role),
});

type CreateFormValues = z.infer<typeof createSchema>;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UtilisateursPage() {
  const router      = useRouter();
  const toast       = useRef<Toast>(null);
  const currentRole = useAppSelector((s) => s.auth.user?.role);
  const currentId   = useAppSelector((s) => s.auth.user?.id);
  const canCreate   = currentRole && currentRole !== Role.LOCATAIRE;
  const canExport   = currentRole && currentRole !== Role.LOCATAIRE;

  // ── État ───────────────────────────────────────────────────────────────────
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[] | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');

  // Export
  const [exportVisible, setExportVisible] = useState(false);

  // Modale création
  const [showCreate,  setShowCreate]  = useState(false);
  const [genPassword, setGenPassword] = useState('');
  const [creating,    setCreating]    = useState(false);

  // Modale reset mot de passe
  const [resetTarget,   setResetTarget]   = useState<Utilisateur | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetting,     setResetting]     = useState(false);

  // ── Formulaire ─────────────────────────────────────────────────────────────
  const roleOptions = rolesForAdmin(currentRole).map((r) => ({ label: roleLabels[r], value: r }));

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      nom: '', prenom: '', telephone: '', email: '', username: '',
      role: rolesForAdmin(currentRole)[0],
    },
  });

  // ── Chargement ─────────────────────────────────────────────────────────────
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.getAll();
      setUtilisateurs(res.data.data);
    } catch {
      setError('Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filtre global ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!utilisateurs) return [];
    const q = globalFilter.toLowerCase();
    if (!q) return utilisateurs;
    return utilisateurs.filter((u) =>
      u.nom.toLowerCase().includes(q) ||
      u.prenom.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q) ||
      u.telephone.includes(q)
    );
  }, [utilisateurs, globalFilter]);

  // ── Créer ──────────────────────────────────────────────────────────────────
  function openCreate() {
    setGenPassword(generatePassword());
    reset({
      nom: '', prenom: '', telephone: '', email: '', username: '',
      role: rolesForAdmin(currentRole)[0],
    });
    setShowCreate(true);
  }

  async function submitCreate(values: CreateFormValues) {
    setCreating(true);
    try {
      await usersApi.create({
        ...values,
        password: genPassword,
        email: values.email || undefined,
      });
      toast.current?.show({ severity: 'success', summary: 'Succès', detail: 'Utilisateur créé.', life: 3000 });
      setShowCreate(false);
      load();
    } catch (err) {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: extractError(err, "Impossible de créer l'utilisateur."), life: 4000,
      });
    } finally {
      setCreating(false);
    }
  }

  // ── Activer / Désactiver ───────────────────────────────────────────────────
  function toggleActive(u: Utilisateur) {
    const action = u.isActive ? 'désactiver' : 'activer';
    showConfirm({
      message:     `Voulez-vous ${action} l'utilisateur "${u.prenom} ${u.nom}" ?`,
      header:      u.isActive ? "Désactiver l'utilisateur" : "Activer l'utilisateur",
      acceptLabel: u.isActive ? 'Désactiver' : 'Activer',
      onAccept: async () => {
        try {
          await usersApi.setActive(u.id, !u.isActive);
          toast.current?.show({
            severity: 'success', summary: 'Succès',
            detail: `Utilisateur ${u.isActive ? 'désactivé' : 'activé'}.`, life: 3000,
          });
          load();
        } catch (err) {
          toast.current?.show({
            severity: 'error', summary: 'Erreur',
            detail: extractError(err, "Impossible de modifier l'état."), life: 4000,
          });
        }
      },
    });
  }

  // ── Reset mot de passe ─────────────────────────────────────────────────────
  function openReset(u: Utilisateur) {
    setResetPassword(generatePassword());
    setResetTarget(u);
  }

  async function submitReset() {
    if (!resetTarget) return;
    setResetting(true);
    try {
      await usersApi.resetPassword(resetTarget.id, resetPassword);
      toast.current?.show({ severity: 'success', summary: 'Succès', detail: 'Mot de passe réinitialisé.', life: 3000 });
      setResetTarget(null);
    } catch (err) {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: extractError(err, 'Impossible de réinitialiser le mot de passe.'), life: 4000,
      });
    } finally {
      setResetting(false);
    }
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex justify-center items-center p-12">
      <i className="pi pi-spin pi-spinner text-3xl text-[#1e3a8a]" />
    </div>
  );

  if (error) return (
    <div className="text-center p-8 text-[#991b1b]">
      {error}{' '}
      <button className="underline ml-2" onClick={load}>Réessayer</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <Toast ref={toast} />

      <PageHeader
        title="Utilisateurs"
        breadcrumb={[{ label: 'Dashboard', path: '/' }, { label: 'Utilisateurs' }]}
        actions={canExport ? [{ label: 'Exporter', icon: 'pi-download', onClick: () => setExportVisible(true) }] : []}
        action={canCreate ? { label: 'Nouvel utilisateur', icon: 'pi-plus', onClick: openCreate } : undefined}
      />

      {/* ── Filtre global ──────────────────────────────────────────────────── */}
      <div className="relative w-full sm:w-80">
        <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Rechercher (nom, username, email…)"
          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
        />
        {globalFilter && (
          <button
            onClick={() => setGlobalFilter('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <i className="pi pi-times text-xs" />
          </button>
        )}
      </div>

      {/* ── DataTable ─────────────────────────────────────────────────────── */}
      <DataTableWrapper
        data={filtered}
        loading={false}
        emptyMessage="Aucun utilisateur trouvé."
      >
        <Column
          header="Nom"
          body={(u: Utilisateur) => (
            <span className="font-medium text-sm text-[#1e293b]">{u.prenom} {u.nom}</span>
          )}
          sortable
          sortField="nom"
          style={{ minWidth: '160px' }}
        />
        <Column
          header="Username"
          body={(u: Utilisateur) => (
            <span className="font-mono text-sm text-gray-600">{u.username}</span>
          )}
          sortable
          sortField="username"
          style={{ minWidth: '130px' }}
        />
        <Column
          header="Rôle"
          body={(u: Utilisateur) => (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${roleColors[u.role]}`}>
              {roleLabels[u.role]}
            </span>
          )}
          sortable
          sortField="role"
          style={{ minWidth: '100px' }}
        />
        <Column
          header="Téléphone"
          body={(u: Utilisateur) => <span className='text-sm'>{u.telephone}</span>}
          style={{ minWidth: '120px' }}
        />
        <Column
          header="Email"
          body={(u: Utilisateur) =>u.email ? <span className='text-sm'>{u.email}</span> : <span className="text-gray-400 text-sm">—</span>}
          style={{ minWidth: '160px' }}
        />
        <Column
          header="Statut"
          body={(u: Utilisateur) => (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              u.isActive ? 'bg-[#dcfce7] text-[#166534]' : 'bg-gray-100 text-gray-500'
            }`}>
              <i className={`pi ${u.isActive ? 'pi-check-circle' : 'pi-ban'} text-xs`} />
              {u.isActive ? 'Actif' : 'Inactif'}
            </span>
          )}
          style={{ minWidth: '90px' }}
        />
        <Column
          header="Dernière connexion"
          body={(u: Utilisateur) => u.lastLoginAt
            ? <span className="text-sm text-gray-600">{new Date(u.lastLoginAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' })}</span>
            : <span className="text-gray-400 text-sm">Jamais</span>
          }
          sortable
          sortField="lastLoginAt"
          style={{ minWidth: '150px' }}
        />
        <Column
          header="Actions"
          body={(u: Utilisateur) => (
            <div className="flex items-center gap-1">
              <Button
                icon="pi pi-eye"
                size="small"
                text
                tooltip="Voir le profil"
                tooltipOptions={{ position: 'top' }}
                onClick={() => router.push(`/utilisateurs/${u.id}`)}
              />
              {u.id !== currentId && (
                <Button
                  icon={u.isActive ? 'pi pi-ban' : 'pi pi-check-circle'}
                  size="small"
                  text
                  severity={u.isActive ? 'warning' : 'success'}
                  tooltip={u.isActive ? 'Désactiver' : 'Activer'}
                  tooltipOptions={{ position: 'top' }}
                  onClick={() => toggleActive(u)}
                />
              )}
              <Button
                icon="pi pi-key"
                size="small"
                text
                severity="secondary"
                tooltip="Réinitialiser le mot de passe"
                tooltipOptions={{ position: 'top' }}
                onClick={() => openReset(u)}
              />
            </div>
          )}
          style={{ width: '130px' }}
        />
      </DataTableWrapper>

      {/* ── Modal : Créer un utilisateur ───────────────────────────────────── */}
      <Dialog
        header="Nouvel utilisateur"
        visible={showCreate}
        onHide={() => setShowCreate(false)}
        style={{ width: '520px' }}
        modal
        draggable={false}
      >
        <form onSubmit={handleSubmit(submitCreate)} className="space-y-4 pt-2">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
              <Controller name="prenom" control={control} render={({ field }) => (
                <InputText {...field} className={`w-full ${errors.prenom ? 'p-invalid' : ''}`} />
              )} />
              {errors.prenom && <p className="text-xs text-[#991b1b] mt-0.5">{errors.prenom.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <Controller name="nom" control={control} render={({ field }) => (
                <InputText {...field} className={`w-full ${errors.nom ? 'p-invalid' : ''}`} />
              )} />
              {errors.nom && <p className="text-xs text-[#991b1b] mt-0.5">{errors.nom.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur *</label>
            <Controller name="username" control={control} render={({ field }) => (
              <InputText {...field} className={`w-full ${errors.username ? 'p-invalid' : ''}`} />
            )} />
            {errors.username && <p className="text-xs text-[#991b1b] mt-0.5">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
            <Controller name="telephone" control={control} render={({ field }) => (
              <InputText {...field} className={`w-full ${errors.telephone ? 'p-invalid' : ''}`} />
            )} />
            {errors.telephone && <p className="text-xs text-[#991b1b] mt-0.5">{errors.telephone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Controller name="email" control={control} render={({ field }) => (
              <InputText {...field} type="email" className={`w-full ${errors.email ? 'p-invalid' : ''}`} />
            )} />
            {errors.email && <p className="text-xs text-[#991b1b] mt-0.5">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
            <Controller name="role" control={control} render={({ field }) => (
              <Dropdown
                {...field}
                options={roleOptions}
                className={`w-full ${errors.role ? 'p-invalid' : ''}`}
              />
            )} />
            {errors.role && <p className="text-xs text-[#991b1b] mt-0.5">{errors.role.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe généré</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={genPassword}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 font-mono text-gray-700 select-all cursor-text"
              />
              <Button
                type="button"
                icon="pi pi-copy"
                outlined
                tooltip="Copier"
                tooltipOptions={{ position: 'top' }}
                onClick={() => navigator.clipboard.writeText(genPassword)}
              />
              <Button
                type="button"
                icon="pi pi-refresh"
                outlined
                tooltip="Regénérer"
                tooltipOptions={{ position: 'top' }}
                onClick={() => setGenPassword(generatePassword())}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Communiquez ce mot de passe à l'utilisateur après création.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              label="Annuler"
              severity="secondary"
              outlined
              onClick={() => setShowCreate(false)}
            />
            <Button
              type="submit"
              label="Créer"
              icon="pi pi-check"
              loading={creating}
              style={{ backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }}
            />
          </div>
        </form>
      </Dialog>

      {/* ── Modal : Export ────────────────────────────────────────────────── */}
      <ExportModal
        visible={exportVisible}
        onHide={() => setExportVisible(false)}
        entityLabel="Utilisateurs"
        endpoint="utilisateurs"
      />

      {/* ── Modal : Réinitialiser le mot de passe ──────────────────────────── */}
      <Dialog
        header="Réinitialiser le mot de passe"
        visible={!!resetTarget}
        onHide={() => setResetTarget(null)}
        style={{ width: '420px' }}
        modal
        draggable={false}
      >
        {resetTarget && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-gray-600">
              Utilisateur : <strong>{resetTarget.prenom} {resetTarget.nom}</strong>{' '}
              <span className="text-gray-400">(@{resetTarget.username})</span>
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe généré</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={resetPassword}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 font-mono text-gray-700 select-all cursor-text"
                />
                <Button
                  type="button"
                  icon="pi pi-copy"
                  outlined
                  tooltip="Copier"
                  tooltipOptions={{ position: 'top' }}
                  onClick={() => navigator.clipboard.writeText(resetPassword)}
                />
                <Button
                  type="button"
                  icon="pi pi-refresh"
                  outlined
                  tooltip="Regénérer"
                  tooltipOptions={{ position: 'top' }}
                  onClick={() => setResetPassword(generatePassword())}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Communiquez ce mot de passe à l'utilisateur.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                label="Annuler"
                severity="secondary"
                outlined
                onClick={() => setResetTarget(null)}
              />
              <Button
                label="Confirmer"
                icon="pi pi-check"
                loading={resetting}
                style={{ backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }}
                onClick={submitReset}
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
