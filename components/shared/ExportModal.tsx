'use client';

import { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { SelectButton } from 'primereact/selectbutton';
// import { Calendar } from 'primereact/calendar'; // TODO: réactiver avec filtrage par date
import { exportApi, downloadBlob, ExportFormat } from '@/services/export.api';
import ErrorMessage from './ErrorMessage';

// ─── Types ────────────────────────────────────────────────────────────────────

type ExportEndpoint = 'paiements' | 'arrieres' | 'logements' | 'locataires' | 'batiments' | 'occupations' | 'complet';

interface Props {
  visible: boolean;
  onHide: () => void;
  /** Nom lisible de l'entité exportée (ex : "Paiements") */
  entityLabel: string;
  /** Endpoint export à appeler */
  endpoint: ExportEndpoint;
  /** Afficher le filtre bâtiment */
  batimentId?: number;
  /** Afficher le filtre logement */
  logementId?: number;
}

// ─── Options format ───────────────────────────────────────────────────────────

const FORMAT_OPTIONS = [
  { label: 'Excel', value: 'excel', icon: 'pi pi-file-excel' },
  { label: 'PDF',   value: 'pdf',   icon: 'pi pi-file-pdf'   },
];

// ─── Composant ────────────────────────────────────────────────────────────────

export default function ExportModal({
  visible,
  onHide,
  entityLabel,
  endpoint,
  batimentId,
  logementId,
}: Props) {
  const [format,  setFormat]  = useState<ExportFormat>('excel');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // ── Déclenchement de l'export ──────────────────────────────────────────────

  async function handleExport() {
    setError(null);
    setLoading(true);

    const params = {
      format,
      // dateDebut et dateFin omis temporairement (filtrage backend à finaliser)
      batimentId,
      logementId,
    };

    try {
      const response = endpoint === 'complet'
        ? await exportApi.complet(params)
        : await exportApi[endpoint](params);

      const ext      = format === 'excel' ? 'xlsx' : 'pdf';
      const date     = new Date().toISOString().slice(0, 10);
      const filename = `${endpoint}_${date}.${ext}`;

      downloadBlob(new Blob([response.data]), filename);
      onHide();
    } catch {
      setError('Le téléchargement a échoué. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  // ── Réinitialisation à la fermeture ────────────────────────────────────────

  function handleHide() {
    setFormat('excel');
    setError(null);
    onHide();
  }

  // ── Footer ─────────────────────────────────────────────────────────────────

  const footer = (
    <div className="flex justify-end gap-2">
      <Button
        label="Annuler"
        severity="secondary"
        outlined
        onClick={handleHide}
        disabled={loading}
      />
      <Button
        label="Télécharger"
        icon="pi pi-download"
        onClick={handleExport}
        loading={loading}
        style={{ backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }}
      />
    </div>
  );

  // ── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <Dialog
      visible={visible}
      onHide={handleHide}
      header={`Exporter — ${entityLabel}`}
      footer={footer}
      style={{ width: '420px' }}
      modal
      draggable={false}
      resizable={false}
    >
      <div className="space-y-5 py-2">
        {/* Format */}
        <div>
          <label className="block text-sm font-medium text-[#1e293b] mb-2">
            Format
          </label>
          {/* "complet" ne propose que Excel */}
          {endpoint === 'complet' ? (
            <p className="text-sm text-gray-500">Excel (classeur multi-onglets)</p>
          ) : (
            <SelectButton
              value={format}
              onChange={(e) => setFormat(e.value as ExportFormat)}
              options={FORMAT_OPTIONS}
              optionLabel="label"
              optionValue="value"
            />
          )}
        </div>

        {/* Période — masquée temporairement (filtrage par date à finaliser côté backend) */}
        {/* TODO: réactiver quand le backend gère correctement dateDebut/dateFin pour chaque entité */}

        {/* Erreur */}
        <ErrorMessage message={error} inline />
      </div>
    </Dialog>
  );
}
