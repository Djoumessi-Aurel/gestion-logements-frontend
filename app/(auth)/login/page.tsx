'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/authSlice';
import { setSessionExpired } from '@/store/uiSlice';
import { authApi } from '@/services/auth.api';
import { setAccessTokenCookie } from '@/utils/cookies';
import { Role } from '@/types/enums';
import type { AxiosError } from 'axios';

const schema = z.object({
  username: z.string().min(1, 'Le nom d\'utilisateur est requis'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

type FormValues = z.infer<typeof schema>;

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ statusCode: number; message: string }>;
  const status = axiosError.response?.status;
  const message = axiosError.response?.data?.message;

  if (status === 429) return 'Trop de tentatives de connexion. Réessayez dans 1 minute.';
  if (status === 401) return message ?? 'Identifiants invalides ou compte désactivé.';
  return message ?? 'Une erreur inattendue s\'est produite.';
}

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  });

  async function onSubmit(values: FormValues) {
    setErrorMsg(null);
    // Effacer le flag session expirée si l'utilisateur revient après expiration
    dispatch(setSessionExpired(false));

    try {
      const res = await authApi.login(values.username, values.password);
      const { access_token, user } = res.data.data;

      dispatch(setCredentials({ accessToken: access_token, user }));
      setAccessTokenCookie(access_token);

      // Redirection selon le rôle
      if (user.role === Role.LOCATAIRE) {
        router.push('/locataire');
      } else {
        router.push('/');
      }
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-[#1e293b] mb-6">Connexion</h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {/* Message d'erreur global */}
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
            autoComplete="username"
            autoFocus
          />
          {errors.username && (
            <small className="text-red-600 text-xs">{errors.username.message}</small>
          )}
        </div>

        {/* Password — Controller requis : Password PrimeReact est un composant composé
            qui ne transmet pas correctement le ref de register() */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-[#1e293b]">
            Mot de passe
          </label>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Password
                inputId="password"
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                placeholder="Entrez votre mot de passe"
                feedback={false}
                toggleMask
                inputClassName={errors.password ? 'p-invalid w-full' : 'w-full'}
                className="w-full"
                autoComplete="current-password"
              />
            )}
          />
          {errors.password && (
            <small className="text-red-600 text-xs">{errors.password.message}</small>
          )}
        </div>

        {/* Lien mot de passe oublié */}
        <div className="text-right -mt-2">
          <Link
            href="/forgot-password"
            className="text-sm text-[#3b82f6] hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        {/* Bouton submit */}
        <Button
          type="submit"
          label={isSubmitting ? 'Connexion en cours…' : 'Se connecter'}
          icon={isSubmitting ? 'pi pi-spin pi-spinner' : 'pi pi-sign-in'}
          iconPos="left"
          disabled={isSubmitting}
          className="w-full text-white bg-[#1e3a8a] border-[#1e3a8a] hover:bg-[#1e40af]"
        />
      </form>
    </>
  );
}
