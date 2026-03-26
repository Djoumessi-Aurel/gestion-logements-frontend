'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { authApi } from '@/services/auth.api';
import type { AxiosError } from 'axios';

const schema = z
  .object({
    newPassword: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirmPassword: z.string().min(1, 'La confirmation est requise'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  // Token absent → afficher une erreur directement
  if (!token) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-4">
          <i className="pi pi-times text-red-600 text-2xl" />
        </div>
        <h2 className="text-xl font-semibold text-[#1e293b] mb-2">Lien invalide</h2>
        <p className="text-sm text-gray-500 mb-6">
          Ce lien de réinitialisation est invalide ou a expiré.
        </p>
        <Link href="/forgot-password" className="text-sm text-[#3b82f6] hover:underline font-medium">
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  async function onSubmit(values: FormValues) {
    setErrorMsg(null);
    try {
      await authApi.resetPassword(token, values.newPassword);
      setSuccessMsg('Mot de passe réinitialisé avec succès.');
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      const axiosError = err as AxiosError<{ statusCode: number; message: string }>;
      const status = axiosError.response?.status;
      if (status === 400) {
        setErrorMsg('Lien invalide ou expiré. Veuillez faire une nouvelle demande.');
      } else if (status === 429) {
        setErrorMsg('Trop de tentatives. Réessayez dans 1 minute.');
      } else {
        setErrorMsg(axiosError.response?.data?.message ?? 'Une erreur inattendue s\'est produite.');
      }
    }
  }

  if (successMsg) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-4">
          <i className="pi pi-check text-green-600 text-2xl" />
        </div>
        <h2 className="text-xl font-semibold text-[#1e293b] mb-2">Mot de passe réinitialisé</h2>
        <p className="text-sm text-gray-500">Redirection vers la connexion…</p>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-[#1e293b] mb-1">Nouveau mot de passe</h2>
      <p className="text-sm text-gray-500 mb-6">Choisissez un mot de passe d&apos;au moins 8 caractères.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {errorMsg && (
          <Message severity="error" text={errorMsg} className="w-full justify-start" />
        )}

        {/* Nouveau mot de passe */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="newPassword" className="text-sm font-medium text-[#1e293b]">
            Nouveau mot de passe
          </label>
          <Controller
            name="newPassword"
            control={control}
            render={({ field }) => (
              <Password
                inputId="newPassword"
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                placeholder="Minimum 8 caractères"
                toggleMask
                inputClassName={errors.newPassword ? 'p-invalid w-full' : 'w-full'}
                className="w-full"
                autoComplete="new-password"
                autoFocus
              />
            )}
          />
          {errors.newPassword && (
            <small className="text-red-600 text-xs">{errors.newPassword.message}</small>
          )}
        </div>

        {/* Confirmation */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-[#1e293b]">
            Confirmer le mot de passe
          </label>
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <Password
                inputId="confirmPassword"
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                placeholder="Répétez le mot de passe"
                feedback={false}
                toggleMask
                inputClassName={errors.confirmPassword ? 'p-invalid w-full' : 'w-full'}
                className="w-full"
                autoComplete="new-password"
              />
            )}
          />
          {errors.confirmPassword && (
            <small className="text-red-600 text-xs">{errors.confirmPassword.message}</small>
          )}
        </div>

        <Button
          type="submit"
          label={isSubmitting ? 'Enregistrement…' : 'Réinitialiser le mot de passe'}
          icon={isSubmitting ? 'pi pi-spin pi-spinner' : 'pi pi-lock'}
          iconPos="left"
          disabled={isSubmitting}
          className="w-full bg-[#1e3a8a] border-[#1e3a8a] hover:bg-[#1e40af]"
        />

        <div className="text-center">
          <Link href="/login" className="text-sm text-[#3b82f6] hover:underline">
            ← Retour à la connexion
          </Link>
        </div>
      </form>
    </>
  );
}
