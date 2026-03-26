'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { authApi } from '@/services/auth.api';
import type { AxiosError } from 'axios';

const schema = z.object({
  username: z.string().min(1, 'Le nom d\'utilisateur est requis'),
  email: z.string().min(1, 'L\'adresse email est requise').email('Email invalide'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setErrorMsg(null);
    try {
      await authApi.forgotPassword(values.username, values.email);
    } catch (err) {
      const axiosError = err as AxiosError<{ statusCode: number; message: string }>;
      if (axiosError.response?.status === 429) {
        setErrorMsg('Trop de demandes. Réessayez dans 1 minute.');
        return;
      }
      // Toute autre erreur : afficher le message générique
      // (ne pas révéler si le compte existe ou non)
    }
    // Toujours afficher le message de succès (même si compte inexistant)
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-4">
          <i className="pi pi-check text-green-600 text-2xl" />
        </div>
        <h2 className="text-xl font-semibold text-[#1e293b] mb-2">Email envoyé</h2>
        <p className="text-sm text-gray-500 mb-6">
          Si ce compte existe, un email de réinitialisation a été envoyé à l&apos;adresse indiquée.
        </p>
        <Link
          href="/login"
          className="text-sm text-[#3b82f6] hover:underline font-medium"
        >
          ← Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-[#1e293b] mb-1">Mot de passe oublié</h2>
      <p className="text-sm text-gray-500 mb-6">
        Renseignez votre identifiant et votre email pour recevoir un lien de réinitialisation.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {errorMsg && (
          <Message severity="error" text={errorMsg} className="w-full justify-start" />
        )}

        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="username" className="text-sm font-medium text-[#1e293b]">
            Nom d&apos;utilisateur
          </label>
          <InputText
            id="username"
            {...register('username')}
            placeholder="Entrez votre identifiant"
            className={errors.username ? 'p-invalid w-full' : 'w-full'}
            autoFocus
          />
          {errors.username && (
            <small className="text-red-600 text-xs">{errors.username.message}</small>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-[#1e293b]">
            Adresse email
          </label>
          <InputText
            id="email"
            type="email"
            {...register('email')}
            placeholder="votre@email.com"
            className={errors.email ? 'p-invalid w-full' : 'w-full'}
            autoComplete="email"
          />
          {errors.email && (
            <small className="text-red-600 text-xs">{errors.email.message}</small>
          )}
        </div>

        <Button
          type="submit"
          label={isSubmitting ? 'Envoi en cours…' : 'Envoyer le lien'}
          icon={isSubmitting ? 'pi pi-spin pi-spinner' : 'pi pi-send'}
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
