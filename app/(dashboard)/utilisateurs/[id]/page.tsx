'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';

import { usersApi } from '@/services/users.api';
import { batimentsApi } from '@/services/batiments.api';
import { logementsApi } from '@/services/logements.api';
import type { Utilisateur } from '@/types/utilisateur';
import type { Batiment } from '@/types/batiment';
import type { Logement } from '@/types/logement';
import { Role } from '@/types/enums';
import { useAppSelector } from '@/store/hooks';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorMessage from '@/components/shared/ErrorMessage';
import { showConfirm } from '@/components/shared/ConfirmDialog';
import { roleLabels, roleColors } from '@/utils/role';

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function extractError(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) return err.response?.data?.message ?? fallback;
  return fallback;
}

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

function rolesForAdmin(role: Role | undefined): Role[] {
  if (role === Role.ADMIN_GLOBAL)   return [Role.LOCATAIRE, Role.ADMIN_LOGEMENT, Role.ADMIN_BATIMENT, Role.ADMIN_GLOBAL];
  if (role === Role.ADMIN_BATIMENT) return [Role.LOCATAIRE, Role.ADMIN_LOGEMENT];
  return [Role.LOCATAIRE];
}

// ─── Schéma ───────────────────────────────────────────────────────────────────

const editSchema = z.object({
  nom:       z.string().min(1, 'Le nom est obligatoire'),
  prenom:    z.string().min(1, 'Le prénom est obligatoire'),
  telephone: z.string().min(1, 'Le téléphone est obligatoire'),
  email:     z.string().email('Email invalide').optional().or(z.literal('')),
  role:      z.nativeEnum(Role),
});

type EditFormValues = z.infer<typeof editSchema>;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UtilisateurDetailPage() {
  const { id }      = useParams<{ id: string }>();
  const router      = useRouter();
  const toast       = useRef<Toast>(null);
  const currentRole = useAppSelector((s) => s.auth.user?.role);
  const currentId   = useAppSelector((s) => s.auth.user?.id);
  const userId      = Number(id);

  const canEdit          = currentRole && currentRole !== Role.LOCATAIRE;
  const canAssignBat     = currentRole === Role.ADMIN_GLOBAL;
  const canAssignLog     = currentRole === Role.ADMIN_BATIMENT || currentRole === Role.ADMIN_GLOBAL;

  // ── État principal ─────────────────────────────────────────────────────────
  const [user,    setUser]    = useState<Utilisateur | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [saving,  setSaving]  = useState(false);

  // Reset mot de passe
  const [showReset,     setShowReset]     = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetting,     setResetting]     = useState(false);

  // Attributions bâtiments
  const [allBatiments,     setAllBatiments]     = useState<Batiment[]>([]);
  const [selectedBatiment, setSelectedBatiment] = useState<number | null>(null);
  const [assigningBat,     setAssigningBat]     = useState(false);

  // Attributions logements
  const [allLogements,     setAllLogements]     = useState<Logement[]>([]);
  const [selectedLogement, setSelectedLogement] = useState<number | null>(null);
  const [assigningLog,     setAssigningLog]     = useState(false);

  // ── Formulaire ─────────────────────────────────────────────────────────────
  const roleOptions = rolesForAdmin(currentRole).map((r) => ({ label: roleLabels[r], value: r }));

  const { control, handleSubmit, reset, formState: { errors } } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  });

  // ── Chargement ─────────────────────────────────────────────────────────────
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.getById(userId);
      const u = res.data.data;
      setUser(u);
      reset({
        nom:       u.nom,
        prenom:    u.prenom,
        telephone: u.telephone,
        email:     u.email ?? '',
        role:      u.role,
      });
    } catch {
      setError("Impossible de charger les données de l'utilisateur.");
    } finally {
      setLoading(false);
    }
  }

  async function loadResources() {
    if (canAssignBat) {
      batimentsApi.getAll().then((r) => setAllBatiments(r.data.data)).catch(() => null);
    }
    if (canAssignLog) {
      logementsApi.getAll().then((r) => setAllLogements(r.data.data)).catch(() => null);
    }
  }

  useEffect(() => {
    load();
    loadResources();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Modifier ───────────────────────────────────────────────────────────────
  async function submitEdit(values: EditFormValues) {
    setSaving(true);
    try {
      const res = await usersApi.update(userId, {
        ...values,
        email: values.email || undefined,
      });
      setUser(res.data.data);
      toast.current?.show({ severity: 'success', summary: 'Succès', detail: 'Profil mis à jour.', life: 3000 });
    } catch (err) {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: extractError(err, 'Impossible de mettre à jour.'), life: 4000,
      });
    } finally {
      setSaving(false);
    }
  }

  // ── Activer / Désactiver ───────────────────────────────────────────────────
  function toggleActive() {
    if (!user) return;
    const action = user.isActive ? 'désactiver' : 'activer';
    showConfirm({
      message:     `Voulez-vous ${action} cet utilisateur ?`,
      header:      user.isActive ? "Désactiver l'utilisateur" : "Activer l'utilisateur",
      acceptLabel: user.isActive ? 'Désactiver' : 'Activer',
      onAccept: async () => {
        try {
          const res = await usersApi.setActive(userId, !user.isActive);
          setUser(res.data.data);
          toast.current?.show({
            severity: 'success', summary: 'Succès',
            detail: `Utilisateur ${user.isActive ? 'désactivé' : 'activé'}.`, life: 3000,
          });
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
  function openReset() {
    setResetPassword(generatePassword());
    setShowReset(true);
  }

  async function submitReset() {
    setResetting(true);
    try {
      await usersApi.resetPassword(userId, resetPassword);
      toast.current?.show({ severity: 'success', summary: 'Succès', detail: 'Mot de passe réinitialisé.', life: 3000 });
      setShowReset(false);
    } catch (err) {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: extractError(err, 'Impossible de réinitialiser le mot de passe.'), life: 4000,
      });
    } finally {
      setResetting(false);
    }
  }

  // ── Attribution bâtiment ───────────────────────────────────────────────────
  async function assignBatiment() {
    if (!selectedBatiment) return;
    setAssigningBat(true);
    try {
      await usersApi.assignBatiment(userId, selectedBatiment);
      setSelectedBatiment(null);
      toast.current?.show({ severity: 'success', summary: 'Succès', detail: 'Bâtiment attribué.', life: 3000 });
      load();
    } catch (err) {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: extractError(err, "Impossible d'attribuer le bâtiment."), life: 4000,
      });
    } finally {
      setAssigningBat(false);
    }
  }

  function removeBatiment(batimentId: number, batimentNom: string) {
    showConfirm({
      message:     `Retirer l'accès au bâtiment "${batimentNom}" ?`,
      header:      'Retirer le bâtiment',
      acceptLabel: 'Retirer',
      onAccept: async () => {
        try {
          await usersApi.removeBatiment(userId, batimentId);
          toast.current?.show({ severity: 'success', summary: 'Succès', detail: 'Bâtiment retiré.', life: 3000 });
          load();
        } catch (err) {
          toast.current?.show({
            severity: 'error', summary: 'Erreur',
            detail: extractError(err, 'Impossible de retirer le bâtiment.'), life: 4000,
          });
        }
      },
    });
  }

  // ── Attribution logement ───────────────────────────────────────────────────
  async function assignLogement() {
    if (!selectedLogement) return;
    setAssigningLog(true);
    try {
      await usersApi.assignLogement(userId, selectedLogement);
      setSelectedLogement(null);
      toast.current?.show({ severity: 'success', summary: 'Succès', detail: 'Logement attribué.', life: 3000 });
      load();
    } catch (err) {
      toast.current?.show({
        severity: 'error', summary: 'Erreur',
        detail: extractError(err, "Impossible d'attribuer le logement."), life: 4000,
      });
    } finally {
      setAssigningLog(false);
    }
  }

  function removeLogement(logementId: number, logementNom: string) {
    showConfirm({
      message:     `Retirer l'accès au logement "${logementNom}" ?`,
      header:      'Retirer le logement',
      acceptLabel: 'Retirer',
      onAccept: async () => {
        try {
          await usersApi.removeLogement(userId, logementId);
          toast.current?.show({ severity: 'success', summary: 'Succès', detail: 'Logement retiré.', life: 3000 });
          load();
        } catch (err) {
          toast.current?.show({
            severity: 'error', summary: 'Erreur',
            detail: extractError(err, 'Impossible de retirer le logement.'), life: 4000,
          });
        }
      },
    });
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────
  if (loading) return <LoadingSpinner />;
  if (error || !user) return <ErrorMessage message={error ?? 'Données introuvables.'} onRetry={load} />;

  // Bâtiments/logements disponibles (non encore attribués)
  const assignedBatIds = new Set((user.batiments ?? []).map((b) => b.id));
  const assignedLogIds = new Set((user.logements ?? []).map((l) => l.id));
  const availableBats  = allBatiments.filter((b) => !assignedBatIds.has(b.id));
  const availableLogs  = allLogements.filter((l) => !assignedLogIds.has(l.id));

  // Section attribution bâtiments visible si ADMIN_GLOBAL et utilisateur est ADMIN_BATIMENT
  const showBatSection = canAssignBat && user.role === Role.ADMIN_BATIMENT;
  // Section attribution logements visible si ADMIN_BATIMENT+ et utilisateur est ADMIN_LOGEMENT
  const showLogSection = canAssignLog && user.role === Role.ADMIN_LOGEMENT;

  // L'admin ne peut pas modifier son propre compte depuis cette page (utiliser /profil)
  const isSelf = currentId === userId;

  return (
    <div className="space-y-6">
      <Toast ref={toast} />

      <PageHeader
        title={`${user.prenom} ${user.nom}`}
        breadcrumb={[
          { label: 'Dashboard', path: '/' },
          { label: 'Utilisateurs', path: '/utilisateurs' },
          { label: `${user.prenom} ${user.nom}` },
        ]}
      />

      {/* ── Fiche utilisateur ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[#1e293b]">Informations</h2>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              user.isActive ? 'bg-[#dcfce7] text-[#166534]' : 'bg-gray-100 text-gray-500'
            }`}>
              <i className={`pi ${user.isActive ? 'pi-check-circle' : 'pi-ban'} text-xs`} />
              {user.isActive ? 'Actif' : 'Inactif'}
            </span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${roleColors[user.role]}`}>
              {roleLabels[user.role]}
            </span>
          </div>
        </div>

        {isSelf ? (
          <div className="bg-[#fef3c7] flex items-center border border-yellow-200 rounded-lg p-3 text-sm text-[#92400e]">
            <i className="pi pi-info-circle mr-2" />
            Pour modifier votre propre profil, rendez-vous sur la page{' '}
            <Button
              className='p-1'
              label='Profil'
              text size="small"
              onClick={() => router.push('/profil')}
            />
          </div>
        ) : canEdit ? (
          <form onSubmit={handleSubmit(submitEdit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
                <input
                  readOnly
                  value={user.username}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 font-mono text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-0.5">Non modifiable</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex gap-2">
                <Button
                  type="button"
                  label={user.isActive ? 'Désactiver' : 'Activer'}
                  icon={user.isActive ? 'pi pi-ban' : 'pi pi-check-circle'}
                  severity={user.isActive ? 'warning' : 'success'}
                  outlined
                  onClick={toggleActive}
                />
                <Button
                  type="button"
                  label="Réinitialiser le mot de passe"
                  icon="pi pi-key"
                  severity="secondary"
                  outlined
                  onClick={openReset}
                />
              </div>
              <Button
                type="submit"
                label="Enregistrer"
                icon="pi pi-check"
                loading={saving}
                style={{ backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }}
              />
            </div>
          </form>
        ) : (
          /* Vue lecture seule */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {[
              ['Prénom', user.prenom],
              ['Nom', user.nom],
              ['Username', user.username],
              ['Téléphone', user.telephone],
              ['Email', user.email ?? '—'],
            ].map(([label, val]) => (
              <div key={label}>
                <span className="text-gray-500">{label}</span>
                <p className="font-medium text-[#1e293b] mt-0.5">{val}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Attribution bâtiments (ADMIN_GLOBAL → ADMIN_BATIMENT) ─────────── */}
      {showBatSection && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#1e293b] mb-4">Bâtiments attribués</h2>

          {(user.batiments ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">Aucun bâtiment attribué.</p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              {(user.batiments ?? []).map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-2 bg-[#dbeafe] text-[#1e3a8a] text-sm font-medium px-3 py-1 rounded-full"
                >
                  <i className="pi pi-building text-xs" />
                  {b.nom}
                  <button
                    onClick={() => removeBatiment(b.id, b.nom)}
                    className="text-[#1e3a8a] hover:text-[#991b1b] ml-1"
                  >
                    <i className="pi pi-times text-xs" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Dropdown
              value={selectedBatiment}
              onChange={(e) => setSelectedBatiment(e.value)}
              options={availableBats.map((b) => ({ label: b.nom, value: b.id }))}
              placeholder="Sélectionner un bâtiment"
              className="flex-1"
              disabled={availableBats.length === 0}
              filter
              filterPlaceholder="Rechercher…"
            />
            <Button
              label="Attribuer"
              icon="pi pi-plus"
              disabled={!selectedBatiment}
              loading={assigningBat}
              onClick={assignBatiment}
              style={{ backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }}
            />
          </div>
        </div>
      )}

      {/* ── Attribution logements (ADMIN_BATIMENT+ → ADMIN_LOGEMENT) ─────── */}
      {showLogSection && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#1e293b] mb-4">Logements attribués</h2>

          {(user.logements ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">Aucun logement attribué.</p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              {(user.logements ?? []).map((l) => (
                <span
                  key={l.id}
                  className="inline-flex items-center gap-2 bg-[#dbeafe] text-[#1e3a8a] text-sm font-medium px-3 py-1 rounded-full"
                >
                  <i className="pi pi-home text-xs" />
                  {l.nom}
                  <button
                    onClick={() => removeLogement(l.id, l.nom)}
                    className="text-[#1e3a8a] hover:text-[#991b1b] ml-1"
                  >
                    <i className="pi pi-times text-xs" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Dropdown
              value={selectedLogement}
              onChange={(e) => setSelectedLogement(e.value)}
              options={availableLogs.map((l) => ({ label: l.nom, value: l.id }))}
              placeholder="Sélectionner un logement"
              className="flex-1"
              disabled={availableLogs.length === 0}
              filter
              filterPlaceholder="Rechercher…"
            />
            <Button
              label="Attribuer"
              icon="pi pi-plus"
              disabled={!selectedLogement}
              loading={assigningLog}
              onClick={assignLogement}
              style={{ backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }}
            />
          </div>
        </div>
      )}

      {/* ── Bouton retour ──────────────────────────────────────────────────── */}
      <div>
        <Button
          label="Retour à la liste"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined
          onClick={() => router.push('/utilisateurs')}
        />
      </div>

      {/* ── Modal : Réinitialiser le mot de passe ──────────────────────────── */}
      <Dialog
        header="Réinitialiser le mot de passe"
        visible={showReset}
        onHide={() => setShowReset(false)}
        style={{ width: '420px' }}
        modal
        draggable={false}
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-gray-600">
            Utilisateur : <strong>{user.prenom} {user.nom}</strong>{' '}
            <span className="text-gray-400">(@{user.username})</span>
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
              onClick={() => setShowReset(false)}
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
      </Dialog>
    </div>
  );
}
