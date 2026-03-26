'use client';

import { useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { useAppSelector } from '@/store/hooks';

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadType = 'contrat' | 'preuve';

interface Props {
  /** Détermine les limites lues depuis Redux (contrat ou preuve) */
  uploadType: UploadType;
  /** Appelé avec les fichiers validés — le parent déclenche l'appel API */
  onFilesSelected: (files: File[]) => void;
  /** Désactiver le composant (pendant l'upload par exemple) */
  disabled?: boolean;
  /** Fichiers déjà sélectionnés (pour affichage en mode édition) */
  existingFiles?: { nomOriginal: string; taille: number }[];
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function mimeLabel(mime: string): string {
  const MAP: Record<string, string> = {
    'application/pdf': 'PDF',
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  };
  return MAP[mime] ?? mime;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function FileUploader({
  uploadType,
  onFilesSelected,
  disabled = false,
  existingFiles = [],
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Limites lues depuis Redux (configurées par le backend via GET /config)
  const config = useAppSelector((s) => s.config.config);
  const limits = config?.upload[uploadType];

  const maxSizeMb = limits?.maxSizeMb ?? (uploadType === 'contrat' ? 10 : 5);
  const maxFiles  = limits?.maxFiles  ?? (uploadType === 'contrat' ? 1  : 10);
  const mimeTypes = limits?.mimeTypes ?? [];

  // ── Validation et sélection ────────────────────────────────────────────────

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newErrors: string[] = [];
    const valid: File[] = [];

    if (files.length > maxFiles) {
      newErrors.push(`Maximum ${maxFiles} fichier${maxFiles > 1 ? 's' : ''} autorisé${maxFiles > 1 ? 's' : ''}.`);
    } else {
      for (const file of files) {
        const sizeMb = file.size / (1024 * 1024);
        if (mimeTypes.length > 0 && !mimeTypes.includes(file.type)) {
          newErrors.push(`"${file.name}" : format non autorisé (${mimeTypes.map(mimeLabel).join(', ')}).`);
        } else if (sizeMb > maxSizeMb) {
          newErrors.push(`"${file.name}" dépasse la taille maximale (${maxSizeMb} Mo).`);
        } else {
          valid.push(file);
        }
      }
    }

    setErrors(newErrors);

    if (newErrors.length === 0 && valid.length > 0) {
      setSelectedFiles(valid);
      onFilesSelected(valid);
    }

    // Réinitialiser l'input pour permettre de re-sélectionner le même fichier
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeFile(index: number) {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    onFilesSelected(updated);
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────

  const hasSelection = selectedFiles.length > 0;
  const acceptAttr   = mimeTypes.length > 0 ? mimeTypes.join(',') : undefined;

  return (
    <div className="space-y-3">
      {/* Zone de clic */}
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        className={[
          'flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors',
          disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-[#93c5fd] bg-[#f0f9ff] hover:bg-[#dbeafe]',
        ].join(' ')}
      >
        <i className="pi pi-cloud-upload text-3xl text-[#3b82f6]" />
        <p className="text-sm text-gray-600 text-center">
          Cliquez pour sélectionner{maxFiles > 1 ? ` (max ${maxFiles} fichiers)` : ''}
        </p>
        <p className="text-xs text-gray-400">
          {mimeTypes.length > 0
            ? `${mimeTypes.map(mimeLabel).join(', ')} — max ${maxSizeMb} Mo${maxFiles > 1 ? '/fichier' : ''}`
            : `Max ${maxSizeMb} Mo`}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={acceptAttr}
          className="hidden"
          disabled={disabled}
          onChange={handleChange}
        />
      </div>

      {/* Erreurs de validation */}
      {errors.length > 0 && (
        <ul className="space-y-1">
          {errors.map((err, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-[#991b1b] bg-[#fee2e2] px-3 py-2 rounded-md"
            >
              <i className="pi pi-exclamation-circle mt-0.5 shrink-0" />
              {err}
            </li>
          ))}
        </ul>
      )}

      {/* Fichiers sélectionnés */}
      {hasSelection && (
        <ul className="space-y-2">
          {selectedFiles.map((file, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <i className="pi pi-file text-[#3b82f6] shrink-0" />
                <span className="text-sm text-[#1e293b] truncate">{file.name}</span>
                <span className="text-xs text-gray-400 shrink-0">({formatSize(file.size)})</span>
              </div>
              <Button
                icon="pi pi-times"
                rounded
                text
                severity="danger"
                size="small"
                onClick={() => removeFile(i)}
                disabled={disabled}
                aria-label="Retirer"
              />
            </li>
          ))}
        </ul>
      )}

      {/* Fichiers existants (mode édition) */}
      {!hasSelection && existingFiles.length > 0 && (
        <ul className="space-y-2">
          {existingFiles.map((file, i) => (
            <li
              key={i}
              className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
            >
              <i className="pi pi-file-check text-[#166534] shrink-0" />
              <span className="text-sm text-[#1e293b] truncate">{file.nomOriginal}</span>
              <span className="text-xs text-gray-400 shrink-0">({formatSize(file.taille)})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
