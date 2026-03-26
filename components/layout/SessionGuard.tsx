'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSessionExpired } from '@/store/uiSlice';

/**
 * Écoute le flag `sessionExpired` dans Redux.
 * Quand il passe à true (déclenché par l'intercepteur Axios) :
 *  1. Affiche un toast d'avertissement
 *  2. Redirige vers /login après 3 secondes
 *
 * Ce composant est monté dans le layout dashboard afin que
 * la notification soit toujours visible à l'utilisateur.
 */
export default function SessionGuard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const sessionExpired = useAppSelector((s) => s.ui.sessionExpired);
  const toastRef = useRef<Toast>(null);

  useEffect(() => {
    if (!sessionExpired) return;

    // Acquitter immédiatement pour éviter un double affichage après refresh de page
    dispatch(setSessionExpired(false));

    toastRef.current?.show({
      severity: 'warn',
      summary: 'Session expirée',
      detail: 'Votre session a expiré. Veuillez vous reconnecter.',
      life: 4000,
    });

    const timer = setTimeout(() => {
      router.push('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [sessionExpired, dispatch, router]);

  return <Toast ref={toastRef} position="top-right" />;
}
