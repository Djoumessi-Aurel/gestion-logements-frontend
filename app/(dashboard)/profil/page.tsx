'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';

import { authApi } from '@/services/auth.api';
import { Role } from '@/types/enums';
import { roleLabels, roleColors } from '@/utils/role';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorMessage from '@/components/shared/ErrorMessage';

// ─── Schéma ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Le mot de passe actuel est obligatoire'),
    newPassword:     z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
    confirm:         z.string().min(1, 'La confirmation est obligatoire'),
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  });

type FormValues = z.infer<typeof schema>;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  id: number;
  nom: string;
  prenom: string;
  username: string;
  email?: string;
  telephone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function formatDate(val: string): string {
  return new Date(val).toLocaleDateString('fr-FR');
}

function extractError(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data;
    if (data?.errors?.length) return data.errors[0].message;
    return data?.message ?? fallback;
  }
  return fallback;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilPage() {
  const toast = useRef<Toast>(null);

  const [profile,     setProfile]     = useState<ProfileData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.me();
      setProfile(res.data.data);
    } catch {
      setError('Impossible de charger votre profil.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await authApi.changePassword(values.currentPassword, values.newPassword);
      toast.current?.show({
        severity: 'success',
        summary:  'Mot de passe modifié',
        detail:   'Votre mot de passe a été mis à jour avec succès.',
        life:     4000,
      });
      reset();
    } catch (err) {
      toast.current?.show({
        severity: 'error',
        summary:  'Erreur',
        detail:   extractError(err, 'Impossible de modifier le mot de passe.'),
        life:     4000,
      });
    } finally {
      setSubmitting(false);
    }
  });

  if (loading) return <LoadingSpinner />;
  if (error || !profile) return <ErrorMessage message={error ?? 'Profil introuvable.'} onRetry={load} />;

  const role      = profile.role as Role;
  const roleLabel = roleLabels[role] ?? profile.role;
  const roleCls   = roleColors[role]  ?? 'bg-gray-100 text-gray-600';

  return (
    <>
      <Toast ref={toast} />

      <PageHeader
        title="Mon profil"
        breadcrumb={[{ label: 'Mon profil' }]}
      />

      {/* ── Informations ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#1e293b]">Informations</h2>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${roleCls}`}>
            {roleLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
          <div>
            <span className="text-gray-500">Prénom</span>
            <p className="font-medium text-[#1e293b] mt-0.5">{profile.prenom}</p>
          </div>
          <div>
            <span className="text-gray-500">Nom</span>
            <p className="font-medium text-[#1e293b] mt-0.5">{profile.nom}</p>
          </div>
          <div>
            <span className="text-gray-500">Nom d&apos;utilisateur</span>
            <p className="font-medium text-[#1e293b] mt-0.5">{profile.username}</p>
          </div>
          <div>
            <span className="text-gray-500">Téléphone</span>
            <p className="font-medium text-[#1e293b] mt-0.5">{profile.telephone}</p>
          </div>
          {profile.email && (
            <div>
              <span className="text-gray-500">Email</span>
              <p className="font-medium text-[#1e293b] mt-0.5">{profile.email}</p>
            </div>
          )}
          <div>
            <span className="text-gray-500">Membre depuis</span>
            <p className="font-medium text-[#1e293b] mt-0.5">{formatDate(profile.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* ── Changer le mot de passe ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-[#1e293b] mb-4">Changer le mot de passe</h2>

        <form onSubmit={onSubmit} className="space-y-4 max-w-md">

          {/* Mot de passe actuel */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Mot de passe actuel <span className="text-red-500">*</span>
            </label>
            <Controller
              name="currentPassword"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <InputText
                    {...field}
                    type={showCurrent ? 'text' : 'password'}
                    className={`w-full pr-10 ${errors.currentPassword ? 'p-invalid' : ''}`}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    <i className={`pi ${showCurrent ? 'pi-eye-slash' : 'pi-eye'} text-sm`} />
                  </button>
                </div>
              )}
            />
            {errors.currentPassword && (
              <p className="text-xs text-[#991b1b] mt-1">{errors.currentPassword.message}</p>
            )}
          </div>

          {/* Nouveau mot de passe */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Nouveau mot de passe <span className="text-red-500">*</span>
            </label>
            <Controller
              name="newPassword"
              control={control}
              render={({ field }) => (
                <Password
                  {...field}
                  className={`w-full ${errors.newPassword ? 'p-invalid' : ''}`}
                  inputClassName="w-full"
                  placeholder="Min. 8 caractères"
                  autoComplete="new-password"
                  toggleMask
                  promptLabel="Choisissez un mot de passe"
                  weakLabel="Faible"
                  mediumLabel="Moyen"
                  strongLabel="Fort"
                />
              )}
            />
            {errors.newPassword && (
              <p className="text-xs text-[#991b1b] mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Confirmation */}
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-1">
              Confirmer le nouveau mot de passe <span className="text-red-500">*</span>
            </label>
            <Controller
              name="confirm"
              control={control}
              render={({ field }) => (
                <Password
                  {...field}
                  className={`w-full ${errors.confirm ? 'p-invalid' : ''}`}
                  inputClassName="w-full"
                  placeholder="Répéter le mot de passe"
                  autoComplete="new-password"
                  toggleMask
                  feedback={false}
                />
              )}
            />
            {errors.confirm && (
              <p className="text-xs text-[#991b1b] mt-1">{errors.confirm.message}</p>
            )}
          </div>

          <div className="pt-1">
            <Button
              type="submit"
              label="Enregistrer"
              icon="pi pi-check"
              loading={submitting}
              style={{ backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }}
            />
          </div>
        </form>
      </div>
    </>
  );
}
