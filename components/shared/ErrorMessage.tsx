'use client';

import { Button } from 'primereact/button';

interface Props {
  /** Message d'erreur à afficher. Si null/undefined, le composant ne rend rien. */
  message?: string | null;
  /** Callback optionnel pour réessayer l'opération ayant échoué */
  onRetry?: () => void;
  /** Affichage compact (sans centrage vertical) */
  inline?: boolean;
}

export default function ErrorMessage({ message, onRetry, inline = false }: Props) {
  if (!message) return null;

  return (
    <div
      className={[
        'flex flex-col items-center gap-3',
        inline ? 'py-4' : 'py-12',
      ].join(' ')}
    >
      <div className="flex items-start gap-2 bg-[#fee2e2] text-[#991b1b] px-4 py-3 rounded-lg max-w-md">
        <i className="pi pi-exclamation-triangle text-base mt-0.5 shrink-0" />
        <p className="text-sm font-medium leading-snug">{message}</p>
      </div>

      {onRetry && (
        <Button
          label="Réessayer"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          size="small"
          onClick={onRetry}
        />
      )}
    </div>
  );
}
