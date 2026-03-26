'use client';

import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

// ─── Fonction impérative pour déclencher la dialog ────────────────────────────

interface ShowConfirmOptions {
  message: string;
  header?: string;
  /** Texte du bouton de confirmation (défaut : "Supprimer") */
  acceptLabel?: string;
  /** Texte du bouton d'annulation (défaut : "Annuler") */
  rejectLabel?: string;
  /** Appelé quand l'utilisateur confirme */
  onAccept: () => void;
  /** Appelé quand l'utilisateur annule (optionnel) */
  onReject?: () => void;
}

export function showConfirm({
  message,
  header = 'Confirmation',
  acceptLabel = 'Supprimer',
  rejectLabel = 'Annuler',
  onAccept,
  onReject,
}: ShowConfirmOptions) {
  confirmDialog({
    message,
    header,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel,
    rejectLabel,
    acceptClassName: 'p-button-danger',
    rejectClassName: 'p-button-secondary p-button-outlined',
    accept: onAccept,
    reject: onReject,
  });
}

// ─── Provider à monter une seule fois dans le layout ──────────────────────────

/**
 * À placer une seule fois dans le layout dashboard.
 * Requis pour que `showConfirm()` puisse afficher la dialog.
 */
export function ConfirmDialogProvider() {
  return <ConfirmDialog />;
}
