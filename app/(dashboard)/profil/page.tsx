'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { authApi } from '@/services/auth.api';
import { organisationsApi } from '@/services/organisations.api';
import { Role } from '@/types/enums';
import type { OrganisationUsage } from '@/types/organisation';
import { roleLabels, roleColors } from '@/utils/role';
import { isMultiTenant } from '@/utils/tenant';

import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorMessage from '@/components/shared/ErrorMessage';
import { formatDate } from '@/utils/date';
import { extractError } from '@/utils/error';

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilPage() {
  const toast = useRef<Toast>(null);

  const [profile,     setProfile]     = useState<ProfileData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);

  const [orgUsage,  setOrgUsage]  = useState<OrganisationUsage | null>(null);
  const [orgError,  setOrgError]  = useState<string | null>(null);

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

  useEffect(() => {
    // La section abonnement n'a de sens que sur la pile SaaS multi-tenant :
    // GET /organisations/me n'existe pas sur la pile classique et y échouerait
    // systématiquement (voir isMultiTenant() dans utils/tenant.ts).
    if (!isMultiTenant() || profile?.role !== Role.ADMIN_GLOBAL) return;
    organisationsApi.getMine()
      .then((res) => setOrgUsage(res.data.data))
      .catch(() => setOrgError('Impossible de charger les informations de votre organisation.'));
  }, [profile?.role]);

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

      {/* ── Abonnement (ADMIN_GLOBAL uniquement) ────────────────────────────── */}
      {isMultiTenant() && role === Role.ADMIN_GLOBAL && (orgUsage || orgError) && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-[#1e293b] mb-4">Votre abonnement</h2>

          {orgError && <p className="text-sm text-[#991b1b]">{orgError}</p>}

          {orgUsage && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div>
                  <span className="text-gray-500">Organisation</span>
                  <p className="font-medium text-[#1e293b] mt-0.5">{orgUsage.nom}</p>
                </div>
                <div>
                  <span className="text-gray-500">Identifiant</span>
                  <p className="font-medium text-[#1e293b] mt-0.5">{orgUsage.slug}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-500">Logements</span>
                  <span className="text-sm font-semibold text-[#1e293b]">
                    {orgUsage.logementLimit === null
                      ? `${orgUsage.logementsUtilises} (illimité)`
                      : `${orgUsage.logementsUtilises} / ${orgUsage.logementLimit}`}
                  </span>
                </div>

                {orgUsage.logementLimit !== null && (() => {
                  const pct = Math.min(100, (orgUsage.logementsUtilises / orgUsage.logementLimit) * 100);
                  const atLimit  = orgUsage.logementsUtilises >= orgUsage.logementLimit;
                  const nearLimit = !atLimit && pct >= 80;
                  const barColor = atLimit ? '#991b1b' : nearLimit ? '#92400e' : '#1e3a8a';
                  return (
                    <>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: barColor }}
                        />
                      </div>
                      {atLimit && (
                        <p className="text-xs text-[#991b1b] mt-1.5">
                          Quota atteint — contactez-nous pour passer à un palier supérieur.
                        </p>
                      )}
                      {nearLimit && (
                        <p className="text-xs text-[#92400e] mt-1.5">
                          Vous approchez du quota de logements de votre palier.
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

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
