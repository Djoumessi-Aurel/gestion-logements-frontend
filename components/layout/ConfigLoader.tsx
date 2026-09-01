'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setConfig, setConfigError } from '@/store/configSlice';
import { configApi } from '@/services/config.api';

/**
 * Charge les limites d'upload depuis `GET /config` (route publique) et les place
 * dans le store au montage du layout dashboard.
 *
 * Le slice `config` n'est volontairement pas persisté : les limites sont
 * rechargées à chaque démarrage, pour qu'un changement des variables
 * UPLOAD_* côté backend soit pris en compte sans purger le storage du client.
 *
 * Monté dans le layout dashboard plutôt qu'à la racine : seuls les écrans
 * authentifiés utilisent FileUploader, et cela évite un appel API depuis la page
 * publique /presentation — dont le coût n'est pas anecdotique, l'API étant
 * hébergée sur une offre qui démarre à froid en ~45 s.
 *
 * Ne rend rien.
 */

// L'API peut être en démarrage à froid : on retente avant d'abandonner.
const RETRY_DELAYS_MS = [2000, 5000, 15000];

export default function ConfigLoader() {
  const dispatch = useAppDispatch();
  const loaded = useAppSelector((s) => s.config.loaded);

  useEffect(() => {
    if (loaded) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function attempt(index: number) {
      try {
        const res = await configApi.get();
        if (cancelled) return;
        dispatch(setConfig(res.data.data));
      } catch {
        if (cancelled) return;
        if (index < RETRY_DELAYS_MS.length) {
          timer = setTimeout(() => attempt(index + 1), RETRY_DELAYS_MS[index]);
        } else {
          dispatch(
            setConfigError(
              "Les limites d'upload n'ont pas pu être récupérées auprès du serveur.",
            ),
          );
        }
      }
    }

    attempt(0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [loaded, dispatch]);

  return null;
}
